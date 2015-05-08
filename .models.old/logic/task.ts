// logic about tasks
import Sequelize = require("sequelize");
import helper = require("./helper");
import models = require("../index");
import ReCalLib = require("../../lib/lib");
import Q = require('q');

import PromiseAdapter = ReCalLib.PromiseAdapter;

module TaskLogic
{
    function verifyTaskObject(taskObject: Interfaces.TaskObject): Q.Promise<void>
    {
        return helper.modelInstanceExists(models.TaskGroup, taskObject.taskInfo.taskGroup.id)
            .then((exists) =>
        {
            if (!exists)
            {
                throw new Error("Task Group with ID " + taskObject.taskInfo.taskGroup.id + " does not exist.");
            }
            return helper.modelInstanceExists(models.User, taskObject.userId);
        }).then((exists) =>
        {
            if (!exists)
            {
                throw new Error("User with ID " + taskObject.userId + " does not exist.");
            }
        })
    }

    export function exportTaskGroup(taskGroupModel: any): Q.Promise<Interfaces.TaskGroupObject>
    {
        return Q.fcall(() =>
        {
            return {
                id: taskGroupModel.id,
                name: taskGroupModel.name
            }
        })
    }

    export function exportTaskInfo(taskInfoModel: any): Q.Promise<Interfaces.TaskInfoObject>
    {
        return taskInfoModel.getTaskGroup()
            .then(exportTaskGroup)
            .then((taskGroupObject) =>
        {
            return {
                id: taskInfoModel.id,
                title: taskInfoModel.title,
                privacy: taskInfoModel.privacy,
                taskGroup: taskGroupObject
            };
        })
    }

    export function exportTask(taskModel: any): Q.Promise<Interfaces.TaskObject>
    {
        let taskInfoPromise: Q.Promise<any> = PromiseAdapter.convertSequelize(taskModel.getTaskInfo());
        let userPromise: Q.Promise<any> = PromiseAdapter.convertSequelize(taskModel.getUser());
        return Q.spread([taskInfoPromise, userPromise], (taskInfoModel, userModel) =>
        {
            return exportTaskInfo(taskInfoModel).then((taskInfoObject) =>
            {
                return {
                    id: taskModel.id,
                    userId: userModel.id,
                    status: taskModel.status,
                    taskInfo: taskInfoObject
                };
            })
        });
    }

    export function createTask(taskObject: Interfaces.TaskObject): Q.Promise<Interfaces.TaskObject>
    {
        return verifyTaskObject(taskObject)
            .then(() =>
        {
            if (taskObject.id !== null && taskObject.id !== undefined)
            {
                throw new Error("Task ID cannot exist when trying to create a task.");
            }
            if (taskObject.taskInfo.id !== null && taskObject.taskInfo.id !== undefined)
            {
                throw new Error("Task Info ID cannot exist when trying to create a task.");
            }
        }).then(() =>
        {
            return PromiseAdapter.convertSequelize(models.TaskGroup.find(taskObject.taskInfo.taskGroup.id));
        }).then((taskGroupModel) =>
        {
            return PromiseAdapter.convertSequelize(models.TaskInfo.create({
                title: taskObject.taskInfo.title,
                privacy: taskObject.taskInfo.privacy,
                TaskGroupId: taskGroupModel.id
            }))
        }).then((taskInfoModel) =>
        {
            return PromiseAdapter.convertSequelize(models.Task.create({
                status: taskObject.status,
                TaskInfoId: taskInfoModel.id,
                UserId: taskObject.userId
            }))
        }).then(exportTask);
    }
    export function updateTaskInfo(taskObject: Interfaces.TaskObject): Q.Promise<Interfaces.TaskObject>
    {
        return verifyTaskObject(taskObject)
            .then(() =>
        {
            if (taskObject.id === null || taskObject.id === undefined)
            {
                throw new Error("Task ID must exist when trying to update a task.");
            }
            if (taskObject.taskInfo.id === null || taskObject.taskInfo.id === undefined)
            {
                throw new Error("Task Info ID must exist when trying to update a task.");
            }
        }).then(() =>
        {
            return Q.all([
                helper.modelInstanceExists(models.Task, taskObject.id),
                helper.modelInstanceExists(models.TaskInfo, taskObject.taskInfo.id)
            ])
        }).spread<void>((taskExists, taskInfoExists) =>
        {
            if (!taskExists)
            {
                throw new Error("Task ID must correspond to a database row");
            }
            if (!taskInfoExists)
            {
                throw new Error("Task Info ID must correspond to a database row");
            }
        }).then(() =>
        {
            return Q.all([
                models.User.find(taskObject.userId),
                models.Task.find(taskObject.id),
                models.TaskInfo.find(taskObject.taskInfo.id),
                models.TaskGroup.find(taskObject.taskInfo.taskGroup.id)
            ].map(PromiseAdapter.convertSequelize))
        }).spread<any[]>((userModel, taskModel, taskInfoModel, taskGroupModel) =>
        {
            if (taskModel.status !== taskObject.status)
            {
                throw new Error("Cannot change task status using the updateTaskInfo method")
            }
            if (taskInfoModel.privacy !== taskObject.taskInfo.privacy)
            {
                throw new Error("Cannot change task privacy using the updateTaskInfo method");
            }
            if (taskModel.TaskInfoId !== taskObject.taskInfo.id)
            {
                throw new Error("The given Task-TaskInfo relationship does not exist");
            }
            if (taskInfoModel.TaskGroupId !== taskObject.taskInfo.taskGroup.id)
            {
                throw new Error("The given TaskInfo-TaskGroup relationship does not exist");
            }
            return [userModel, taskModel, taskInfoModel, taskGroupModel];
        }).spread<any>((userModel, taskModel, taskInfoModel, taskGroupModel) =>
        {
            return models.TaskInfo.create({
                title: taskObject.taskInfo.title,
                privacy: taskObject.taskInfo.privacy,
                PreviousVersionId: taskObject.taskInfo.id,
                TaskGroupId: taskObject.taskInfo.taskGroup.id
            }).then((createdTaskInfo) =>
            {
                return taskModel.setTaskInfo(createdTaskInfo)
            }).then(() =>
            {
                return taskModel.save();
            }).then(() =>
            {
                return taskModel;
            })
        }).then((taskModel) =>
        {
            return exportTask(taskModel);
        })
    }
}

module TaskLogic
{
    export module Interfaces
    {
        export interface TaskGroupObject
        {
            id: number,
            name: string
        }
        export interface TaskInfoObject
        {
            id?: number,
            title: string,
            privacy: string,
            taskGroup: TaskGroupObject,
        }
        export interface TaskObject
        {
            id?: number, // optional since new objects don't have id
            userId: number,
            status: string,
            taskInfo: TaskInfoObject,
        }
    }
}

export = TaskLogic;
