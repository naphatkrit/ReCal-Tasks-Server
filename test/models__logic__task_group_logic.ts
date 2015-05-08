import mocha = require('mocha');
import assert = require('assert');
import Q = require('q');
import mongoose = require('mongoose');

import Models = require('../models/index');
import TaskGroup = require('../models/task_group');
import PromiseAdapter = require('../lib/promise_adapter');
import TaskGroupLogic = require('../models/logic/task_group_logic');

describe('Task Logic Unit Tests', () =>
{
    before((done) =>
    {
        if (Models.connection.readyState === 1)
        {
            done();
            return;
        }
        Models.connection.on('error', (error) =>
        {
            done(error);
        })
        Models.connection.on('open', () =>
        {
            done();
        })
    })
    describe('createTaskGroup()', () =>
    {
        it('Should fail when given null as an argument', (done) =>
        {
            TaskGroupLogic.createTaskGroup(null).then(
                () =>
                {
                    done(new Error('Did not fail'));
                }, (err) =>
                {
                    done();
                })
        })
        it('Should fail when given a task group with id', (done) =>
        {
            TaskGroupLogic.createTaskGroup({
                id: '123',
                identifier: 'cos126',
                name: 'name'
            }).then(
                () =>
                {
                    done(new Error('Did not fail'));
                }, (err) =>
                {
                    done();
                })
        })
        it('Should fail when the task group identifier already exists', (done) =>
        {
            TaskGroupLogic.createTaskGroup({
                name: 'name',
                identifier: 'cos126'
            }).then((taskGroup) =>
            {
                TaskGroupLogic.createTaskGroup({
                    name: 'other name',
                    identifier: taskGroup.identifier
                }).then(() =>
                {
                    PromiseAdapter.convertMongooseQuery(TaskGroup.model.findByIdAndRemove(taskGroup.id)).then(() =>
                    {
                        done(new Error('Did not fail'));
                    })
                }, (error) =>
                    {
                        PromiseAdapter.convertMongooseQuery(TaskGroup.model.findByIdAndRemove(taskGroup.id)).then(() =>
                        {
                            done();
                        })
                    })
            })
        })
        it('Should successfully create a Task Group', () =>
        {
            const name = 'name';
            const identifier = 'cos126';
            return TaskGroupLogic.createTaskGroup({
                name: name,
                identifier: identifier
            }).then((taskGroup) =>
            {
                return PromiseAdapter.convertMongooseQuery(TaskGroup.model.findByIdAndRemove(taskGroup.id)).then(() =>
                {
                    assert(taskGroup !== null && taskGroup !== undefined);
                    assert(taskGroup.id !== null && taskGroup.id !== undefined);
                    assert(taskGroup.name === name);
                    assert(taskGroup.identifier === identifier);
                })
            })
        })
    }) // createTaskGroup()
})
