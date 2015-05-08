var express = require('express');
var taskRouter = require('./task');
var userRouter = require('./user');
var router = express.Router();
router.use('/task', taskRouter);
router.use('/user', userRouter);
module.exports = router;
