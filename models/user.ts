import mongoose = require('mongoose');
import Q = require('q');

import Invariants = require("../lib/invariants");
import PromiseAdapter = require("../lib/promise_adapter");
import updatedStatusPlugin = require("./plugins/updated_status");
import modelInvariantsPluginGenerator = require('./plugins/model_invariants');

// NOTE: wrapping into a module prevents the issue of defining a model twice when you include this in two different places
module User
{
    /******************************************
     * Schema
     *****************************************/
    let userSchema = new mongoose.Schema({
        _username: {
            type: String,
            required: true,
            index: {
                unique: true
            }
        },
        _taskGroups: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'TaskGroup',
        }],
        _tasks: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Task',
        }]
    }, {
            autoIndex: process.env.NODE_ENV === 'development',
        })

    /******************************************
     * Getters/Setters
     *****************************************/
    userSchema.virtual('username').get(function(): string
    {
        if (this._username === undefined || this._username === null)
        {
            return ""
        }
        return this._username;
    })

    userSchema.virtual('tasks').get(function()
    {
        if (this._tasks === undefined || this._tasks === null)
        {
            return []
        }
        return this._tasks;
    })
    userSchema.virtual('tasks').set(function(newValue)
    {
        Invariants.check(Invariants.Predefined.isDefinedAndNotNull(newValue));
        this._tasks = newValue;
    })
    userSchema.virtual('taskGroups').get(function()
    {
        if (this._taskGroups === undefined || this._taskGroups === null)
        {
            return [];
        }
        return this._taskGroups;
    })
    userSchema.virtual('taskGroups').set(function(newValue)
    {
        Invariants.check(Invariants.Predefined.isDefinedAndNotNull(newValue));
        this._taskGroups = newValue;
    })

    /******************************************
     * Plugins
     *****************************************/
    userSchema.plugin(updatedStatusPlugin);
    userSchema.plugin(modelInvariantsPluginGenerator(invariants))

    /******************************************
     * Model
     *****************************************/
    export var model = mongoose.model('User', userSchema);

    /******************************************
     * Exported Interfaces
     *****************************************/
    export interface Instance extends mongoose.Document
    {
        username: string
        tasks: Array<mongoose.Types.ObjectId | any>
        taskGroups: Array<mongoose.Types.ObjectId | any>
    }

    function invariants(user: Instance): Q.Promise<Invariants.Invariant>
    {
        return PromiseAdapter.convertMongooseDocumentPopulate(user, "_taskGroups _tasks").then((user) =>
        {
            return PromiseAdapter.convertMongoosePromise(mongoose.model('TaskInfo').populate(user, { path: '_tasks._taskInfo' }))
        }).then((user: any) =>
        {
            return [
                Invariants.Predefined.isNotEmpty(user.username),
                () =>
                {
                    // check if the user's tasks list is consistent with the user's task groups
                    return user.tasks.map((task) =>
                    {
                        let filtered = user.taskGroups.filter((group) =>
                        {
                            return group.id == task.taskInfo.taskGroup // did not populate task group
                        })
                        return filtered.length > 0;
                    }).reduce((x, y) => { return x && y }, true)
                }
            ].reduce(Invariants.chain, Invariants.Predefined.alwaysTrue);
        })
    }
}

export = User;
