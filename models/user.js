var mongoose = require('mongoose');
var Invariants = require("../lib/invariants");
var PromiseAdapter = require("../lib/promise_adapter");
var updatedStatusPlugin = require("./plugins/updated_status");
var modelInvariantsPluginGenerator = require('./plugins/model_invariants');
var User;
(function (User) {
    var userSchema = new mongoose.Schema({
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
    });
    userSchema.virtual('username').get(function () {
        if (this._username === undefined || this._username === null) {
            return "";
        }
        return this._username;
    });
    userSchema.virtual('tasks').get(function () {
        if (this._tasks === undefined || this._tasks === null) {
            return [];
        }
        return this._tasks;
    });
    userSchema.virtual('tasks').set(function (newValue) {
        Invariants.check(Invariants.Predefined.isDefinedAndNotNull(newValue));
        this._tasks = newValue;
    });
    userSchema.virtual('taskGroups').get(function () {
        if (this._taskGroups === undefined || this._taskGroups === null) {
            return [];
        }
        return this._taskGroups;
    });
    userSchema.virtual('taskGroups').set(function (newValue) {
        Invariants.check(Invariants.Predefined.isDefinedAndNotNull(newValue));
        this._taskGroups = newValue;
    });
    userSchema.plugin(updatedStatusPlugin);
    userSchema.plugin(modelInvariantsPluginGenerator(invariants));
    User.model = mongoose.model('User', userSchema);
    function invariants(user) {
        return PromiseAdapter.convertMongooseDocumentPopulate(user, "_taskGroups _tasks").then(function (user) {
            return PromiseAdapter.convertMongoosePromise(mongoose.model('TaskInfo').populate(user, { path: '_tasks._taskInfo' }));
        }).then(function (user) {
            return [
                Invariants.Predefined.isNotEmpty(user.username),
                function () {
                    return user.tasks.map(function (task) {
                        var filtered = user.taskGroups.filter(function (group) {
                            return group.id == task.taskInfo.taskGroup;
                        });
                        return filtered.length > 0;
                    }).reduce(function (x, y) { return x && y; }, true);
                }
            ].reduce(Invariants.chain, Invariants.Predefined.alwaysTrue);
        });
    }
})(User || (User = {}));
module.exports = User;
