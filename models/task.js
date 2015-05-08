var mongoose = require("mongoose");
var Q = require('q');
var updatedStatusPlugin = require("./plugins/updated_status");
var modelInvariantsPluginGenerator = require('./plugins/model_invariants');
var Invariants = require("../lib/invariants");
var Task;
(function (Task) {
    var taskSchema = new mongoose.Schema({
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
    taskSchema.virtual('state').get(function () {
        if (this._state === null || this._state === undefined) {
            return TaskState.Incomplete;
        }
        return this._state;
    });
    taskSchema.virtual('state').set(function (newState) {
        this._state = newState;
    });
    taskSchema.virtual('taskInfo').get(function () {
        if (this._taskInfo === undefined) {
            return null;
        }
        return this._taskInfo;
    });
    taskSchema.virtual('taskInfo').set(function (newValue) {
        this._taskInfo = newValue;
    });
    taskSchema.path('_state').validate(function (value) {
        var stateName = TaskState[value];
        return stateName !== null && stateName !== undefined;
    });
    taskSchema.plugin(updatedStatusPlugin);
    taskSchema.plugin(modelInvariantsPluginGenerator(invariants));
    Task.model = mongoose.model("Task", taskSchema);
    (function (TaskState) {
        TaskState[TaskState["Incomplete"] = 0] = "Incomplete";
        TaskState[TaskState["Complete"] = 1] = "Complete";
    })(Task.TaskState || (Task.TaskState = {}));
    var TaskState = Task.TaskState;
    ;
    function invariants(task) {
        return Q.fcall(function () {
            return [].reduce(Invariants.chain, Invariants.Predefined.alwaysTrue);
        });
    }
})(Task || (Task = {}));
module.exports = Task;
