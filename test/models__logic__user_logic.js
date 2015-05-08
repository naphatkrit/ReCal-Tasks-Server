var assert = require('assert');
var Q = require('q');
var Models = require('../models/index');
var Task = require('../models/task');
var TaskGroup = require('../models/task_group');
var TaskInfo = require('../models/task_info');
var PromiseAdapter = require('../lib/promise_adapter');
var PlainObject = require('../models/logic/plain_object');
var User = require('../models/user');
var UserLogic = require('../models/logic/user_logic');
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
describe('User Logic Unit Tests', function () {
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
    describe('addTask()', function () {
        var userPlainObject = null;
        var taskPlainObject = null;
        beforeEach(function (done) {
            createTaskGroup().then(function (taskGroup) {
                return createTaskInfo(taskGroup);
            }).then(function (taskInfo) {
                return createTask(taskInfo);
            }).then(function (task) {
                return PlainObject.convertTaskInstance(task);
            }).then(function (task) {
                taskPlainObject = task;
                return createUser();
            }).then(function (user) {
                user.taskGroups.push(taskPlainObject.taskInfo.taskGroup.id);
                return PromiseAdapter.convertMongooseDocumentSave(user);
            }).then(function (user) {
                return PlainObject.convertUserInstance(user);
            }).then(function (user) {
                userPlainObject = user;
                done();
            }).fail(function (err) {
                done(err);
            });
        });
        afterEach(function (done) {
            Q.all([
                PromiseAdapter.convertMongooseQuery(TaskInfo.model.findByIdAndRemove(taskPlainObject.taskInfo.id)),
                PromiseAdapter.convertMongooseQuery(TaskGroup.model.findByIdAndRemove(taskPlainObject.taskInfo.taskGroup.id)),
                PromiseAdapter.convertMongooseQuery(Task.model.findByIdAndRemove(taskPlainObject.id)),
                PromiseAdapter.convertMongooseQuery(User.model.findByIdAndRemove(userPlainObject.id))
            ]).then(function () {
                done();
            }, function (err) {
                done(err);
            });
        });
        it('Should fail when user is null', function (done) {
            UserLogic.addTask(null, taskPlainObject).then(function () {
                done(new Error('Did not fail'));
            }, function (err) {
                done();
            });
        });
        it('Should fail when task is null', function (done) {
            UserLogic.addTask(userPlainObject, null).then(function () {
                done(new Error('Did not fail'));
            }, function (err) {
                done();
            });
        });
        it('Should fail when task id is null', function (done) {
            var copy = JSON.parse(JSON.stringify(taskPlainObject));
            delete copy.id;
            UserLogic.addTask(userPlainObject, copy).then(function () {
                done(new Error('Did not fail'));
            }, function (err) {
                done();
            });
        });
        it('Should fail when the task being added belongs to a task group that the user does not belong to', function (done) {
            PromiseAdapter.convertMongooseQuery(User.model.findById(userPlainObject.id)).then(function (user) {
                user.taskGroups = [];
                return PromiseAdapter.convertMongooseDocumentSave(user);
            }).then(function () {
                return UserLogic.addTask(userPlainObject, taskPlainObject);
            }).then(function () {
                done(new Error('Did not fail'));
            }, function (err) {
                done();
            });
        });
        it('Should fail when adding a task twice to a user', function (done) {
            UserLogic.addTask(userPlainObject, taskPlainObject).then(function (newUserPlainObject) {
                return UserLogic.addTask(userPlainObject, taskPlainObject);
            }).then(function () {
                done(new Error('Did not fail'));
            }, function (err) {
                done();
            });
        });
        it('Should successfull add a task to a user', function () {
            return UserLogic.addTask(userPlainObject, taskPlainObject).then(function (newUserPlainObject) {
                assert(newUserPlainObject.id === userPlainObject.id);
                return PromiseAdapter.convertMongooseQuery(User.model.findById(newUserPlainObject.id));
            }).then(function (user) {
                assert(user.tasks.indexOf(taskPlainObject.id) !== -1);
            });
        });
    });
    describe('removeTask()', function () {
        var userPlainObject = null;
        var taskPlainObject = null;
        beforeEach(function (done) {
            createTaskGroup().then(function (taskGroup) {
                return createTaskInfo(taskGroup);
            }).then(function (taskInfo) {
                return createTask(taskInfo);
            }).then(function (task) {
                return PlainObject.convertTaskInstance(task);
            }).then(function (task) {
                taskPlainObject = task;
                return createUser();
            }).then(function (user) {
                user.taskGroups.push(taskPlainObject.taskInfo.taskGroup.id);
                user.tasks.push(taskPlainObject.id);
                return PromiseAdapter.convertMongooseDocumentSave(user);
            }).then(function (user) {
                return PlainObject.convertUserInstance(user);
            }).then(function (user) {
                userPlainObject = user;
                done();
            }).fail(function (err) {
                done(err);
            });
        });
        afterEach(function (done) {
            Q.all([
                PromiseAdapter.convertMongooseQuery(TaskInfo.model.findByIdAndRemove(taskPlainObject.taskInfo.id)),
                PromiseAdapter.convertMongooseQuery(TaskGroup.model.findByIdAndRemove(taskPlainObject.taskInfo.taskGroup.id)),
                PromiseAdapter.convertMongooseQuery(Task.model.findByIdAndRemove(taskPlainObject.id)),
                PromiseAdapter.convertMongooseQuery(User.model.findByIdAndRemove(userPlainObject.id))
            ]).then(function () {
                done();
            }, function (err) {
                done(err);
            });
        });
        it('Should fail when user is null', function (done) {
            UserLogic.removeTask(null, taskPlainObject).then(function () {
                done(new Error('Did not fail'));
            }, function (err) {
                done();
            });
        });
        it('Should fail when task is null', function (done) {
            UserLogic.removeTask(userPlainObject, null).then(function () {
                done(new Error('Did not fail'));
            }, function (err) {
                done();
            });
        });
        it('Should fail when task id is null', function (done) {
            var copy = JSON.parse(JSON.stringify(taskPlainObject));
            delete copy.id;
            UserLogic.removeTask(userPlainObject, copy).then(function () {
                done(new Error('Did not fail'));
            }, function (err) {
                done();
            });
        });
        it('Should successfull remove a task from a user', function () {
            return UserLogic.removeTask(userPlainObject, taskPlainObject).then(function (newUserPlainObject) {
                assert(newUserPlainObject.id === userPlainObject.id);
                return PromiseAdapter.convertMongooseQuery(User.model.findById(newUserPlainObject.id));
            }).then(function (user) {
                assert(user.tasks.indexOf(taskPlainObject.id) === -1);
            });
        });
    });
});
