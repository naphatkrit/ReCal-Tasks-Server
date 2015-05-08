var assert = require('assert');
var Q = require('q');
var Models = require('../models/index');
var Task = require('../models/task');
var TaskGroup = require('../models/task_group');
var TaskInfo = require('../models/task_info');
var PromiseAdapter = require('../lib/promise_adapter');
var TaskLogic = require('../models/logic/task_logic');
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
        _title: "Dummy Task",
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
describe('Task Logic Unit Tests', function () {
    before(function (done) {
        if (Models.connection.readyState === 1) {
            done();
            return;
        }
        Models.connection.on('error', function (error) {
            done(error);
        });
        Models.connection.on('open', function () {
            done();
        });
    });
    describe('createTaskInfo()', function () {
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
            TaskLogic.createTaskInfo(null).then(function () {
                done(new Error('Did not fail'));
            }, function (err) {
                done();
            });
        });
        it('Should not accept a plain object without a task group id', function (done) {
            TaskLogic.createTaskInfo({
                title: 'title',
                description: '',
                privacy: TaskInfo.TaskPrivacy.Private,
                taskGroup: {
                    name: 'Dummy Task Group',
                    identifier: "cos333"
                }
            }).then(function () {
                done(new Error('Did not fail'));
            }, function (err) {
                done();
            });
        });
        it('Should not accept a plain object with nonexistent Task Group id', function (done) {
            TaskLogic.createTaskInfo({
                title: 'title',
                description: '',
                privacy: TaskInfo.TaskPrivacy.Private,
                taskGroup: {
                    id: '123456789123',
                    name: 'Dummy Task Group',
                    identifier: "cos333"
                }
            }).then(function () {
                done(new Error('Did not fail'));
            }, function (err) {
                done();
            });
        });
        it('Should not accept a plain object with errorneous Task Group name', function (done) {
            TaskLogic.createTaskInfo({
                title: 'title',
                description: '',
                privacy: TaskInfo.TaskPrivacy.Private,
                taskGroup: {
                    id: taskGroupId,
                    name: 'Dummy Task ',
                    identifier: "cos333",
                }
            }).then(function () {
                done(new Error('Did not fail'));
            }, function (err) {
                done();
            });
        });
        it('Should not accept a plain object with errorneous Task Group identifier', function (done) {
            TaskLogic.createTaskInfo({
                title: 'title',
                description: '',
                privacy: TaskInfo.TaskPrivacy.Private,
                taskGroup: {
                    id: taskGroupId,
                    name: 'Dummy Task ',
                    identifier: "cos334",
                }
            }).then(function () {
                done(new Error('Did not fail'));
            }, function (err) {
                done();
            });
        });
        it('Should not accept a plain object with id', function (done) {
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
            }).then(function () {
                done(new Error('Did not fail'));
            }, function (err) {
                done();
            });
        });
        it('Should successfully create a task info', function () {
            var title = 'title';
            var description = '';
            var privacy = TaskInfo.TaskPrivacy.Public;
            return TaskLogic.createTaskInfo({
                title: title,
                description: description,
                privacy: privacy,
                taskGroup: {
                    id: taskGroupId,
                    name: 'Dummy Task Group',
                    identifier: "cos333"
                }
            }).then(function (taskInfoPlainObject) {
                assert(taskInfoPlainObject.id !== null && taskInfoPlainObject.id !== undefined);
                assert(taskInfoPlainObject.title === title);
                assert(taskInfoPlainObject.description === description);
                assert(taskInfoPlainObject.privacy === privacy);
                assert(taskInfoPlainObject.taskGroup.id === taskGroupId);
                return taskInfoPlainObject;
            }).then(function (taskInfoPlainObject) {
                return PromiseAdapter.convertMongooseQuery(TaskInfo.model.findByIdAndRemove(taskInfoPlainObject.id));
            });
        });
    });
    describe('createTask()', function () {
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
            TaskLogic.createTask(null).then(function () {
                done(new Error('Did not fail'));
            }, function (err) {
                done();
            });
        });
        it('Should not accept a plain object with id', function (done) {
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
            }).then(function () {
                done(new Error('Did not fail'));
            }, function (err) {
                done();
            });
        });
        it('Should not accept a plain object with incorrect task info plain object', function (done) {
            TaskLogic.createTask({
                state: Task.TaskState.Incomplete,
                taskInfo: {
                    id: taskInfoId,
                    title: 'Dummy Task blah blah',
                    description: '',
                    privacy: TaskInfo.TaskPrivacy.Private,
                    taskGroup: {
                        id: taskGroupId,
                        name: 'Dummy Task Group',
                        identifier: "cos333",
                    }
                }
            }).then(function () {
                done(new Error('Did not fail'));
            }, function (err) {
                done();
            });
        });
        it('Should successfully create a task with existing task info', function () {
            var state = Task.TaskState.Complete;
            var title = 'Dummy Task';
            var description = '';
            var privacy = TaskInfo.TaskPrivacy.Private;
            var groupName = 'Dummy Task Group';
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
            }).then(function (taskPlainObject) {
                assert(taskPlainObject.id !== null && taskPlainObject.id !== undefined);
                assert(taskPlainObject.state === state);
                assert(taskPlainObject.taskInfo.id === taskInfoId);
                assert(taskPlainObject.taskInfo.title === title);
                assert(taskPlainObject.taskInfo.description === description);
                assert(taskPlainObject.taskInfo.privacy === privacy);
                assert(taskPlainObject.taskInfo.taskGroup.id === taskGroupId);
                assert(taskPlainObject.taskInfo.taskGroup.name === groupName);
                return taskPlainObject;
            }).then(function (taskPlainObject) {
                return PromiseAdapter.convertMongooseQuery(Task.model.findByIdAndRemove(taskPlainObject.id));
            });
        });
        it('Should successfully create a task with a new task info', function () {
            var state = Task.TaskState.Incomplete;
            var title = 'Dummy Task 2';
            var description = 'dasfklasdf';
            var privacy = TaskInfo.TaskPrivacy.Public;
            var groupName = 'Dummy Task Group';
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
            }).then(function (taskPlainObject) {
                assert(taskPlainObject.id !== null && taskPlainObject.id !== undefined);
                assert(taskPlainObject.state === state);
                assert(taskPlainObject.taskInfo.id !== null && taskPlainObject.taskInfo.id !== undefined);
                assert(taskPlainObject.taskInfo.title === title);
                assert(taskPlainObject.taskInfo.description === description);
                assert(taskPlainObject.taskInfo.privacy === privacy);
                assert(taskPlainObject.taskInfo.taskGroup.id === taskGroupId);
                assert(taskPlainObject.taskInfo.taskGroup.name === groupName);
                return taskPlainObject;
            }).then(function (taskPlainObject) {
                return Q.all([
                    PromiseAdapter.convertMongooseQuery(Task.model.findByIdAndRemove(taskPlainObject.id)),
                    PromiseAdapter.convertMongooseQuery(TaskInfo.model.findByIdAndRemove(taskPlainObject.taskInfo.id))
                ]);
            });
        });
    });
    describe('updateTask()', function () {
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
                PromiseAdapter.convertMongooseQuery(TaskInfo.model.findByIdAndRemove(taskInfoId)),
                PromiseAdapter.convertMongooseQuery(TaskGroup.model.findByIdAndRemove(taskGroupId)),
                PromiseAdapter.convertMongooseQuery(Task.model.findByIdAndRemove(taskId))
            ]).then(function () {
                done();
            }, function (err) {
                done(err);
            });
        });
        it('Should fail when given null as an argument', function (done) {
            TaskLogic.updateTask(null).then(function () {
                done(new Error('Did not fail'));
            }, function (err) {
                done();
            });
        });
        it('Should not accept a plain object without id', function (done) {
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
            }).then(function () {
                done(new Error('Did not fail'));
            }, function (err) {
                done();
            });
        });
        it('Should not accept a plain object with incorrect task info plain object', function (done) {
            TaskLogic.updateTask({
                id: taskId,
                state: Task.TaskState.Incomplete,
                taskInfo: {
                    id: taskInfoId,
                    title: 'Dummy Task blah blah',
                    description: '',
                    privacy: TaskInfo.TaskPrivacy.Private,
                    taskGroup: {
                        id: taskGroupId,
                        name: 'Dummy Task Group',
                        identifier: "cos333",
                    }
                }
            }).then(function () {
                done(new Error('Did not fail'));
            }, function (err) {
                done();
            });
        });
        it('Should successfully update a task with existing task info', function () {
            var state = Task.TaskState.Complete;
            var title = 'Dummy Task';
            var description = '';
            var privacy = TaskInfo.TaskPrivacy.Private;
            var groupName = 'Dummy Task Group';
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
            }).then(function (taskPlainObject) {
                assert(taskPlainObject.id === taskId);
                assert(taskPlainObject.state === state);
                assert(taskPlainObject.taskInfo.id === taskInfoId);
                assert(taskPlainObject.taskInfo.title === title);
                assert(taskPlainObject.taskInfo.description === description);
                assert(taskPlainObject.taskInfo.privacy === privacy);
                assert(taskPlainObject.taskInfo.taskGroup.id === taskGroupId);
                assert(taskPlainObject.taskInfo.taskGroup.name === groupName);
                return taskPlainObject;
            });
        });
        it('Should successfully update a task with a new task info', function () {
            var state = Task.TaskState.Incomplete;
            var title = 'Dummy Task 2';
            var description = 'dasfklasdf';
            var privacy = TaskInfo.TaskPrivacy.Public;
            var groupName = 'Dummy Task Group';
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
            }).then(function (taskPlainObject) {
                assert(taskPlainObject.id !== null && taskPlainObject.id !== undefined);
                assert(taskPlainObject.state === state);
                assert(taskPlainObject.taskInfo.id !== null && taskPlainObject.taskInfo.id !== undefined);
                assert(taskPlainObject.taskInfo.title === title);
                assert(taskPlainObject.taskInfo.description === description);
                assert(taskPlainObject.taskInfo.privacy === privacy);
                assert(taskPlainObject.taskInfo.taskGroup.id === taskGroupId);
                assert(taskPlainObject.taskInfo.taskGroup.name === groupName);
                return taskPlainObject;
            }).then(function (taskPlainObject) {
                return Q.all([
                    PromiseAdapter.convertMongooseQuery(TaskInfo.model.findByIdAndRemove(taskPlainObject.taskInfo.id))
                ]);
            });
        });
    });
});
