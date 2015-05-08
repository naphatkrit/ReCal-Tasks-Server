import express = require('express');
import path = require('path');
import favicon = require('serve-favicon');
import logger = require('morgan');
import cookieParser = require('cookie-parser');
import bodyParser = require('body-parser');
import session = require('express-session');

import authentication = require('./authentication/index');
import api = require('./api/index');

var app = express();

app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(session({
    secret: "ReCal Secret"
}));
app.use(authentication.initialize());
app.use(authentication.session());
app.use(cookieParser());

app.use('/login', authentication.loginPage());
app.use('/logout', authentication.logoutPage());
app.use('/api', authentication.ensureAuthenticated, api);

app.use('/', authentication.ensureAuthenticatedRedirect);

if (app.get('env') === 'development')
{
    app.use(express.static(path.join(__dirname, '../client')));
    app.use(express.static(path.join(__dirname, '../client/.tmp')));
    app.use(express.static(path.join(__dirname, '../client/app')));

    // development error handler
    // will print stacktrace
    app.use(<(express.ErrorRequestHandler) > function(err, req, res, next)
    {
        res.status(err.status || 500);
        res.send({
            message: err.message,
            error: err
        });

        return;
    });
}

if (app.get('env') === 'production')
{
    // use optimized version for production
    app.use(express.static(path.join(__dirname, 'public')));

    // production error handler
    // no stacktraces leaked to user
    app.use(<(express.ErrorRequestHandler) > function(err, req, res, next)
    {
        res.status(err.status || 500);
        res.send({
            message: err.message,
            error: {}
        });

        return;
    });
}

export = app;
