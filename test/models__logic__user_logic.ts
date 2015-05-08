import mocha = require('mocha');
import assert = require('assert');
import Q = require('q');
import mongoose = require('mongoose');

import Models = require('../models/index');
import Task = require('../models/task');
import TaskGroup = require('../models/task_group');
import TaskInfo = require('../models/task_info');
import PromiseAdapter = require('../lib/promise_adapter');
import PlainObject = require('../models/logic/plain_object');
import User = require('../models/user');
import UserLogic = require('../models/logic/user_logic');

function createTaskGroup(): Q.Promise<TaskGroup.Instance>
{
    let deferred = Q.defer<TaskGroup.Instance>();
    let taskGroup = new TaskGroup.model({
        _name: "Dummy Task Group",
        _identifier: "cos333"
    });
    taskGroup.save<TaskGroup.Instance>((err, doc) =>
    {
        if (err)
        {
            deferred.reject(err);
        } else
        {
            deferred.resolve(doc);
        }
    });
    return deferred.promise.then((doc) =>
    {
        return doc;
    });
}

function createTaskInfo(taskGroup: TaskGroup.Instance): Q.Promise<TaskInfo.Instance>
{
    let deferred = Q.defer<TaskInfo.Instance>();
    let taskInfo = <TaskInfo.Instance> new TaskInfo.model({
        _title: "Dummy Task",
        _description: "",
        _privacy: TaskInfo.TaskPrivacy.Private,
        _previousVersion: null,
        _taskGroupId: null
    });
    taskInfo.taskGroup = taskGroup;
    taskInfo.save<TaskInfo.Instance>((err, doc) =>
    {
        if (err)
        {
            deferred.reject(err);
        } else
        {
            deferred.resolve(doc);
        }
    });
    return deferred.promise.then((doc) =>
    {
        return doc;
    });
}

function createTask(taskInfo: TaskInfo.Instance): Q.Promise<Task.Instance>
{
    let deferred = Q.defer<Task.Instance>();
    let task = <Task.Instance> new Task.model({
        _state: Task.TaskState.Incomplete,
        _taskInfo: null
    });
    task.taskInfo = taskInfo;
    task.save<Task.Instance>((err, doc) =>
    {
        if (err)
        {
            deferred.reject(err);
        } else
        {
            deferred.resolve(doc);
        }
    });
    return deferred.promise.then((doc) =>
    {
        return doc;
    });
}

function createUser(): Q.Promise<User.Instance>
{
    let deferred = Q.defer<User.Instance>();
    let user = <User.Instance> new User.model({
        _username: 'testuser'
    });
    user.save<User.Instance>((err, doc) =>
    {
        if (err)
        {
            deferred.reject(err);
        } else
        {
            deferred.resolve(doc);
        }
    });
    return deferred.promise.then((doc) =>
    {
        return doc;
    });
}

