import assert = require('assert');
import Q = require('q');

import PromiseAdapter = require('../../lib/promise_adapter');
import PlainObject = require('./plain_object');
import TaskGroup = require('../task_group');
import TaskGroupLogic = require('./task_group_logic');
import User = require('../user');

module UserLogic
{
    export function addTask(user: PlainObject.Interfaces.UserPlainObject, task: PlainObject.Interfaces.TaskPlainObject): Q.Promise<PlainObject.Interfaces.UserPlainObject>
    {
        return Q.fcall(() =>
        {
            assert(user !== null && user !== undefined);
            assert(task !== null && task !== undefined);
            assert(task.id !== null && task.id !== undefined);
        }).then(() =>
        {
            return PromiseAdapter.convertMongooseQuery(User.model.findById(user.id));
        }).then((user: User.Instance) =>
        {
            assert(user.tasks.indexOf(task.id) === -1);
            user.tasks.push(task.id);
            return PromiseAdapter.convertMongooseDocumentSave(user);
        }).then((user) =>
        {
            return PlainObject.convertUserInstance(user);
        })
    }
    export function removeTask(user: PlainObject.Interfaces.UserPlainObject, task: PlainObject.Interfaces.TaskPlainObject): Q.Promise<PlainObject.Interfaces.UserPlainObject>
    {
        return Q.fcall(() =>
        {
            assert(user !== null && user !== undefined);
            assert(task !== null && task !== undefined);
            assert(task.id !== null && task.id !== undefined);
        }).then(() =>
        {
            return PromiseAdapter.convertMongooseQuery(User.model.findById(user.id));
        }).then((user: User.Instance) =>
        {
            const index = user.tasks.indexOf(task.id);
            assert(index !== -1);
            user.tasks.splice(index, 1);
            return PromiseAdapter.convertMongooseDocumentSave(user);
        }).then((user) =>
        {
            return PlainObject.convertUserInstance(user);
        })
    }
    export function updateUser(userPlainObject: PlainObject.Interfaces.UserPlainObject): Q.Promise<PlainObject.Interfaces.UserPlainObject>
    {
        function getTaskGroupId(taskGroupPlainObject: PlainObject.Interfaces.TaskGroupPlainObject): Q.Promise<string> {
            return PromiseAdapter.convertMongooseQuery(TaskGroup.model.findOne({
                identifier: taskGroupPlainObject.identifier
            })).then((object)=>{
                if (object === null) {
                    throw new Error('not found');
                }
                return object.id;
            }).fail((err)=>{
                return TaskGroupLogic.createTaskGroup(taskGroupPlainObject).then((taskGroup)=>{ return taskGroup.id })
            })
        }
        return Q.fcall(() =>
        {
            assert(userPlainObject !== null && userPlainObject !== undefined);
        }).then(() =>
        {
            return PromiseAdapter.convertMongooseQuery(User.model.findById(userPlainObject.id))
        }).then((user: User.Instance) =>
        {
            assert(user.username === userPlainObject.username);
            return Q.all(userPlainObject.taskGroups.map(getTaskGroupId)).then((taskGroupIds)=>{
                // TODO what to do about tasks that belong to unenrolled task groups?
                user.taskGroups = taskGroupIds;
                return PromiseAdapter.convertMongooseDocumentSave(user);
            })
        }).then((user)=>{
            return PlainObject.convertUserInstance(user);
        })
    }
}


export = UserLogic;
