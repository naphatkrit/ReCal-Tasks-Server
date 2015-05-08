import mongoose = require('mongoose');
import Q = require('q');

import updatedStatusPlugin = require("./plugins/updated_status");
import modelInvariantsPluginGenerator = require('./plugins/model_invariants');
import Invariants = require("../lib/invariants");

module TaskInfo
{
    let taskInfoSchema = new mongoose.Schema({
        _title: {
            type: String,
            required: true // NOTE: required = not empty
        },
        _description: {
            type: String,
        },
        _privacy: {
            type: Number,
            required: true
        },
        _previousVersion: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'TaskInfo',
        },
        _taskGroup: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'TaskGroup',
            required: true,
            index: {
                unique: false,
            }
        }
    })

    /******************************************
     * Getters/Setters
     *****************************************/
    taskInfoSchema.virtual('title').get(function(): string
    {
        if (this._title === null || this._title === undefined)
        {
            return ''
        }
        return this._title;
    })
    taskInfoSchema.virtual('title').set(function(newValue: string)
    {
        this._title = newValue;
    })
    taskInfoSchema.virtual('description').get(function(): string
    {
        if (this._description === null || this._description === undefined)
        {
            return '';
        }
        return this._description;
    })
    taskInfoSchema.virtual('description').set(function(newValue: string)
    {
        this._description = newValue;
    })
    taskInfoSchema.virtual('privacy').get(function(): TaskPrivacy
    {
        if (this._privacy === null || this._privacy === undefined)
        {
            return TaskPrivacy.Private;
        }
        return this._privacy;
    })
    taskInfoSchema.virtual('privacy').set(function(newValue: TaskPrivacy)
    {
        this._privacy = newValue;
    })
    taskInfoSchema.virtual('previousVersion').get(function()
    {
        if (this._previousVersion === undefined)
        {
            return null;
        }
        return this._previousVersion;
    })
    taskInfoSchema.virtual('previousVersion').set(function(newValue)
    {
        this._previousVersion = newValue; // ok to be null or undefined
    })
    taskInfoSchema.virtual('taskGroup').get(function()
    {
        if (this._taskGroup === undefined || this._taskGroup === null)
        {
            return null;
        }
        return this._taskGroup;
    })
    taskInfoSchema.virtual('taskGroup').set(function(newValue)
    {
        Invariants.check(Invariants.Predefined.isDefinedAndNotNull(newValue));
        this._taskGroup = newValue;
    })

    /******************************************
     * Validations
     *****************************************/

    taskInfoSchema.path('_description').validate(
        (value) => { return value !== null && value !== undefined },
        "TaskInfo description validation failed. It can be empty, but must be defined.");
    taskInfoSchema.path('_privacy').validate(function(value)
    {
        let name = TaskPrivacy[value];
        return name !== null && name !== undefined;
    }, "TaskInfo privacy validation failed with value `{VALUE}`")

    /******************************************
     * Plugins
     *****************************************/
    taskInfoSchema.plugin(updatedStatusPlugin);
    taskInfoSchema.plugin(modelInvariantsPluginGenerator(invariants))

    /******************************************
     * Model
     *****************************************/
    export var model = mongoose.model('TaskInfo', taskInfoSchema)

    /******************************************
     * Exported Interfaces
     *****************************************/
    export enum TaskPrivacy { Private, Public };
    export interface Instance extends mongoose.Document
    {
        title: string
        description: string
        privacy: TaskPrivacy
        previousVersion: mongoose.Types.ObjectId | Instance
        taskGroup: mongoose.Types.ObjectId | any
        execPopulate(): mongoose.Promise<Instance>
    }

    /******************************************
     * Invariants
     *****************************************/
    /**
     * Mongoose does not support model level validation. Do that here.
     */
    function invariants(taskInfo): Q.Promise<Invariants.Invariant>
    {
        return Q.fcall(() =>
        {
            return [
            ].reduce(Invariants.chain, Invariants.Predefined.alwaysTrue)
        })
    }
}

export = TaskInfo;