describe('User Logic Unit Tests', () =>
{
    before((done) =>
    {
        if (Models.connection.readyState === 1)
        {
            done();
            return;
        }
        Models.connection.on('error', (error) =>
        {
            done(error);
        })
        Models.connection.on('open', () =>
        {
            done();
        })
    });
    describe('addTask()', () =>
    {
        var userPlainObject: PlainObject.Interfaces.UserPlainObject = null;
        var taskPlainObject: PlainObject.Interfaces.TaskPlainObject = null;
        beforeEach((done) =>
        {
            createTaskGroup().then((taskGroup) =>
            {
                return createTaskInfo(taskGroup);
            }).then((taskInfo) =>
            {
                return createTask(taskInfo);
            }).then((task) =>
            {
                return PlainObject.convertTaskInstance(task);
            }).then((task) =>
            {
                taskPlainObject = task;
                return createUser();
            }).then((user) =>
            {
                user.taskGroups.push(taskPlainObject.taskInfo.taskGroup.id);
                return PromiseAdapter.convertMongooseDocumentSave(user);
            }).then((user) =>
            {
                return PlainObject.convertUserInstance(user);
            }).then((user) =>
            {
                userPlainObject = user;
                done();
            }).fail((err) =>
            {
                done(err);
            })
        })
        afterEach((done) =>
        {
            Q.all([
                PromiseAdapter.convertMongooseQuery(TaskInfo.model.findByIdAndRemove(taskPlainObject.taskInfo.id)),
                PromiseAdapter.convertMongooseQuery(TaskGroup.model.findByIdAndRemove(taskPlainObject.taskInfo.taskGroup.id)),
                PromiseAdapter.convertMongooseQuery(Task.model.findByIdAndRemove(taskPlainObject.id)),
                PromiseAdapter.convertMongooseQuery(User.model.findByIdAndRemove(userPlainObject.id))
            ]).then(
                () =>
                {
                    done();
                }, (err) =>
                {
                    done(err);
                })
        })
        it('Should fail when user is null', (done) =>
        {
            UserLogic.addTask(null, taskPlainObject).then(
                () =>
                {
                    done(new Error('Did not fail'));
                }, (err) =>
                {
                    done();
                })
        })
        it('Should fail when task is null', (done) =>
        {
            UserLogic.addTask(userPlainObject, null).then(
                () =>
                {
                    done(new Error('Did not fail'));
                }, (err) =>
                {
                    done();
                })
        })
        it('Should fail when task id is null', (done) =>
        {
            let copy = JSON.parse(JSON.stringify(taskPlainObject));
            delete copy.id;
            UserLogic.addTask(userPlainObject, copy).then(
                () =>
                {
                    done(new Error('Did not fail'));
                }, (err) =>
                {
                    done();
                })
        })
        it('Should fail when the task being added belongs to a task group that the user does not belong to', (done) =>
        {
            PromiseAdapter.convertMongooseQuery(User.model.findById(userPlainObject.id)).then((user: User.Instance) =>
            {
                user.taskGroups = [];
                return PromiseAdapter.convertMongooseDocumentSave(user);
            }).then(() =>
            {
                return UserLogic.addTask(userPlainObject, taskPlainObject)
            }).then(
                () =>
                {
                    done(new Error('Did not fail'));
                }, (err) =>
                {
                    done();
                })
        })
        it('Should fail when adding a task twice to a user', (done) =>
        {
            UserLogic.addTask(userPlainObject, taskPlainObject).then((newUserPlainObject) =>
            {
                return UserLogic.addTask(userPlainObject, taskPlainObject);
            }).then(
                () =>
                {
                    done(new Error('Did not fail'));
                }, (err) =>
                {
                    done();
                })
        })
        it('Should successfull add a task to a user', () =>
        {
            return UserLogic.addTask(userPlainObject, taskPlainObject).then((newUserPlainObject) =>
            {
                assert(newUserPlainObject.id === userPlainObject.id);
                return PromiseAdapter.convertMongooseQuery(User.model.findById(newUserPlainObject.id))
            }).then((user: User.Instance) =>
            {
                assert(user.tasks.indexOf(taskPlainObject.id) !== -1);
            })
        })
    }); // addTask()
    describe('removeTask()', () =>
    {
        var userPlainObject: PlainObject.Interfaces.UserPlainObject = null;
        var taskPlainObject: PlainObject.Interfaces.TaskPlainObject = null;
        beforeEach((done) =>
        {
            createTaskGroup().then((taskGroup) =>
            {
                return createTaskInfo(taskGroup);
            }).then((taskInfo) =>
            {
                return createTask(taskInfo);
            }).then((task) =>
            {
                return PlainObject.convertTaskInstance(task);
            }).then((task) =>
            {
                taskPlainObject = task;
                return createUser();
            }).then((user) =>
            {
                user.taskGroups.push(taskPlainObject.taskInfo.taskGroup.id);
                user.tasks.push(taskPlainObject.id);
                return PromiseAdapter.convertMongooseDocumentSave(user);
            }).then((user) =>
            {
                return PlainObject.convertUserInstance(user);
            }).then((user) =>
            {
                userPlainObject = user;
                done();
            }).fail((err) =>
            {
                done(err);
            })
        })
        afterEach((done) =>
        {
            Q.all([
                PromiseAdapter.convertMongooseQuery(TaskInfo.model.findByIdAndRemove(taskPlainObject.taskInfo.id)),
                PromiseAdapter.convertMongooseQuery(TaskGroup.model.findByIdAndRemove(taskPlainObject.taskInfo.taskGroup.id)),
                PromiseAdapter.convertMongooseQuery(Task.model.findByIdAndRemove(taskPlainObject.id)),
                PromiseAdapter.convertMongooseQuery(User.model.findByIdAndRemove(userPlainObject.id))
            ]).then(
                () =>
                {
                    done();
                }, (err) =>
                {
                    done(err);
                })
        })
        it('Should fail when user is null', (done) =>
        {
            UserLogic.removeTask(null, taskPlainObject).then(
                () =>
                {
                    done(new Error('Did not fail'));
                }, (err) =>
                {
                    done();
                })
        })
        it('Should fail when task is null', (done) =>
        {
            UserLogic.removeTask(userPlainObject, null).then(
                () =>
                {
                    done(new Error('Did not fail'));
                }, (err) =>
                {
                    done();
                })
        })
        it('Should fail when task id is null', (done) =>
        {
            let copy = JSON.parse(JSON.stringify(taskPlainObject));
            delete copy.id;
            UserLogic.removeTask(userPlainObject, copy).then(
                () =>
                {
                    done(new Error('Did not fail'));
                }, (err) =>
                {
                    done();
                })
        })
        it('Should successfull remove a task from a user', () =>
        {
            return UserLogic.removeTask(userPlainObject, taskPlainObject).then((newUserPlainObject) =>
            {
                assert(newUserPlainObject.id === userPlainObject.id);
                return PromiseAdapter.convertMongooseQuery(User.model.findById(newUserPlainObject.id))
            }).then((user: User.Instance) =>
            {
                assert(user.tasks.indexOf(taskPlainObject.id) === -1);
            })
        })
    }); // removeTask()
})
