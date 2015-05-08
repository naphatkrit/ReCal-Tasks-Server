import assert = require('assert');
import Q = require('q');

import PromiseAdapter = require('../../lib/promise_adapter');

import PlainObject = require('./plain_object');
import TaskGroup = require('../task_group');

module TaskGroupLogic
{
    export function createTaskGroup(taskGroupPlainObject: PlainObject.Interfaces.TaskGroupPlainObject): Q.Promise<PlainObject.Interfaces.TaskGroupPlainObject>
    {
        return Q.fcall(() =>
        {
            assert(taskGroupPlainObject !== null && taskGroupPlainObject !== undefined);
            assert(taskGroupPlainObject.id === null || taskGroupPlainObject.id === undefined);
        }).then(() =>
        {
            const taskGroup = <TaskGroup.Instance> new TaskGroup.model({
                _name: taskGroupPlainObject.name,
                _identifier: taskGroupPlainObject.identifier,
            })
            return PromiseAdapter.convertMongooseDocumentSave(taskGroup);
        }).then((taskGroup) =>
        {
            return PlainObject.convertTaskGroupInstance(taskGroup);
        })
    }
}

export = TaskGroupLogic
