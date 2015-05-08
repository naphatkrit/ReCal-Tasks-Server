var mongoose = require('mongoose');
var Q = require('q');
var updatedStatusPlugin = require("./plugins/updated_status");
var modelInvariantsPluginGenerator = require('./plugins/model_invariants');
var Invariants = require("../lib/invariants");
var TaskInfo;
(function (TaskInfo) {
    var taskInfoSchema = new mongoose.Schema({
        _title: {
            type: String,
            required: true
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
    });
    taskInfoSchema.virtual('title').get(function () {
        if (this._title === null || this._title === undefined) {
            return '';
        }
        return this._title;
    });
    taskInfoSchema.virtual('title').set(function (newValue) {
        this._title = newValue;
    });
    taskInfoSchema.virtual('description').get(function () {
        if (this._description === null || this._description === undefined) {
            return '';
        }
        return this._description;
    });
    taskInfoSchema.virtual('description').set(function (newValue) {
        this._description = newValue;
    });
    taskInfoSchema.virtual('privacy').get(function () {
        if (this._privacy === null || this._privacy === undefined) {
            return TaskPrivacy.Private;
        }
        return this._privacy;
    });
    taskInfoSchema.virtual('privacy').set(function (newValue) {
        this._privacy = newValue;
    });
    taskInfoSchema.virtual('previousVersion').get(function () {
        if (this._previousVersion === undefined) {
            return null;
        }
        return this._previousVersion;
    });
    taskInfoSchema.virtual('previousVersion').set(function (newValue) {
        this._previousVersion = newValue;
    });
    taskInfoSchema.virtual('taskGroup').get(function () {
        if (this._taskGroup === undefined || this._taskGroup === null) {
            return null;
        }
        return this._taskGroup;
    });
    taskInfoSchema.virtual('taskGroup').set(function (newValue) {
        Invariants.check(Invariants.Predefined.isDefinedAndNotNull(newValue));
        this._taskGroup = newValue;
    });
    taskInfoSchema.path('_description').validate(function (value) { return value !== null && value !== undefined; }, "TaskInfo description validation failed. It can be empty, but must be defined.");
    taskInfoSchema.path('_privacy').validate(function (value) {
        var name = TaskPrivacy[value];
        return name !== null && name !== undefined;
    }, "TaskInfo privacy validation failed with value `{VALUE}`");
    taskInfoSchema.plugin(updatedStatusPlugin);
    taskInfoSchema.plugin(modelInvariantsPluginGenerator(invariants));
    TaskInfo.model = mongoose.model('TaskInfo', taskInfoSchema);
    (function (TaskPrivacy) {
        TaskPrivacy[TaskPrivacy["Private"] = 0] = "Private";
        TaskPrivacy[TaskPrivacy["Public"] = 1] = "Public";
    })(TaskInfo.TaskPrivacy || (TaskInfo.TaskPrivacy = {}));
    var TaskPrivacy = TaskInfo.TaskPrivacy;
    ;
    function invariants(taskInfo) {
        return Q.fcall(function () {
            return [].reduce(Invariants.chain, Invariants.Predefined.alwaysTrue);
        });
    }
})(TaskInfo || (TaskInfo = {}));
module.exports = TaskInfo;
