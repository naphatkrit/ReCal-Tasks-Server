var assert = require('assert');
var Q = require('q');
var PromiseAdapter = require('../../lib/promise_adapter');
var PlainObject = require('./plain_object');
var TaskGroup = require('../task_group');
var TaskGroupLogic = require('./task_group_logic');
var User = require('../user');
var UserLogic;
(function (UserLogic) {
    function addTask(user, task) {
        return Q.fcall(function () {
            assert(user !== null && user !== undefined);
            assert(task !== null && task !== undefined);
            assert(task.id !== null && task.id !== undefined);
        }).then(function () {
            return PromiseAdapter.convertMongooseQuery(User.model.findById(user.id));
        }).then(function (user) {
            assert(user.tasks.indexOf(task.id) === -1);
            user.tasks.push(task.id);
            return PromiseAdapter.convertMongooseDocumentSave(user);
        }).then(function (user) {
            return PlainObject.convertUserInstance(user);
        });
    }
    UserLogic.addTask = addTask;
    function removeTask(user, task) {
        return Q.fcall(function () {
            assert(user !== null && user !== undefined);
            assert(task !== null && task !== undefined);
            assert(task.id !== null && task.id !== undefined);
        }).then(function () {
            return PromiseAdapter.convertMongooseQuery(User.model.findById(user.id));
        }).then(function (user) {
            var index = user.tasks.indexOf(task.id);
            assert(index !== -1);
            user.tasks.splice(index, 1);
            return PromiseAdapter.convertMongooseDocumentSave(user);
        }).then(function (user) {
            return PlainObject.convertUserInstance(user);
        });
    }
    UserLogic.removeTask = removeTask;
    function updateUser(userPlainObject) {
        function getTaskGroupId(taskGroupPlainObject) {
            return PromiseAdapter.convertMongooseQuery(TaskGroup.model.findOne({
                identifier: taskGroupPlainObject.identifier
            })).then(function (object) {
                if (object === null) {
                    throw new Error('not found');
                }
                return object.id;
            }).fail(function (err) {
                return TaskGroupLogic.createTaskGroup(taskGroupPlainObject).then(function (taskGroup) { return taskGroup.id; });
            });
        }
        return Q.fcall(function () {
            assert(userPlainObject !== null && userPlainObject !== undefined);
        }).then(function () {
            return PromiseAdapter.convertMongooseQuery(User.model.findById(userPlainObject.id));
        }).then(function (user) {
            assert(user.username === userPlainObject.username);
            return Q.all(userPlainObject.taskGroups.map(getTaskGroupId)).then(function (taskGroupIds) {
                user.taskGroups = taskGroupIds;
                return PromiseAdapter.convertMongooseDocumentSave(user);
            });
        }).then(function (user) {
            return PlainObject.convertUserInstance(user);
        });
    }
    UserLogic.updateUser = updateUser;
})(UserLogic || (UserLogic = {}));
module.exports = UserLogic;
