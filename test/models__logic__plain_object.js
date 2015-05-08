var assert = require('assert');
var Q = require('q');
var Models = require('../models/index');
var Task = require('../models/task');
var TaskGroup = require('../models/task_group');
var TaskInfo = require('../models/task_info');
var User = require('../models/user');
var PromiseAdapter = require('../lib/promise_adapter');
var PlainObject = require('../models/logic/plain_object');
function createTaskGroup() {
    var deferred = Q.defer();
    var taskGroup = new TaskGroup.model({
        _name: "Dummy Task Group",
        _identifier: "cos333"
    });
    taskGroup.save(function (err, doc) {
        if (err) {
            deferred.reject(err);
        }
        else {
            deferred.resolve(doc);
        }
    });
    return deferred.promise.then(function (doc) {
        return doc;
    });
}
function createTaskInfo(taskGroup) {
    var deferred = Q.defer();
    var taskInfo = new TaskInfo.model({
        _title: "Dummy Task Group",
        _description: "",
        _privacy: TaskInfo.TaskPrivacy.Private,
        _previousVersion: null,
        _taskGroupId: null
    });
    taskInfo.taskGroup = taskGroup;
    taskInfo.save(function (err, doc) {
        if (err) {
            deferred.reject(err);
        }
        else {
            deferred.resolve(doc);
        }
    });
    return deferred.promise.then(function (doc) {
        return doc;
    });
}
function createTask(taskInfo) {
    var deferred = Q.defer();
    var task = new Task.model({
        _state: Task.TaskState.Incomplete,
        _taskInfo: null
    });
    task.taskInfo = taskInfo;
    task.save(function (err, doc) {
        if (err) {
            deferred.reject(err);
        }
        else {
            deferred.resolve(doc);
        }
    });
    return deferred.promise.then(function (doc) {
        return doc;
    });
}
function createUser() {
    var deferred = Q.defer();
    var user = new User.model({
        _username: 'testuser'
    });
    user.save(function (err, doc) {
        if (err) {
            deferred.reject(err);
        }
        else {
            deferred.resolve(doc);
        }
    });
    return deferred.promise.then(function (doc) {
        return doc;
    });
}
describe('Models Logic - Plain Object Unit Tests', function () {
    describe('Conversion Functions', function () {
        before(function (done) {
            if (Models.connection.readyState === 1) {
                done();
                return;
            }
            Models.connection.once('error', function (error) {
                done(error);
            });
            Models.connection.once('open', function () {
                done();
            });
        });
        describe('convertTaskGroupInstance()', function () {
            var taskGroupId = '';
            beforeEach(function (done) {
                createTaskGroup().then(function (taskGroup) {
                    taskGroupId = taskGroup.id;
                    done();
                }, function (err) {
                    done(err);
                });
            });
            afterEach(function (done) {
                TaskGroup.model.findByIdAndRemove(taskGroupId, done);
            });
            it('Should fail when given null as an argument', function (done) {
                PlainObject.convertTaskGroupInstance(null).then(function () {
                    done(new Error('Did not fail'));
                }, function (err) {
                    done();
                });
            });
            it('Should successfully create a plain object', function () {
                return PromiseAdapter.convertMongooseQuery(TaskGroup.model.findById(taskGroupId))
                    .then(function (taskGroupInstance) {
                    return PlainObject.convertTaskGroupInstance(taskGroupInstance).then(function (plainObject) {
                        assert(plainObject.id === taskGroupInstance.id);
                        assert(plainObject.name === taskGroupInstance.name);
                        assert(plainObject.identifier === taskGroupInstance.identifier);
                    });
                });
            });
        });
        describe('convertTaskInfoInstance()', function () {
            var taskGroupId = '';
            var taskInfoId = '';
            beforeEach(function (done) {
                createTaskGroup().then(function (taskGroup) {
                    taskGroupId = taskGroup.id;
                    return createTaskInfo(taskGroup);
                }).then(function (taskInfo) {
                    taskInfoId = taskInfo.id;
                    done();
                }).fail(function (err) {
                    done(err);
                });
            });
            afterEach(function (done) {
                Q.all([
                    PromiseAdapter.convertMongooseQuery(TaskInfo.model.remove({ _id: taskInfoId })),
                    PromiseAdapter.convertMongooseQuery(TaskGroup.model.remove({ _id: taskGroupId }))
                ]).then(function () {
                    done();
                }, function (err) {
                    done(err);
                });
            });
            it('Should fail when given null as an argument', function (done) {
                PlainObject.convertTaskInfoInstance(null).then(function () {
                    done(new Error('Did not fail'));
                }, function (err) {
                    done();
                });
            });
            it('Should successfully create a plain object', function () {
                return Q.all([
                    PromiseAdapter.convertMongooseQuery(TaskGroup.model.findById(taskGroupId)),
                    PromiseAdapter.convertMongooseQuery(TaskInfo.model.findById(taskInfoId))
                ]).spread(function (taskGroup, taskInfo) {
                    return PlainObject.convertTaskInfoInstance(taskInfo).then(function (plainObject) {
                        assert(plainObject.id === taskInfo.id);
                        assert(plainObject.title === taskInfo.title);
                        assert(plainObject.description === taskInfo.description);
                        assert(plainObject.privacy === taskInfo.privacy);
                        assert(plainObject.taskGroup.id === taskGroup.id);
                        assert(plainObject.taskGroup.name === taskGroup.name);
                    });
                });
            });
            it('Should successfully create a plain object even if taskGroup property has already been populated', function () {
                return Q.all([
                    PromiseAdapter.convertMongooseQuery(TaskGroup.model.findById(taskGroupId)),
                    PromiseAdapter.convertMongooseQuery(TaskInfo.model.findById(taskInfoId))
                ]).spread(function (taskGroup, taskInfo) {
                    return taskInfo.populate('_taskGroup', function (err, taskInfo) {
                        if (err) {
                            throw err;
                        }
                        return PlainObject.convertTaskInfoInstance(taskInfo).then(function (plainObject) {
                            assert(plainObject.id === taskInfo.id);
                            assert(plainObject.title === taskInfo.title);
                            assert(plainObject.description === taskInfo.description);
                            assert(plainObject.privacy === taskInfo.privacy);
                            assert(plainObject.taskGroup.id === taskGroup.id);
                            assert(plainObject.taskGroup.name === taskGroup.name);
                        });
                    });
                });
            });
        });
        describe('convertTaskInstance()', function () {
            var taskGroupId = '';
            var taskInfoId = '';
            var taskId = '';
            beforeEach(function (done) {
                createTaskGroup().then(function (taskGroup) {
                    taskGroupId = taskGroup.id;
                    return createTaskInfo(taskGroup);
                }).then(function (taskInfo) {
                    taskInfoId = taskInfo.id;
                    return createTask(taskInfo);
                }).then(function (task) {
                    taskId = task.id;
                    done();
                }).fail(function (err) {
                    done(err);
                });
            });
            afterEach(function (done) {
                Q.all([
                    PromiseAdapter.convertMongooseQuery(TaskGroup.model.findByIdAndRemove(taskGroupId)),
                    PromiseAdapter.convertMongooseQuery(TaskInfo.model.findByIdAndRemove(taskInfoId)),
                    PromiseAdapter.convertMongooseQuery(Task.model.findByIdAndRemove(taskId))
                ]).then(function () {
                    done();
                }, function (err) {
                    done(err);
                });
            });
            it('Should fail when given null as an argument', function (done) {
                PlainObject.convertTaskInstance(null).then(function () {
                    done(new Error('Did not fail'));
                }, function (err) {
                    done();
                });
            });
            it('Should successfully create a plain object', function () {
                return Q.all([
                    PromiseAdapter.convertMongooseQuery(TaskGroup.model.findById(taskGroupId)),
                    PromiseAdapter.convertMongooseQuery(TaskInfo.model.findById(taskInfoId)),
                    PromiseAdapter.convertMongooseQuery(Task.model.findById(taskId))
                ]).spread(function (taskGroup, taskInfo, task) {
                    return PlainObject.convertTaskInstance(task).then(function (plainObject) {
                        assert(plainObject.id === task.id);
                        assert(plainObject.state === task.state);
                        assert(plainObject.taskInfo.id === taskInfo.id);
                        assert(plainObject.taskInfo.title === taskInfo.title);
                        assert(plainObject.taskInfo.description === taskInfo.description);
                        assert(plainObject.taskInfo.privacy === taskInfo.privacy);
                        assert(plainObject.taskInfo.taskGroup.id === taskGroup.id);
                        assert(plainObject.taskInfo.taskGroup.name === taskGroup.name);
                    });
                });
            });
            it('Should successfully create a plain object even if taskInfo property has already been populated', function () {
                return Q.all([
                    PromiseAdapter.convertMongooseQuery(TaskGroup.model.findById(taskGroupId)),
                    PromiseAdapter.convertMongooseQuery(TaskInfo.model.findById(taskInfoId)),
                    PromiseAdapter.convertMongooseQuery(Task.model.findById(taskId))
                ]).spread(function (taskGroup, taskInfo, task) {
                    return task.populate('_taskInfo', function (err, task) {
                        if (err) {
                            throw err;
                        }
                        return PlainObject.convertTaskInstance(task).then(function (plainObject) {
                            assert(plainObject.id === task.id);
                            assert(plainObject.state === task.state);
                            assert(plainObject.taskInfo.id === taskInfo.id);
                            assert(plainObject.taskInfo.title === taskInfo.title);
                            assert(plainObject.taskInfo.description === taskInfo.description);
                            assert(plainObject.taskInfo.privacy === taskInfo.privacy);
                            assert(plainObject.taskInfo.taskGroup.id === taskGroup.id);
                            assert(plainObject.taskInfo.taskGroup.name === taskGroup.name);
                        });
                    });
                });
            });
        });
        describe('convertUserInstance()', function () {
            var userId = '';
            beforeEach(function (done) {
                createUser().then(function (user) {
                    userId = user.id;
                    done();
                }, function (err) {
                    done(err);
                });
            });
            afterEach(function (done) {
                User.model.findByIdAndRemove(userId, done);
            });
            it('Should fail when given null as an argument', function (done) {
                PlainObject.convertUserInstance(null).then(function () {
                    done(new Error('Did not fail'));
                }, function (err) {
                    done();
                });
            });
            it('Should successfully create a plain object', function () {
                return PromiseAdapter.convertMongooseQuery(User.model.findById(userId))
                    .then(function (user) {
                    return PlainObject.convertUserInstance(user).then(function (plainObject) {
                        assert(plainObject.id === user.id);
                        assert(plainObject.username === user.username);
                        assert(plainObject.taskGroups.length == 0);
                    });
                });
            });
        });
    });
    describe('Validation Functions', function () {
        var badTaskGroups = [
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
        ];
        var goodTaskGroup = { id: '', name: '' };
        var badTaskInfos = [
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
        ];
        var goodTaskInfos = [
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
        ];
        var badTasks = [
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
        ];
        var goodTasks = [
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
        ];
        describe('validateTaskGroupPlainObject()', function () {
            it('Should fail on bad Task Group plain objects', function (done) {
                for (var i = 0; i < badTaskGroups.length; i++) {
                    var bad = badTaskGroups[i];
                    if (PlainObject.validateTaskGroupPlainObject(bad.value)) {
                        done(new Error('Validation passes for a bad object: ' + bad.explanation));
                        return;
                    }
                }
                done();
            });
            it('Should succeed on valid Task Group plain objects', function (done) {
                if (!PlainObject.validateTaskGroupPlainObject(goodTaskGroup)) {
                    done(new Error('Validation fails on a valid object.'));
                }
                else {
                    done();
                }
            });
        });
        describe('validateTaskInfoPlainObject()', function () {
            it('Should fail on bad Task Info plain objects', function (done) {
                for (var i = 0; i < badTaskInfos.length; i++) {
                    var bad = badTaskInfos[i];
                    if (PlainObject.validateTaskInfoPlainObject(bad.value)) {
                        done(new Error('Validation passes for a bad object: ' + bad.explanation));
                        return;
                    }
                }
                done();
            });
            it('Should fail on valid Task Info plain objects with invalid Task Group plain objects', function (done) {
                for (var i = 0; i < goodTaskInfos.length; i++) {
                    var good = JSON.parse(JSON.stringify(goodTaskInfos[i]));
                    for (var i_1 = 0; i_1 < badTaskGroups.length; i_1++) {
                        good.value.taskGroup = badTaskGroups[i_1].value;
                        if (PlainObject.validateTaskInfoPlainObject(good.value)) {
                            done(new Error('Validation passes for a bad object: ' + badTaskGroups[i_1].explanation));
                            return;
                        }
                    }
                }
                done();
            });
            it('Should succeed on valid Task Info plain objects', function (done) {
                for (var i = 0; i < goodTaskInfos.length; i++) {
                    var good = goodTaskInfos[i];
                    if (!PlainObject.validateTaskInfoPlainObject(good.value)) {
                        done(new Error('Validation fails for a valid object: ' + good.explanation));
                        return;
                    }
                }
                done();
            });
        });
        describe('validateTaskPlainObject()', function () {
            it('Should fail on bad Task plain objects', function (done) {
                for (var i = 0; i < badTasks.length; i++) {
                    var bad = badTasks[i];
                    if (PlainObject.validateTaskPlainObject(bad.value)) {
                        done(new Error('Validation passes for a bad object: ' + bad.explanation));
                        return;
                    }
                }
                done();
            });
            it('Should fail on valid Task plain objects with invalid Task Info plain objects', function (done) {
                for (var i = 0; i < goodTasks.length; i++) {
                    var good = JSON.parse(JSON.stringify(goodTasks[i]));
                    for (var i_2 = 0; i_2 < badTaskInfos.length; i_2++) {
                        good.value.taskInfo = badTaskInfos[i_2].value;
                        if (PlainObject.validateTaskPlainObject(good.value)) {
                            done(new Error('Validation passes for a bad object: ' + badTaskInfos[i_2].explanation));
                            return;
                        }
                    }
                }
                done();
            });
            it('Should fail on valid Task plain objects with invalid Task Group plain objects', function (done) {
                for (var i = 0; i < goodTasks.length; i++) {
                    var good = JSON.parse(JSON.stringify(goodTasks[i]));
                    for (var i_3 = 0; i_3 < goodTaskInfos.length; i_3++) {
                        good.value.taskInfo = JSON.parse(JSON.stringify(goodTaskInfos[i_3]));
                        for (var i_4 = 0; i_4 < badTaskGroups.length; i_4++) {
                            good.value.taskInfo.taskGroup = badTaskGroups[i_4];
                            if (PlainObject.validateTaskPlainObject(good.value)) {
                                done(new Error('Validation passes for a bad object: ' + badTaskGroups[i_4].explanation));
                                return;
                            }
                        }
                    }
                }
                done();
            });
            it('Should succeed on valid Task plain objects', function (done) {
                for (var i = 0; i < goodTasks.length; i++) {
                    var good = goodTasks[i];
                    if (!PlainObject.validateTaskPlainObject(good.value)) {
                        done(new Error('Validation fails for a valid object: ' + good.explanation));
                        return;
                    }
                }
                done();
            });
        });
    });
});
