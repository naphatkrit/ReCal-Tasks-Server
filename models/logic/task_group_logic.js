var assert = require('assert');
var Q = require('q');
var PromiseAdapter = require('../../lib/promise_adapter');
var PlainObject = require('./plain_object');
var TaskGroup = require('../task_group');
var TaskGroupLogic;
(function (TaskGroupLogic) {
    function createTaskGroup(taskGroupPlainObject) {
        return Q.fcall(function () {
            assert(taskGroupPlainObject !== null && taskGroupPlainObject !== undefined);
            assert(taskGroupPlainObject.id === null || taskGroupPlainObject.id === undefined);
        }).then(function () {
            var taskGroup = new TaskGroup.model({
                _name: taskGroupPlainObject.name,
                _identifier: taskGroupPlainObject.identifier,
            });
            return PromiseAdapter.convertMongooseDocumentSave(taskGroup);
        }).then(function (taskGroup) {
            return PlainObject.convertTaskGroupInstance(taskGroup);
        });
    }
    TaskGroupLogic.createTaskGroup = createTaskGroup;
})(TaskGroupLogic || (TaskGroupLogic = {}));
module.exports = TaskGroupLogic;
