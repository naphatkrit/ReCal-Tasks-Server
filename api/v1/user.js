var express = require('express');
var ApiResponse = require('./api_response');
var Query = require('../../models/logic/query');
var router = express.Router();
router.route('/')
    .get(function (req, res) {
    Query.getUser(req.user.id).then(function (user) {
        res.json(ApiResponse.createResponse([user]));
    }).fail(function () {
        res.sendStatus(500);
    });
});
module.exports = router;
