import assert = require('assert');
import mongoose = require('mongoose');
import Q = require('q');

import models = require('../index');
import Task = require('../task');
import TaskInfo = require('../task_info');
import TaskGroup = require('../task_group');
import User = require('../user');
import PromiseAdapter = require('../../lib/promise_adapter');

module PlainObject
{
    export function convertTaskGroupInstance(taskGroup: TaskGroup.Instance): Q.Promise<Interfaces.TaskGroupPlainObject>
    {
        return Q.fcall(() =>
        {
            assert(taskGroup !== null && taskGroup !== undefined);
            return {
                id: taskGroup.id,
                name: taskGroup.name,
                identifier: taskGroup.identifier
            }
        })
    }

    export function convertTaskInfoInstance(taskInfo: TaskInfo.Instance): Q.Promise<Interfaces.TaskInfoPlainObject>
    {

        return Q.fcall(() =>
        {
            assert(taskInfo !== null && taskInfo !== undefined);
        }).then(() =>
        {
            return PromiseAdapter.convertMongoosePromise((<TaskInfo.Instance>taskInfo.populate('_taskGroup')).execPopulate())
        }).then((taskInfo) =>
        {
            return convertTaskGroupInstance(taskInfo.taskGroup);
        }).then((taskGroupPlainObject) =>
        {
            return {
                id: taskInfo.id,
                title: taskInfo.title,
                description: taskInfo.description,
                privacy: taskInfo.privacy,
                taskGroup: taskGroupPlainObject,
                previousVersionId: taskInfo.previousVersion ? (<any> taskInfo.previousVersion) : undefined
            }
        })
    }

    export function convertTaskInstance(task: Task.Instance): Q.Promise<Interfaces.TaskPlainObject>
    {
        return Q.fcall(() =>
        {
            assert(task !== null && task !== undefined);
        }).then(() =>
        {
            return PromiseAdapter.convertMongoosePromise((<Task.Instance>task.populate('_taskInfo')).execPopulate())
        }).then((task) =>
        {
            return convertTaskInfoInstance(task.taskInfo);
        }).then((taskInfoPlainObject) =>
        {
            return {
                id: task.id,
                state: task.state,
                taskInfo: taskInfoPlainObject
            }
        })
    }

    export function convertUserInstance(user: User.Instance): Q.Promise<Interfaces.UserPlainObject>
    {
        return Q.fcall(() =>
        {
            assert(user !== null && user !== undefined);
        }).then(() =>
        {
            return PromiseAdapter.convertMongooseDocumentPopulate(user, "_taskGroups");
        }).then((user)=> {
            return Q.all(user.taskGroups.map(convertTaskGroupInstance));
        }).then((taskGroups)=>{
            return {
                id: user.id,
                username: user.username,
                taskGroups: taskGroups
            }
        })
    }

    export function validateTaskGroupPlainObject(object: any): boolean
    {
        try
        {
            assert(object !== null && object !== undefined);
            assert(typeof object.id === 'string');
            assert(typeof object.name === 'string');
            return true;
        }
        catch (e)
        {
            return false;
        }
    }
    export function validateTaskInfoPlainObject(object: any): boolean
    {
        try
        {
            assert(object !== null && object !== undefined);
            if (object.id !== undefined)
            {
                assert(typeof object.id === 'string');
            }
            assert(typeof object.title === 'string');
            assert(typeof object.description === 'string');
            assert(typeof TaskInfo.TaskPrivacy[object.privacy] === 'string');
            if (object.previousVersionId !== undefined)
            {
                assert(typeof object.previousVersionId === 'string');
            }
            assert(validateTaskGroupPlainObject(object.taskGroup));
            return true;
        }
        catch (e)
        {
            return false;
        }
    }
    export function validateTaskPlainObject(object: any): boolean
    {
        try
        {
            assert(object !== null && object !== undefined);
            if (object.id !== undefined)
            {
                assert(typeof object.id === 'string');
            }
            assert(typeof Task.TaskState[object.state] === 'string');
            assert(validateTaskInfoPlainObject(object.taskInfo));
            return true;
        }
        catch (e)
        {
            return false;
        }
    }

    export function castTaskPlainObject(object: any): Interfaces.TaskPlainObject
    {
        if (validateTaskPlainObject(object))
        {
            return object;
        }
        else
        {
            return null;
        }
    }
}

module PlainObject
{
    export module Interfaces
    {
        export interface TaskGroupPlainObject
        {
            id?: string,
            name: string,
            identifier: string,
        }
        export interface TaskInfoPlainObject
        {
            id?: string,
            title: string,
            description: string,
            privacy: TaskInfo.TaskPrivacy,
            previousVersionId?: string,
            taskGroup: TaskGroupPlainObject,
        }
        export interface TaskPlainObject
        {
            id?: string, // optional since new objects don't have id
            state: Task.TaskState,
            taskInfo: TaskInfoPlainObject,
        }
        export interface UserPlainObject
        {
            id: string,
            username: string,
            taskGroups: TaskGroupPlainObject[]
        }
    }
}

export = PlainObject;
