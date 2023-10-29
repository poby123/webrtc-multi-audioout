const createError = require('http-errors');
const fs = require('fs');
const http = require('http');
const https = require('https');
const express = require('express');
const path = require('path');
var cors = require('cors');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const passport = require('passport');
const session = require('express-session');
const { Server } = require('socket.io');
require('ejs');

const session_config = require('./server/config/session-config');
const socketController = require('./server/controllers/socketController');

// app, server
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:4000',
  },
});

socketController(io);

// routers
const indexRouter = require('./server/routes/index');
const authRouter = require('./server/routes/auth');

// session
app.use(session(session_config));
app.use(passport.initialize());
app.use(passport.session());

// view engine setup
app.set('views', path.join(__dirname, '/server/views'));
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
app.use(express.static(path.join(__dirname, '../client/build/')));
app.use(express.static(path.join(__dirname, 'public')));

app.use(
  logger('combined', {
    skip: function (req, res) {
      return res.statusCode < 400;
    },
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

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
