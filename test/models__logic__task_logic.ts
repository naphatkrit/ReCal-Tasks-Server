import mocha = require('mocha');
import assert = require('assert');
import Q = require('q');
import mongoose = require('mongoose');

import Models = require('../models/index');
import Task = require('../models/task');
import TaskGroup = require('../models/task_group');
import TaskInfo = require('../models/task_info');
import PromiseAdapter = require('../lib/promise_adapter');
import TaskLogic = require('../models/logic/task_logic');

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

describe('Task Logic Unit Tests', () =>
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
    })
    describe('createTaskInfo()', () =>
    {
        var taskGroupId = '';
        beforeEach((done) =>
        {
            createTaskGroup().then(
                (taskGroup) =>
                {
                    taskGroupId = taskGroup.id;
                    done();
                }, (err) =>
                {
                    done(err);
                })
        })
        afterEach((done) =>
        {
            TaskGroup.model.findByIdAndRemove(taskGroupId, done)
        })
        it('Should fail when given null as an argument', (done) =>
        {
            TaskLogic.createTaskInfo(null).then(
                () =>
                {
                    done(new Error('Did not fail'));
                }, (err) =>
                {
                    done();
                })
        })
        it('Should not accept a plain object without a task group id', (done) =>
        {
            TaskLogic.createTaskInfo({
                title: 'title',
                description: '',
                privacy: TaskInfo.TaskPrivacy.Private,
                taskGroup: {
                    name: 'Dummy Task Group',
                    identifier: "cos333"
                }
            }).then(
                () =>
                {
                    done(new Error('Did not fail'));
                }, (err) =>
                {
                    done();
                })
        })
        it('Should not accept a plain object with nonexistent Task Group id', (done) =>
        {
            TaskLogic.createTaskInfo({
                title: 'title',
                description: '',
                privacy: TaskInfo.TaskPrivacy.Private,
                taskGroup: {
                    id: '123456789123',
                    name: 'Dummy Task Group',
                    identifier: "cos333"
                }
            }).then(
                () =>
                {
                    done(new Error('Did not fail'));
                }, (err) =>
                {
                    done();
                })
        })
        it('Should not accept a plain object with errorneous Task Group name', (done) =>
        {
            TaskLogic.createTaskInfo({
                title: 'title',
                description: '',
                privacy: TaskInfo.TaskPrivacy.Private,
                taskGroup: {
                    id: taskGroupId,
                    name: 'Dummy Task ',
                    identifier: "cos333",
                }
            }).then(
                () =>
                {
                    done(new Error('Did not fail'));
                }, (err) =>
                {
                    done();
                })
        })
        it('Should not accept a plain object with errorneous Task Group identifier', (done) =>
        {
            TaskLogic.createTaskInfo({
                title: 'title',
                description: '',
                privacy: TaskInfo.TaskPrivacy.Private,
                taskGroup: {
                    id: taskGroupId,
                    name: 'Dummy Task ',
                    identifier: "cos334",
                }
            }).then(
                () =>
                {
                    done(new Error('Did not fail'));
                }, (err) =>
                {
                    done();
                })
        })
        it('Should not accept a plain object with id', (done) =>
        {
            TaskLogic.createTaskInfo({
                id: '12345678912',
                title: 'title',
                description: '',
                privacy: TaskInfo.TaskPrivacy.Private,
                taskGroup: {
                    id: taskGroupId,
                    name: 'Dummy Task Group',
                    identifier: "cos333"
                }
            }).then(
                () =>
                {
                    done(new Error('Did not fail'));
                }, (err) =>
                {
                    done();
                })
        })
        it('Should successfully create a task info', () =>
        {
            const title = 'title'
            const description = ''
            const privacy = TaskInfo.TaskPrivacy.Public
            return TaskLogic.createTaskInfo({
                title: title,
                description: description,
                privacy: privacy,
                taskGroup: {
                    id: taskGroupId,
                    name: 'Dummy Task Group',
                    identifier: "cos333"
                }
            }).then((taskInfoPlainObject) =>
            {
                assert(taskInfoPlainObject.id !== null && taskInfoPlainObject.id !== undefined);
                assert(taskInfoPlainObject.title === title);
                assert(taskInfoPlainObject.description === description);
                assert(taskInfoPlainObject.privacy === privacy);
                assert(taskInfoPlainObject.taskGroup.id === taskGroupId);
                return taskInfoPlainObject;
            }).then((taskInfoPlainObject) =>
            {
                return PromiseAdapter.convertMongooseQuery(TaskInfo.model.findByIdAndRemove(taskInfoPlainObject.id))
            })
        })
    }) // createTaskInfo()
    describe('createTask()', () =>
    {
        var taskGroupId = '';
        var taskInfoId = '';
        beforeEach((done) =>
        {
            createTaskGroup().then((taskGroup) =>
            {
                taskGroupId = taskGroup.id;
                return createTaskInfo(taskGroup);
            }).then((taskInfo) =>
            {
                taskInfoId = taskInfo.id;
                done();
            }).fail((err) =>
            {
                done(err);
            })
        })
        afterEach((done) =>
        {
            Q.all([
                PromiseAdapter.convertMongooseQuery(TaskInfo.model.remove({ _id: taskInfoId })),
                PromiseAdapter.convertMongooseQuery(TaskGroup.model.remove({ _id: taskGroupId }))
            ]).then(
                () =>
                {
                    done();
                }, (err) =>
                {
                    done(err);
                })
        })
        it('Should fail when given null as an argument', (done) =>
        {
            TaskLogic.createTask(null).then(
                () =>
                {
                    done(new Error('Did not fail'));
                }, (err) =>
                {
                    done();
                })
        })
        it('Should not accept a plain object with id', (done) =>
        {
            TaskLogic.createTask({
                id: '123456789123',
                state: Task.TaskState.Incomplete,
                taskInfo: {
                    id: taskInfoId,
                    title: 'Dummy Task',
                    description: '',
                    privacy: TaskInfo.TaskPrivacy.Private,
                    taskGroup: {
                        id: taskGroupId,
                        name: 'Dummy Task Group',
                        identifier: "cos333",
                    }
                }
            }).then(
                () =>
                {
                    done(new Error('Did not fail'));
                }, (err) =>
                {
                    done();
                })
        })
        it('Should not accept a plain object with incorrect task info plain object', (done) =>
        {
            TaskLogic.createTask({
                state: Task.TaskState.Incomplete,
                taskInfo: {
                    id: taskInfoId,
                    title: 'Dummy Task blah blah', // <-- incorrect title
                    description: '',
                    privacy: TaskInfo.TaskPrivacy.Private,
                    taskGroup: {
                        id: taskGroupId,
                        name: 'Dummy Task Group',
                        identifier: "cos333",
                    }
                }
            }).then(
                () =>
                {
                    done(new Error('Did not fail'));
                }, (err) =>
                {
                    done();
                })
        })
        it('Should successfully create a task with existing task info', () =>
        {
            const state = Task.TaskState.Complete;
            const title = 'Dummy Task';
            const description = '';
            const privacy = TaskInfo.TaskPrivacy.Private;
            const groupName = 'Dummy Task Group';
            return TaskLogic.createTask({
                state: state,
                taskInfo: {
                    id: taskInfoId,
                    title: title,
                    description: description,
                    privacy: privacy,
                    taskGroup: {
                        id: taskGroupId,
                        name: groupName,
                        identifier: "cos333",
                    }
                }
            }).then((taskPlainObject) =>
            {
                assert(taskPlainObject.id !== null && taskPlainObject.id !== undefined);
                assert(taskPlainObject.state === state);
                assert(taskPlainObject.taskInfo.id === taskInfoId);
                assert(taskPlainObject.taskInfo.title === title);
                assert(taskPlainObject.taskInfo.description === description);
                assert(taskPlainObject.taskInfo.privacy === privacy);
                assert(taskPlainObject.taskInfo.taskGroup.id === taskGroupId);
                assert(taskPlainObject.taskInfo.taskGroup.name === groupName);
                return taskPlainObject;
            }).then((taskPlainObject) =>
            {
                return PromiseAdapter.convertMongooseQuery(Task.model.findByIdAndRemove(taskPlainObject.id))
            })
        })
        it('Should successfully create a task with a new task info', () =>
        {
            const state = Task.TaskState.Incomplete;
            const title = 'Dummy Task 2';
            const description = 'dasfklasdf';
            const privacy = TaskInfo.TaskPrivacy.Public;
            const groupName = 'Dummy Task Group';
            return TaskLogic.createTask({
                state: state,
                taskInfo: {
                    title: title,
                    description: description,
                    privacy: privacy,
                    taskGroup: {
                        id: taskGroupId,
                        name: groupName,
                        identifier: "cos333",
                    }
                }
            }).then((taskPlainObject) =>
            {
                assert(taskPlainObject.id !== null && taskPlainObject.id !== undefined);
                assert(taskPlainObject.state === state);
                assert(taskPlainObject.taskInfo.id !== null && taskPlainObject.taskInfo.id !== undefined);
                assert(taskPlainObject.taskInfo.title === title);
                assert(taskPlainObject.taskInfo.description === description);
                assert(taskPlainObject.taskInfo.privacy === privacy);
                assert(taskPlainObject.taskInfo.taskGroup.id === taskGroupId);
                assert(taskPlainObject.taskInfo.taskGroup.name === groupName);
                return taskPlainObject;
            }).then((taskPlainObject) =>
            {
                return Q.all([
                    PromiseAdapter.convertMongooseQuery(Task.model.findByIdAndRemove(taskPlainObject.id)),
                    PromiseAdapter.convertMongooseQuery(TaskInfo.model.findByIdAndRemove(taskPlainObject.taskInfo.id))
                ])
            })
        })
    }) // createTask()
    describe('updateTask()', () =>
    {
        var taskGroupId = '';
        var taskInfoId = '';
        var taskId = '';
        beforeEach((done) =>
        {
            createTaskGroup().then((taskGroup) =>
            {
                taskGroupId = taskGroup.id;
                return createTaskInfo(taskGroup);
            }).then((taskInfo) =>
            {
                taskInfoId = taskInfo.id;
                return createTask(taskInfo);
            }).then((task) =>
            {
                taskId = task.id;
                done();
            }).fail((err) =>
            {
                done(err);
            })
        })
        afterEach((done) =>
        {
            Q.all([
                PromiseAdapter.convertMongooseQuery(TaskInfo.model.findByIdAndRemove(taskInfoId)),
                PromiseAdapter.convertMongooseQuery(TaskGroup.model.findByIdAndRemove(taskGroupId)),
                PromiseAdapter.convertMongooseQuery(Task.model.findByIdAndRemove(taskId))
            ]).then(
                () =>
                {
                    done();
                }, (err) =>
                {
                    done(err);
                })
        })
        it('Should fail when given null as an argument', (done) =>
        {
            TaskLogic.updateTask(null).then(
                () =>
                {
                    done(new Error('Did not fail'));
                }, (err) =>
                {
                    done();
                })
        })
        it('Should not accept a plain object without id', (done) =>
        {
            TaskLogic.updateTask({
                state: Task.TaskState.Incomplete,
                taskInfo: {
                    id: taskInfoId,
                    title: 'Dummy Task',
                    description: '',
                    privacy: TaskInfo.TaskPrivacy.Private,
                    taskGroup: {
                        id: taskGroupId,
                        name: 'Dummy Task Group',
                        identifier: "cos333",
                    }
                }
            }).then(
                () =>
                {
                    done(new Error('Did not fail'));
                }, (err) =>
                {
                    done();
                })
        })
        it('Should not accept a plain object with incorrect task info plain object', (done) =>
        {
            TaskLogic.updateTask({
                id: taskId,
                state: Task.TaskState.Incomplete,
                taskInfo: {
                    id: taskInfoId,
                    title: 'Dummy Task blah blah', // <-- incorrect title
                    description: '',
                    privacy: TaskInfo.TaskPrivacy.Private,
                    taskGroup: {
                        id: taskGroupId,
                        name: 'Dummy Task Group',
                        identifier: "cos333",
                    }
                }
            }).then(
                () =>
                {
                    done(new Error('Did not fail'));
                }, (err) =>
                {
                    done();
                })
        })
        it('Should successfully update a task with existing task info', () =>
        {
            const state = Task.TaskState.Complete;
            const title = 'Dummy Task';
            const description = '';
            const privacy = TaskInfo.TaskPrivacy.Private;
            const groupName = 'Dummy Task Group';
            return TaskLogic.updateTask({
                id: taskId,
                state: state,
                taskInfo: {
                    id: taskInfoId,
                    title: title,
                    description: description,
                    privacy: privacy,
                    taskGroup: {
                        id: taskGroupId,
                        name: groupName,
                        identifier: "cos333",
                    }
                }
            }).then((taskPlainObject) =>
            {
                assert(taskPlainObject.id === taskId);
                assert(taskPlainObject.state === state);
                assert(taskPlainObject.taskInfo.id === taskInfoId);
                assert(taskPlainObject.taskInfo.title === title);
                assert(taskPlainObject.taskInfo.description === description);
                assert(taskPlainObject.taskInfo.privacy === privacy);
                assert(taskPlainObject.taskInfo.taskGroup.id === taskGroupId);
                assert(taskPlainObject.taskInfo.taskGroup.name === groupName);
                return taskPlainObject;
            })
        })
        it('Should successfully update a task with a new task info', () =>
        {
            const state = Task.TaskState.Incomplete;
            const title = 'Dummy Task 2';
            const description = 'dasfklasdf';
            const privacy = TaskInfo.TaskPrivacy.Public;
            const groupName = 'Dummy Task Group';
            return TaskLogic.updateTask({
                id: taskId,
                state: state,
                taskInfo: {
                    title: title,
                    description: description,
                    privacy: privacy,
                    taskGroup: {
                        id: taskGroupId,
                        name: groupName,
                        identifier: "cos333"
                    }
                }
            }).then((taskPlainObject) =>
            {
                assert(taskPlainObject.id !== null && taskPlainObject.id !== undefined);
                assert(taskPlainObject.state === state);
                assert(taskPlainObject.taskInfo.id !== null && taskPlainObject.taskInfo.id !== undefined);
                assert(taskPlainObject.taskInfo.title === title);
                assert(taskPlainObject.taskInfo.description === description);
                assert(taskPlainObject.taskInfo.privacy === privacy);
                assert(taskPlainObject.taskInfo.taskGroup.id === taskGroupId);
                assert(taskPlainObject.taskInfo.taskGroup.name === groupName);
                return taskPlainObject;
            }).then((taskPlainObject) =>
            {
                return Q.all([
                    PromiseAdapter.convertMongooseQuery(TaskInfo.model.findByIdAndRemove(taskPlainObject.taskInfo.id))
                ])
            })
        })
    }) // updateTask()
})
