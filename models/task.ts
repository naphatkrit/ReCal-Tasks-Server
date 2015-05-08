import mongoose = require("mongoose");
import Q = require('q');

import updatedStatusPlugin = require("./plugins/updated_status");
import modelInvariantsPluginGenerator = require('./plugins/model_invariants');
import Invariants = require("../lib/invariants");

module Task
{
    /******************************************
     * Schema
     *****************************************/
    let taskSchema = new mongoose.Schema(
        {
            _state: {
                type: Number,
                required: true
            },
            _taskInfo: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'TaskInfo',
                required: true
            }
        }, {
            autoIndex: process.env.NODE_ENV === 'development',
        });

    /******************************************
     * Getters/Setters
     *****************************************/
    taskSchema.virtual('state').get(function(): TaskState
    {
        if (this._state === null || this._state === undefined)
        {
            return TaskState.Incomplete;
        }
        return this._state;
    })
    taskSchema.virtual('state').set(function(newState: TaskState)
    {
        this._state = newState;
    })

    taskSchema.virtual('taskInfo').get(function()
    {
        if (this._taskInfo === undefined)
        {
            return null;
        }
        return this._taskInfo;
    })
    taskSchema.virtual('taskInfo').set(function(newValue)
    {
        this._taskInfo = newValue;
    })

    /******************************************
     * Validations
     *****************************************/
    taskSchema.path('_state').validate(function(value)
    {
        let stateName = TaskState[value];
        return stateName !== null && stateName !== undefined;
    })

    /******************************************
     * Plugins
     *****************************************/
    taskSchema.plugin(updatedStatusPlugin);
    taskSchema.plugin(modelInvariantsPluginGenerator(invariants))

    /******************************************
     * Model
     *****************************************/
    export var model = mongoose.model("Task", taskSchema);

    /******************************************
     * Exported Interfaces
     *****************************************/
    export enum TaskState { Incomplete, Complete };
    export interface Instance extends mongoose.Document
    {
        state: TaskState;
        taskInfo: mongoose.Types.ObjectId | any;
        execPopulate(): mongoose.Promise<Instance>
    }

    /******************************************
     * Invariants
     *****************************************/
    /**
     * Mongoose does not support model level validation. Do that here.
     */
    function invariants(task): Q.Promise<Invariants.Invariant>
    {
        return Q.fcall(() =>
        {
            return [

            ].reduce(Invariants.chain, Invariants.Predefined.alwaysTrue);
        })
    }
}

export = Task;
