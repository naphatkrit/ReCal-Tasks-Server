var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var express = require('express');
var Q = require('q');
var ApiRequest = require('./api_request');
var ApiResponse = require('./api_response');
var PlainObject = require('../../models/logic/plain_object');
var Query = require('../../models/logic/query');
var TaskLogic = require('../../models/logic/task_logic');
var UserLogic = require('../../models/logic/user_logic');
var router = express.Router();
var HttpError = (function (_super) {
    __extends(HttpError, _super);
    function HttpError(code) {
        _super.call(this, "HTTP Error");
        this.code = code;
        this.name = 'HTTP Error';
        this.stack = (new Error()).stack;
    }
    HttpError.prototype.toString = function () {
        return this.name + ': ' + this.code;
    };
    return HttpError;
})(Error);
router.route('/')
    .get(function (req, res) {
    Query.getTasksForUser(req.user.id).done(function (tasks) {
        res.json(ApiResponse.createResponse(tasks));
    }, function (err) {
        res.sendStatus(500);
    });
})
    .post(function (req, res) {
    if (!ApiRequest.validateApiRequest(req.body)) {
        res.sendStatus(400);
    }
    var request = req.body;
    var requestObject = ApiRequest.tryGetObject(request);
    if (requestObject === null || requestObject === undefined) {
        res.sendStatus(400);
    }
    if (!PlainObject.validateTaskPlainObject(requestObject)) {
        res.sendStatus(400);
    }
    var task = requestObject;
    TaskLogic.createTask(task).then(function (task) {
        return Query.getUser(req.user.id).then(function (user) {
            return UserLogic.addTask(user, task);
        }).then(function () {
            res.json(ApiResponse.createResponse([task]));
        });
    }).fail(function () {
        res.sendStatus(400);
    });
});
router.route('/:task_id')
    .all(function (req, res, next) {
    Query.userHasTask(req.user.id, req.params.task_id).then(function (has) {
        if (false && has) {
            next();
        }
        else {
            res.sendStatus(401);
        }
    }).fail(function () {
        res.sendStatus(400);
    });
})
    .get(function (req, res) {
    Query.getTask(req.params.task_id).then(function (task) {
        res.json(ApiResponse.createResponse([task]));
    }).fail(function () {
        res.sendStatus(400);
    });
})
    .put(function (req, res) {
    Q.fcall(function () {
        var request = ApiRequest.castApiRequest(req.body);
        if (!request) {
            throw new HttpError(400);
        }
        return request;
    }).then(function (request) {
        var requestObject = ApiRequest.tryGetObject(request);
        if (!requestObject) {
            throw new HttpError(400);
        }
        return requestObject;
    }).then(function (requestObject) {
        var task = PlainObject.castTaskPlainObject(requestObject);
        if (!task) {
            throw new HttpError(400);
        }
        return task;
    }).then(TaskLogic.updateTask).then(function (task) {
        res.json(ApiResponse.createResponse([task]));
    }).fail(function (error) {
        var code = 400;
        if (typeof error.code === 'number') {
            code = error.code;
        }
        res.sendStatus(code);
    });
})
    .delete(function (req, res) {
    Q.all([
        Query.getUser(req.user.id),
        Query.getTask(req.params.task_id)
    ]).spread(function (user, task) {
        return UserLogic.removeTask(user, task);
    }).then(function (task) {
        res.json(ApiResponse.createResponse([]));
    }).fail(function () {
        res.sendStatus(400);
    });
});
module.exports = router;
