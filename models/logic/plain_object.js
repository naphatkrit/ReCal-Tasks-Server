var assert = require('assert');
var Q = require('q');
var Task = require('../task');
var TaskInfo = require('../task_info');
var PromiseAdapter = require('../../lib/promise_adapter');
var PlainObject;
(function (PlainObject) {
    function convertTaskGroupInstance(taskGroup) {
        return Q.fcall(function () {
            assert(taskGroup !== null && taskGroup !== undefined);
            return {
                id: taskGroup.id,
                name: taskGroup.name,
                identifier: taskGroup.identifier
            };
        });
    }
    PlainObject.convertTaskGroupInstance = convertTaskGroupInstance;
    function convertTaskInfoInstance(taskInfo) {
        return Q.fcall(function () {
            assert(taskInfo !== null && taskInfo !== undefined);
        }).then(function () {
            return PromiseAdapter.convertMongoosePromise(taskInfo.populate('_taskGroup').execPopulate());
        }).then(function (taskInfo) {
            return convertTaskGroupInstance(taskInfo.taskGroup);
        }).then(function (taskGroupPlainObject) {
            return {
                id: taskInfo.id,
                title: taskInfo.title,
                description: taskInfo.description,
                privacy: taskInfo.privacy,
                taskGroup: taskGroupPlainObject,
                previousVersionId: taskInfo.previousVersion ? taskInfo.previousVersion : undefined
            };
        });
    }
    PlainObject.convertTaskInfoInstance = convertTaskInfoInstance;
    function convertTaskInstance(task) {
        return Q.fcall(function () {
            assert(task !== null && task !== undefined);
        }).then(function () {
            return PromiseAdapter.convertMongoosePromise(task.populate('_taskInfo').execPopulate());
        }).then(function (task) {
            return convertTaskInfoInstance(task.taskInfo);
        }).then(function (taskInfoPlainObject) {
            return {
                id: task.id,
                state: task.state,
                taskInfo: taskInfoPlainObject
            };
        });
    }
    PlainObject.convertTaskInstance = convertTaskInstance;
    function convertUserInstance(user) {
        return Q.fcall(function () {
            assert(user !== null && user !== undefined);
        }).then(function () {
            return PromiseAdapter.convertMongooseDocumentPopulate(user, "_taskGroups");
        }).then(function (user) {
            return Q.all(user.taskGroups.map(convertTaskGroupInstance));
        }).then(function (taskGroups) {
            return {
                id: user.id,
                username: user.username,
                taskGroups: taskGroups
            };
        });
    }
    PlainObject.convertUserInstance = convertUserInstance;
    function validateTaskGroupPlainObject(object) {
        try {
            assert(object !== null && object !== undefined);
            assert(typeof object.id === 'string');
            assert(typeof object.name === 'string');
            return true;
        }
        catch (e) {
            return false;
        }
    }
    PlainObject.validateTaskGroupPlainObject = validateTaskGroupPlainObject;
    function validateTaskInfoPlainObject(object) {
        try {
            assert(object !== null && object !== undefined);
            if (object.id !== undefined) {
                assert(typeof object.id === 'string');
            }
            assert(typeof object.title === 'string');
            assert(typeof object.description === 'string');
            assert(typeof TaskInfo.TaskPrivacy[object.privacy] === 'string');
            if (object.previousVersionId !== undefined) {
                assert(typeof object.previousVersionId === 'string');
            }
            assert(validateTaskGroupPlainObject(object.taskGroup));
            return true;
        }
        catch (e) {
            return false;
        }
    }
    PlainObject.validateTaskInfoPlainObject = validateTaskInfoPlainObject;
    function validateTaskPlainObject(object) {
        try {
            assert(object !== null && object !== undefined);
            if (object.id !== undefined) {
                assert(typeof object.id === 'string');
            }
            assert(typeof Task.TaskState[object.state] === 'string');
            assert(validateTaskInfoPlainObject(object.taskInfo));
            return true;
        }
        catch (e) {
            return false;
        }
    }
    PlainObject.validateTaskPlainObject = validateTaskPlainObject;
    function castTaskPlainObject(object) {
        if (validateTaskPlainObject(object)) {
            return object;
        }
        else {
            return null;
        }
    }
    PlainObject.castTaskPlainObject = castTaskPlainObject;
})(PlainObject || (PlainObject = {}));
module.exports = PlainObject;
