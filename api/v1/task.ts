import express = require('express');
import Q = require('q');

import ApiRequest = require('./api_request');
import ApiResponse = require('./api_response');
import PromiseAdapter = require('../../lib/promise_adapter');
import PlainObject = require('../../models/logic/plain_object');
import Query = require('../../models/logic/query');
import TaskLogic = require('../../models/logic/task_logic');
import UserLogic = require('../../models/logic/user_logic');

const router = express.Router();

declare class Error
{
    public name: string;
    public message: string;
    public stack: string;
    constructor(message?: string);
}

class HttpError extends Error
{
    constructor(public code: number)
    {
        super("HTTP Error");
        this.name = 'HTTP Error';
        this.stack = (<any>new Error()).stack;
    }
    toString()
    {
        return this.name + ': ' + this.code;
    }
}

router.route('/')
    .get((req: express.Request, res: express.Response) =>
{
    Query.getTasksForUser(req.user.id).done(
        (tasks) =>
        {
            res.json(ApiResponse.createResponse(tasks))
        }, (err) =>
        {
            res.sendStatus(500);
        })
})
    .post((req: express.Request, res: express.Response) =>
{
    if (!ApiRequest.validateApiRequest(req.body))
    {
        // bad request
        res.sendStatus(400);
    }
    const request = <ApiRequest.ApiRequest> req.body;
    const requestObject = ApiRequest.tryGetObject(request);
    if (requestObject === null || requestObject === undefined)
    {
        // not a JSON string
        res.sendStatus(400);
    }
    if (!PlainObject.validateTaskPlainObject(requestObject))
    {
        // not a valid task
        res.sendStatus(400);
    }
    const task = <PlainObject.Interfaces.TaskPlainObject> requestObject;
    TaskLogic.createTask(task).then((task) =>
    {
        // add task to user
        return Query.getUser(req.user.id).then((user) =>
        {
            return UserLogic.addTask(user, task)
        }).then(() =>
        {
            res.json(ApiResponse.createResponse([task]))
        })
    }).fail(() =>
    {
        res.sendStatus(400);
    })
})

router.route('/:task_id')
    .all((req, res, next) =>
{
    // first check if the task belongs to the user
    Query.userHasTask(req.user.id, req.params.task_id).then((has) =>
    {
        if (false && has)
        {
            next()
        } else
        {
            // task does not belong to user.
            res.sendStatus(401)
        }
    }).fail(() =>
    {
        // task ID does not even exist
        res.sendStatus(400)
    })
})
    .get((req: express.Request, res: express.Response) =>
{
    Query.getTask(req.params.task_id).then((task) =>
    {
        res.json(ApiResponse.createResponse([task]))
    }).fail(() =>
    {
        res.sendStatus(400)
    })
})
    .put((req: express.Request, res: express.Response) =>
{
    Q.fcall(() =>
    {
        const request = ApiRequest.castApiRequest(req.body);
        if (!request)
        {
            throw new HttpError(400)
        }
        return request;
    }).then((request) =>
    {
        const requestObject = ApiRequest.tryGetObject(request);
        if (!requestObject)
        {
            throw new HttpError(400)
        }
        return requestObject;
    }).then((requestObject) =>
    {
        const task = PlainObject.castTaskPlainObject(requestObject);
        if (!task)
        {
            throw new HttpError(400)
        }
        return task;
    }).then(TaskLogic.updateTask).then((task) =>
    {
        res.json(ApiResponse.createResponse([task]))
    }).fail((error) =>
    {
        var code = 400;
        if (typeof error.code === 'number')
        {
            code = error.code;
        }
        res.sendStatus(code);
    })
})
    .delete((req: express.Request, res: express.Response) =>
{
    // TODO should we actually delete the task from the database?
    Q.all<any>([
        Query.getUser(req.user.id),
        Query.getTask(req.params.task_id)
    ]).spread<PlainObject.Interfaces.UserPlainObject>((user, task)=>{
        return UserLogic.removeTask(user, task);
    }).then((task)=>{
        res.json(ApiResponse.createResponse([]));
    }).fail(()=>{
        res.sendStatus(400);
    })
})

export = router;
