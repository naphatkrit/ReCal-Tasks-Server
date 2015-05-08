import express = require('express');

import v1 = require('./v1/index');

let router = express.Router();

router.use('/v1', v1);

export = router;
