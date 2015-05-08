var assert = require('assert');
var mongoose = require('mongoose');
var Q = require('q');
var PromiseAdapter = require('../../lib/promise_adapter');
var PlainObject = require('./plain_object');
var Task = require('../task');
var TaskInfo = require('../task_info');
var TaskGroup = require('../task_group');
var TaskLogic;
(function (TaskLogic) {
    function createTaskInfo(taskInfoPlainObject) {
        return Q.fcall(function () {
            assert(taskInfoPlainObject !== null && taskInfoPlainObject !== undefined);
            assert(taskInfoPlainObject.id === null || taskInfoPlainObject.id === undefined);
        }).then(function () {
            return PromiseAdapter.convertMongooseQuery(TaskGroup.model.count({
                _id: mongoose.Types.ObjectId(taskInfoPlainObject.taskGroup.id),
                _name: taskInfoPlainObject.taskGroup.name,
                _identifier: taskInfoPlainObject.taskGroup.identifier,
            })).then(function (count) { assert(count > 0, "Task Group Plain Object must correspond to a valid Task Group instance."); });
        }).then(function () {
            var taskInfo = new TaskInfo.model({
                _title: taskInfoPlainObject.title,
                _description: taskInfoPlainObject.description,
                _privacy: taskInfoPlainObject.privacy,
                _taskGroup: mongoose.Types.ObjectId(taskInfoPlainObject.taskGroup.id),
                _previousVersion: taskInfoPlainObject.previousVersionId ? mongoose.Types.ObjectId(taskInfoPlainObject.previousVersionId) : undefined
            });
            return PromiseAdapter.convertMongooseDocumentSave(taskInfo);
        }).then(function (taskInfo) {
            return PlainObject.convertTaskInfoInstance(taskInfo);
        });
    }
    TaskLogic.createTaskInfo = createTaskInfo;
    function createTask(taskPlainObject) {
        return Q.fcall(function () {
            assert(taskPlainObject !== null && taskPlainObject !== undefined);
            assert(taskPlainObject.id === null || taskPlainObject.id === undefined);
        }).then(function () {
            if (taskPlainObject.taskInfo.id) {
                return PromiseAdapter.convertMongooseQuery(TaskInfo.model.count({
                    _id: mongoose.Types.ObjectId(taskPlainObject.taskInfo.id),
                    _title: taskPlainObject.taskInfo.title,
                    _description: taskPlainObject.taskInfo.description,
                    _privacy: taskPlainObject.taskInfo.privacy,
                    _taskGroup: mongoose.Types.ObjectId(taskPlainObject.taskInfo.taskGroup.id)
                })).then(function (count) {
                    assert(count > 0, "Task Info Plain Object must correspond to a valid Task Info instance.");
                }).then(function () {
                    return taskPlainObject.taskInfo.id;
                });
            }
            else {
                return createTaskInfo(taskPlainObject.taskInfo).then(function (taskInfoPlainObject) { return taskInfoPlainObject.id; });
            }
        }).then(function (taskInfoId) {
            var task = new Task.model({
                _state: taskPlainObject.state,
                _taskInfo: mongoose.Types.ObjectId(taskInfoId)
            });
            return PromiseAdapter.convertMongooseDocumentSave(task);
        }).then(function (task) {
            return PlainObject.convertTaskInstance(task);
        });
    }
    TaskLogic.createTask = createTask;
    function updateTask(taskPlainObject) {
        return Q.fcall(function () {
            assert(taskPlainObject !== null && taskPlainObject !== undefined);
            assert(taskPlainObject.id !== null && taskPlainObject.id !== undefined);
        }).then(function () {
            if (taskPlainObject.taskInfo.id) {
                return PromiseAdapter.convertMongooseQuery(TaskInfo.model.count({
                    _id: mongoose.Types.ObjectId(taskPlainObject.taskInfo.id),
                    _title: taskPlainObject.taskInfo.title,
                    _description: taskPlainObject.taskInfo.description,
                    _privacy: taskPlainObject.taskInfo.privacy,
                    _taskGroup: mongoose.Types.ObjectId(taskPlainObject.taskInfo.taskGroup.id)
                })).then(function (count) {
                    assert(count > 0, "Task Info Plain Object must correspond to a valid Task Info instance.");
                }).then(function () {
                    return taskPlainObject.taskInfo.id;
                });
            }
            else {
                return createTaskInfo(taskPlainObject.taskInfo).then(function (taskInfoPlainObject) { return taskInfoPlainObject.id; });
            }
        }).then(function (taskInfoId) {
            return PromiseAdapter.convertMongooseQuery(Task.model.findById(taskPlainObject.id)).then(function (task) {
                task.state = taskPlainObject.state;
                task.taskInfo = mongoose.Types.ObjectId(taskInfoId);
                return PromiseAdapter.convertMongooseDocumentSave(task);
            });
        }).then(function (task) {
            return PlainObject.convertTaskInstance(task);
        });
    }
    TaskLogic.updateTask = updateTask;
})(TaskLogic || (TaskLogic = {}));
module.exports = TaskLogic;
