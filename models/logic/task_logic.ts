import assert = require('assert');
import mongoose = require('mongoose');
import Q = require('q');

import PromiseAdapter = require('../../lib/promise_adapter');
import PlainObject = require('./plain_object');

import Task = require('../task');
import TaskInfo = require('../task_info');
import TaskGroup = require('../task_group');

module TaskLogic
{
    export function createTaskInfo(taskInfoPlainObject: PlainObject.Interfaces.TaskInfoPlainObject): Q.Promise<PlainObject.Interfaces.TaskInfoPlainObject>
    {
        return Q.fcall(() =>
        {
            assert(taskInfoPlainObject !== null && taskInfoPlainObject !== undefined);
            assert(taskInfoPlainObject.id === null || taskInfoPlainObject.id === undefined);
        }).then(() =>
        {
            return PromiseAdapter.convertMongooseQuery(TaskGroup.model.count({
                _id: (<any>mongoose.Types.ObjectId)(taskInfoPlainObject.taskGroup.id),
                _name: taskInfoPlainObject.taskGroup.name,
                _identifier: taskInfoPlainObject.taskGroup.identifier,
            })).then((count) => { assert(count > 0, "Task Group Plain Object must correspond to a valid Task Group instance.") })
        }).then(() =>
        {
            const taskInfo = <TaskInfo.Instance> new TaskInfo.model({
                _title: taskInfoPlainObject.title,
                _description: taskInfoPlainObject.description,
                _privacy: taskInfoPlainObject.privacy,
                _taskGroup: (<any>mongoose.Types.ObjectId)(taskInfoPlainObject.taskGroup.id),
                _previousVersion: taskInfoPlainObject.previousVersionId ? (<any>mongoose.Types.ObjectId)(taskInfoPlainObject.previousVersionId) : undefined
            })
            return PromiseAdapter.convertMongooseDocumentSave(taskInfo);
        }).then((taskInfo) =>
        {
            return PlainObject.convertTaskInfoInstance(taskInfo)
        })
    }

    export function createTask(taskPlainObject: PlainObject.Interfaces.TaskPlainObject): Q.Promise<PlainObject.Interfaces.TaskPlainObject>
    {
        return Q.fcall(() =>
        {
            assert(taskPlainObject !== null && taskPlainObject !== undefined);
            assert(taskPlainObject.id === null || taskPlainObject.id === undefined);
        }).then(() =>
        {
            if (taskPlainObject.taskInfo.id)
            {
                return PromiseAdapter.convertMongooseQuery(TaskInfo.model.count({
                    _id: (<any>mongoose.Types.ObjectId)(taskPlainObject.taskInfo.id),
                    _title: taskPlainObject.taskInfo.title,
                    _description: taskPlainObject.taskInfo.description,
                    _privacy: taskPlainObject.taskInfo.privacy,
                    _taskGroup: (<any>mongoose.Types.ObjectId)(taskPlainObject.taskInfo.taskGroup.id)
                })).then((count) =>
                {
                    assert(count > 0, "Task Info Plain Object must correspond to a valid Task Info instance.")
                }).then(() =>
                {
                    return taskPlainObject.taskInfo.id;
                })
            }
            else
            {
                return createTaskInfo(taskPlainObject.taskInfo).then((taskInfoPlainObject) => { return taskInfoPlainObject.id });
            }
        }).then((taskInfoId: string) =>
        {
            const task = new Task.model({
                _state: taskPlainObject.state,
                _taskInfo: (<any>mongoose.Types.ObjectId)(taskInfoId)
            })
            return PromiseAdapter.convertMongooseDocumentSave(task)
        }).then((task: Task.Instance) =>
        {
            return PlainObject.convertTaskInstance(task)
        })
    }

    export function updateTask(taskPlainObject: PlainObject.Interfaces.TaskPlainObject): Q.Promise<PlainObject.Interfaces.TaskPlainObject>
    {
        return Q.fcall(() =>
        {
            assert(taskPlainObject !== null && taskPlainObject !== undefined);
            assert(taskPlainObject.id !== null && taskPlainObject.id !== undefined);
        }).then(() =>
        {
            if (taskPlainObject.taskInfo.id)
            {
                return PromiseAdapter.convertMongooseQuery(TaskInfo.model.count({
                    _id: (<any>mongoose.Types.ObjectId)(taskPlainObject.taskInfo.id),
                    _title: taskPlainObject.taskInfo.title,
                    _description: taskPlainObject.taskInfo.description,
                    _privacy: taskPlainObject.taskInfo.privacy,
                    _taskGroup: (<any>mongoose.Types.ObjectId)(taskPlainObject.taskInfo.taskGroup.id)
                })).then((count) =>
                {
                    assert(count > 0, "Task Info Plain Object must correspond to a valid Task Info instance.")
                }).then(() =>
                {
                    return taskPlainObject.taskInfo.id;
                })
            }
            else
            {
                return createTaskInfo(taskPlainObject.taskInfo).then((taskInfoPlainObject) => { return taskInfoPlainObject.id });
            }
        }).then((taskInfoId: string) =>
        {
            return PromiseAdapter.convertMongooseQuery(Task.model.findById(taskPlainObject.id)).then((task: Task.Instance) =>
            {
                task.state = taskPlainObject.state;
                task.taskInfo = (<any>mongoose.Types.ObjectId)(taskInfoId)
                return PromiseAdapter.convertMongooseDocumentSave(task)
            })
        }).then((task: Task.Instance) =>
        {
            return PlainObject.convertTaskInstance(task)
        })
    }
}
export = TaskLogic;
