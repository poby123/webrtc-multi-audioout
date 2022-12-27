var createError = require('http-errors');
const fs = require('fs');
const http = require('http');
const https = require('https');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var passport = require('passport');
var session = require('express-session');

var session_config = require('./server/config/session');
let socketController = require('./server/controllers/socketController');

// https server options
const options = {
  key: fs.readFileSync(path.join(__dirname, 'ssl', 'key.pem'), 'utf-8'),
  cert: fs.readFileSync(path.join(__dirname, 'ssl', 'cert.pem'), 'utf-8'),
}; 

// app, server
let app = express();
// let server = http.createServer(app);
let server = https.createServer(options, app);
let io = require('socket.io')(server);

socketController(io);

// routers
var indexRouter = require('./server/routes/index');
var authRouter = require('./server/routes/auth');

// session
app.use(session(session_config));
app.use(passport.initialize());
app.use(passport.session());

// view engine setup
app.set('views', path.join(__dirname, '/server/views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/auth', authRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


exports.app = app;
exports.server = server;