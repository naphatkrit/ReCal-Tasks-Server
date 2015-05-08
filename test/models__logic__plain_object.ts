import mocha = require('mocha');
import assert = require('assert');
import Q = require('q');

import Models = require('../models/index');
import Task = require('../models/task');
import TaskGroup = require('../models/task_group');
import TaskInfo = require('../models/task_info');
import User = require('../models/user');
import PromiseAdapter = require('../lib/promise_adapter');
import PlainObject = require('../models/logic/plain_object');

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
        _title: "Dummy Task Group",
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

describe('Models Logic - Plain Object Unit Tests', () =>
{
    describe('Conversion Functions', () =>
    {
        before((done) =>
        {
            if (Models.connection.readyState === 1)
            {
                done();
                return;
            }
            Models.connection.once('error', (error) =>
            {
                done(error);
            })
            Models.connection.once('open', () =>
            {
                done();
            })
        })
        describe('convertTaskGroupInstance()', () =>
        {
            var taskGroupId = '';
            beforeEach((done) =>
            {
                createTaskGroup().then((taskGroup) =>
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
                PlainObject.convertTaskGroupInstance(null).then(
                    () =>
                    {
                        done(new Error('Did not fail'));
                    }, (err) =>
                    {
                        done();
                    })
            })
            it('Should successfully create a plain object', () =>
            {
                return PromiseAdapter.convertMongooseQuery(TaskGroup.model.findById(taskGroupId))
                    .then((taskGroupInstance: TaskGroup.Instance) =>
                {
                    return PlainObject.convertTaskGroupInstance(taskGroupInstance).then((plainObject) =>
                    {
                        assert(plainObject.id === taskGroupInstance.id)
                        assert(plainObject.name === taskGroupInstance.name)
                        assert(plainObject.identifier === taskGroupInstance.identifier)
                    })
                })
            });
        }); // convertTaskGroupInstance()

        describe('convertTaskInfoInstance()', () =>
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
                PlainObject.convertTaskInfoInstance(null).then(
                    () =>
                    {
                        done(new Error('Did not fail'));
                    }, (err) =>
                    {
                        done();
                    })
            })
            it('Should successfully create a plain object', () =>
            {
                return Q.all([
                    PromiseAdapter.convertMongooseQuery(TaskGroup.model.findById(taskGroupId)),
                    PromiseAdapter.convertMongooseQuery(TaskInfo.model.findById(taskInfoId))
                ]).spread((taskGroup, taskInfo) =>
                {
                    return PlainObject.convertTaskInfoInstance(taskInfo).then((plainObject) =>
                    {
                        assert(plainObject.id === taskInfo.id)
                        assert(plainObject.title === taskInfo.title)
                        assert(plainObject.description === taskInfo.description)
                        assert(plainObject.privacy === taskInfo.privacy)
                        assert(plainObject.taskGroup.id === taskGroup.id)
                        assert(plainObject.taskGroup.name === taskGroup.name)
                    })
                })
            })
            it('Should successfully create a plain object even if taskGroup property has already been populated', () =>
            {
                return Q.all([
                    PromiseAdapter.convertMongooseQuery(TaskGroup.model.findById(taskGroupId)),
                    PromiseAdapter.convertMongooseQuery(TaskInfo.model.findById(taskInfoId))
                ]).spread((taskGroup, taskInfo) =>
                {
                    return taskInfo.populate('_taskGroup', (err, taskInfo) =>
                    {
                        if (err)
                        {
                            throw err;
                        }
                        return PlainObject.convertTaskInfoInstance(taskInfo).then((plainObject) =>
                        {
                            assert(plainObject.id === taskInfo.id)
                            assert(plainObject.title === taskInfo.title)
                            assert(plainObject.description === taskInfo.description)
                            assert(plainObject.privacy === taskInfo.privacy)
                            assert(plainObject.taskGroup.id === taskGroup.id)
                            assert(plainObject.taskGroup.name === taskGroup.name)
                        })
                    })
                })
            })
        }); // convertTaskInfoInstance()
        describe('convertTaskInstance()', () =>
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
                    PromiseAdapter.convertMongooseQuery(TaskGroup.model.findByIdAndRemove(taskGroupId)),
                    PromiseAdapter.convertMongooseQuery(TaskInfo.model.findByIdAndRemove(taskInfoId)),
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
                PlainObject.convertTaskInstance(null).then(
                    () =>
                    {
                        done(new Error('Did not fail'));
                    }, (err) =>
                    {
                        done();
                    })
            })
            it('Should successfully create a plain object', () =>
            {
                return Q.all([
                    PromiseAdapter.convertMongooseQuery(TaskGroup.model.findById(taskGroupId)),
                    PromiseAdapter.convertMongooseQuery(TaskInfo.model.findById(taskInfoId)),
                    PromiseAdapter.convertMongooseQuery(Task.model.findById(taskId))
                ]).spread((taskGroup, taskInfo, task) =>
                {
                    return PlainObject.convertTaskInstance(task).then((plainObject) =>
                    {
                        assert(plainObject.id === task.id)
                        assert(plainObject.state === task.state)
                        assert(plainObject.taskInfo.id === taskInfo.id)
                        assert(plainObject.taskInfo.title === taskInfo.title)
                        assert(plainObject.taskInfo.description === taskInfo.description)
                        assert(plainObject.taskInfo.privacy === taskInfo.privacy)
                        assert(plainObject.taskInfo.taskGroup.id === taskGroup.id)
                        assert(plainObject.taskInfo.taskGroup.name === taskGroup.name)
                    })
                })
            })
            it('Should successfully create a plain object even if taskInfo property has already been populated', () =>
            {
                return Q.all([
                    PromiseAdapter.convertMongooseQuery(TaskGroup.model.findById(taskGroupId)),
                    PromiseAdapter.convertMongooseQuery(TaskInfo.model.findById(taskInfoId)),
                    PromiseAdapter.convertMongooseQuery(Task.model.findById(taskId))
                ]).spread((taskGroup, taskInfo, task) =>
                {
                    return task.populate('_taskInfo', (err, task) =>
                    {
                        if (err)
                        {
                            throw err;
                        }
                        return PlainObject.convertTaskInstance(task).then((plainObject) =>
                        {
                            assert(plainObject.id === task.id)
                            assert(plainObject.state === task.state)
                            assert(plainObject.taskInfo.id === taskInfo.id)
                            assert(plainObject.taskInfo.title === taskInfo.title)
                            assert(plainObject.taskInfo.description === taskInfo.description)
                            assert(plainObject.taskInfo.privacy === taskInfo.privacy)
                            assert(plainObject.taskInfo.taskGroup.id === taskGroup.id)
                            assert(plainObject.taskInfo.taskGroup.name === taskGroup.name)
                        })
                    })
                })
            })
        }); // convertTaskInstance()
        describe('convertUserInstance()', () =>
        {
            var userId = '';
            beforeEach((done) =>
            {
                createUser().then(
                    (user) =>
                    {
                        userId = user.id;
                        done();
                    }, (err) =>
                    {
                        done(err);
                    })
            })
            afterEach((done) =>
            {
                User.model.findByIdAndRemove(userId, done);
            })
            it('Should fail when given null as an argument', (done) =>
            {
                PlainObject.convertUserInstance(null).then(
                    () =>
                    {
                        done(new Error('Did not fail'));
                    }, (err) =>
                    {
                        done();
                    })
            })
            it('Should successfully create a plain object', () =>
            {
                return PromiseAdapter.convertMongooseQuery(User.model.findById(userId))
                    .then((user: User.Instance) =>
                {
                    return PlainObject.convertUserInstance(user).then((plainObject) =>
                    {
                        assert(plainObject.id === user.id)
                        assert(plainObject.username === user.username)
                        assert(plainObject.taskGroups.length == 0)
                    })
                })
            });
        }); // convertUserInstance()
    })
    describe('Validation Functions', () =>
    {
        const badTaskGroups = [
            {
                value: undefined,
                explanation: "undefined variable",
            },
            {
                value: null,
                explanation: "null variable",
            },
            {
                value: {
                    name: "name"
                },
                explanation: "id is missing",
            },
            {
                value: {
                    id: 0,
                    name: "name"
                },
                explanation: "id is not a string",
            },
            {
                value: {
                    id: "123",
                },
                explanation: "name is missing",
            },
            {
                value: {
                    id: "123",
                    name: true
                },
                explanation: "name is not a string",
            },
        ]
        const goodTaskGroup = { id: '', name: '' };
        const badTaskInfos = [
            {
                value: undefined,
                explanation: "undefined variable",
            },
            {
                value: null,
                explanation: "null variable",
            },
            {
                value: {
                    id: 0,
                    title: '',
                    description: '',
                    privacy: TaskInfo.TaskPrivacy.Private,
                    taskGroup: goodTaskGroup,
                },
                explanation: "id is not a string",
            },
            {
                value: {
                    id: '',
                    description: '',
                    privacy: TaskInfo.TaskPrivacy.Private,
                    taskGroup: goodTaskGroup,
                },
                explanation: "title is missing",
            },
            {
                value: {
                    id: '',
                    title: true,
                    description: '',
                    privacy: TaskInfo.TaskPrivacy.Private,
                    taskGroup: goodTaskGroup,
                },
                explanation: "title is not a string",
            },
            {
                value: {
                    id: '',
                    title: '',
                    privacy: TaskInfo.TaskPrivacy.Private,
                    taskGroup: goodTaskGroup,
                },
                explanation: "description is missing"
            },
            {
                value: {
                    id: '',
                    title: '',
                    description: -1,
                    privacy: TaskInfo.TaskPrivacy.Private,
                    taskGroup: goodTaskGroup,
                },
                explanation: "description is not a string"
            },
            {
                value: {
                    id: '',
                    title: '',
                    description: '',
                    taskGroup: goodTaskGroup,
                },
                explanation: "privacy is missing"
            },
            {
                value: {
                    id: '',
                    title: '',
                    description: '',
                    privacy: 50,
                    taskGroup: goodTaskGroup,
                },
                explanation: "privacy is not a valid enum"
            },
        ]
        const goodTaskInfos = [
            {
                value: {
                    id: '123',
                    title: '',
                    description: '',
                    privacy: TaskInfo.TaskPrivacy.Private,
                    taskGroup: goodTaskGroup,
                },
                explanation: "with id"
            },
            {
                value: {
                    title: '',
                    description: '',
                    privacy: TaskInfo.TaskPrivacy.Private,
                    taskGroup: goodTaskGroup,
                },
                explanation: "without id"
            },
            {
                value: {
                    title: '123',
                    description: '',
                    privacy: TaskInfo.TaskPrivacy.Private,
                    previousVersionId: '123',
                    taskGroup: goodTaskGroup,
                },
                explanation: "with previous version id"
            },
        ]
        const badTasks = [
            {
                value: undefined,
                explanation: "undefined variable",
            },
            {
                value: null,
                explanation: "null variable",
            },
            {
                value: {
                    id: 1,
                    state: Task.TaskState.Incomplete,
                    taskInfo: goodTaskInfos[0].value,
                },
                explanation: "id is not a string"
            },
            {
                value: {
                    id: '123',
                    taskInfo: goodTaskInfos[0].value,
                },
                explanation: "state is missing",
            },
            {
                value: {
                    id: '123',
                    state: -1,
                    taskInfo: goodTaskInfos[0].value,
                },
                explanation: "state is not a valid enum"
            },
            {
                value: {
                    id: 1,
                    state: '1234',
                    taskInfo: goodTaskInfos[0].value,
                },
                explanation: "state is a string"
            },
        ]
        const goodTasks = [
            {
                value: {
                    state: Task.TaskState.Incomplete,
                    taskInfo: goodTaskInfos[0].value,
                },
                explanation: "without id"
            },
            {
                value: {
                    id: '123',
                    state: Task.TaskState.Incomplete,
                    taskInfo: goodTaskInfos[0].value,
                },
                explanation: "with id"
            },
        ]
        describe('validateTaskGroupPlainObject()', () =>
        {
            it('Should fail on bad Task Group plain objects', (done) =>
            {
                for (let i = 0; i < badTaskGroups.length; i++)
                {
                    const bad = badTaskGroups[i];
                    if (PlainObject.validateTaskGroupPlainObject(bad.value))
                    {
                        done(new Error('Validation passes for a bad object: ' + bad.explanation));
                        return;
                    }
                }
                done();
            })
            it('Should succeed on valid Task Group plain objects', (done) =>
            {
                if (!PlainObject.validateTaskGroupPlainObject(goodTaskGroup))
                {
                    done(new Error('Validation fails on a valid object.'));
                } else
                {
                    done();
                }
            })
        }) // validateTaskGroupPlainObject()
        describe('validateTaskInfoPlainObject()', () =>
        {
            it('Should fail on bad Task Info plain objects', (done) =>
            {
                for (let i = 0; i < badTaskInfos.length; i++)
                {
                    const bad = badTaskInfos[i];
                    if (PlainObject.validateTaskInfoPlainObject(bad.value))
                    {
                        done(new Error('Validation passes for a bad object: ' + bad.explanation));
                        return;
                    }
                }
                done();
            })
            it('Should fail on valid Task Info plain objects with invalid Task Group plain objects', (done) =>
            {
                for (let i = 0; i < goodTaskInfos.length; i++)
                {
                    const good = JSON.parse(JSON.stringify(goodTaskInfos[i]));
                    for (let i = 0; i < badTaskGroups.length; i++)
                    {
                        good.value.taskGroup = <any> badTaskGroups[i].value;
                        if (PlainObject.validateTaskInfoPlainObject(good.value))
                        {
                            done(new Error('Validation passes for a bad object: ' + badTaskGroups[i].explanation));
                            return;
                        }
                    }
                }
                done();
            })
            it('Should succeed on valid Task Info plain objects', (done) =>
            {
                for (let i = 0; i < goodTaskInfos.length; i++)
                {
                    const good = goodTaskInfos[i];
                    if (!PlainObject.validateTaskInfoPlainObject(good.value))
                    {
                        done(new Error('Validation fails for a valid object: ' + good.explanation));
                        return;
                    }
                }
                done();
            })
        }); // validateTaskInfoPlainObject()
        describe('validateTaskPlainObject()', () =>
        {
            it('Should fail on bad Task plain objects', (done) =>
            {
                for (let i = 0; i < badTasks.length; i++)
                {
                    const bad = badTasks[i];
                    if (PlainObject.validateTaskPlainObject(bad.value))
                    {
                        done(new Error('Validation passes for a bad object: ' + bad.explanation));
                        return;
                    }
                }
                done();
            })
            it('Should fail on valid Task plain objects with invalid Task Info plain objects', (done) =>
            {
                for (let i = 0; i < goodTasks.length; i++)
                {
                    const good = JSON.parse(JSON.stringify(goodTasks[i]));
                    for (let i = 0; i < badTaskInfos.length; i++)
                    {
                        good.value.taskInfo = <any> badTaskInfos[i].value;
                        if (PlainObject.validateTaskPlainObject(good.value))
                        {
                            done(new Error('Validation passes for a bad object: ' + badTaskInfos[i].explanation));
                            return;
                        }
                    }
                }
                done();
            })
            it('Should fail on valid Task plain objects with invalid Task Group plain objects', (done) =>
            {
                for (let i = 0; i < goodTasks.length; i++)
                {
                    const good = JSON.parse(JSON.stringify(goodTasks[i]));
                    for (let i = 0; i < goodTaskInfos.length; i++)
                    {
                        good.value.taskInfo = <any> JSON.parse(JSON.stringify(goodTaskInfos[i]));
                        for (let i = 0; i < badTaskGroups.length; i++)
                        {
                            good.value.taskInfo.taskGroup = badTaskGroups[i];
                            if (PlainObject.validateTaskPlainObject(good.value))
                            {
                                done(new Error('Validation passes for a bad object: ' + badTaskGroups[i].explanation));
                                return;
                            }
                        }
                    }
                }
                done();
            })
            it('Should succeed on valid Task plain objects', (done) =>
            {
                for (let i = 0; i < goodTasks.length; i++)
                {
                    const good = goodTasks[i];
                    if (!PlainObject.validateTaskPlainObject(good.value))
                    {
                        done(new Error('Validation fails for a valid object: ' + good.explanation));
                        return;
                    }
                }
                done();
            })
        }); // validateTaskPlainObject()
    })
})
