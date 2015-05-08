var assert = require('assert');
var Models = require('../models/index');
var TaskGroup = require('../models/task_group');
var PromiseAdapter = require('../lib/promise_adapter');
var TaskGroupLogic = require('../models/logic/task_group_logic');
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
    describe('createTaskGroup()', function () {
        it('Should fail when given null as an argument', function (done) {
            TaskGroupLogic.createTaskGroup(null).then(function () {
                done(new Error('Did not fail'));
            }, function (err) {
                done();
            });
        });
        it('Should fail when given a task group with id', function (done) {
            TaskGroupLogic.createTaskGroup({
                id: '123',
                identifier: 'cos126',
                name: 'name'
            }).then(function () {
                done(new Error('Did not fail'));
            }, function (err) {
                done();
            });
        });
        it('Should fail when the task group identifier already exists', function (done) {
            TaskGroupLogic.createTaskGroup({
                name: 'name',
                identifier: 'cos126'
            }).then(function (taskGroup) {
                TaskGroupLogic.createTaskGroup({
                    name: 'other name',
                    identifier: taskGroup.identifier
                }).then(function () {
                    PromiseAdapter.convertMongooseQuery(TaskGroup.model.findByIdAndRemove(taskGroup.id)).then(function () {
                        done(new Error('Did not fail'));
                    });
                }, function (error) {
                    PromiseAdapter.convertMongooseQuery(TaskGroup.model.findByIdAndRemove(taskGroup.id)).then(function () {
                        done();
                    });
                });
            });
        });
        it('Should successfully create a Task Group', function () {
            var name = 'name';
            var identifier = 'cos126';
            return TaskGroupLogic.createTaskGroup({
                name: name,
                identifier: identifier
            }).then(function (taskGroup) {
                return PromiseAdapter.convertMongooseQuery(TaskGroup.model.findByIdAndRemove(taskGroup.id)).then(function () {
                    assert(taskGroup !== null && taskGroup !== undefined);
                    assert(taskGroup.id !== null && taskGroup.id !== undefined);
                    assert(taskGroup.name === name);
                    assert(taskGroup.identifier === identifier);
                });
            });
        });
    });
});
