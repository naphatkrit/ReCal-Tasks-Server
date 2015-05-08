var Q = require('q');
var PromiseAdapter = require("../../lib/promise_adapter");
var PlainObject = require('./plain_object');
var Task = require('../task');
var User = require('../user');
function findOrCreate(model, criteria) {
    return PromiseAdapter.convertMongooseQuery(model.findOne(criteria)).then(function (doc) {
        if (!doc) {
            doc = new model(criteria);
        }
        doc.save();
        return doc;
    }, function (err) {
        var doc = new model(criteria);
        doc.save();
        return doc;
    });
}
exports.findOrCreate = findOrCreate;
function _getUser(userId, options) {
    var query = User.model.findById(userId);
    if (options.populate) {
        query = query.populate(options.populate);
    }
    return PromiseAdapter.convertMongooseQuery(query);
}
function getUser(userId) {
    return _getUser(userId, {}).then(PlainObject.convertUserInstance);
}
exports.getUser = getUser;
function getTasksForUser(userId) {
    return _getUser(userId, {
        populate: '_tasks'
    }).then(function (user) {
        return Q.all(user.tasks.map(PlainObject.convertTaskInstance));
    });
}
exports.getTasksForUser = getTasksForUser;
function getTask(taskId) {
    return PromiseAdapter.convertMongooseQuery(Task.model.findById(taskId)).then(PlainObject.convertTaskInstance);
}
exports.getTask = getTask;
function userHasTask(userId, taskId) {
    return _getUser(userId, {}).then(function (user) {
        return user.tasks.indexOf(taskId) !== -1;
    });
}
exports.userHasTask = userHasTask;
