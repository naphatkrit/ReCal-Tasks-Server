import express = require('express');
import Q = require('q');

import ApiRequest = require('./api_request');
import ApiResponse = require('./api_response');
import PromiseAdapter = require('../../lib/promise_adapter');

import Query = require('../../models/logic/query');

const router = express.Router();

router.route('/')
    .get((req, res) =>
{
    Query.getUser(req.user.id).then((user) =>
    {
        res.json(ApiResponse.createResponse([user]))
    }).fail(() =>
    {
        res.sendStatus(500)
    })
})

export = router;
