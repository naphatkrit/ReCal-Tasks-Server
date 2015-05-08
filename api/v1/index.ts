import express = require('express');

import taskRouter = require('./task');
import userRouter = require('./user');

let router = express.Router();

router.use('/task', taskRouter);
router.use('/user', userRouter);

export = router;
