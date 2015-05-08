var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var authentication = require('./authentication/index');
var api = require('./api/index');
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
if (app.get('env') === 'development') {
    app.use(express.static(path.join(__dirname, '../client')));
    app.use(express.static(path.join(__dirname, '../client/.tmp')));
    app.use(express.static(path.join(__dirname, '../client/app')));
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.send({
            message: err.message,
            error: err
        });
        return;
    });
}
if (app.get('env') === 'production') {
    app.use(express.static(path.join(__dirname, 'public')));
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.send({
            message: err.message,
            error: {}
        });
        return;
    });
}
module.exports = app;
