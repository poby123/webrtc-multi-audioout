const { SESSION_KEY } = require('./constants');
const { redisClient } = require('./redis-config');
const session = require('express-session');
const redisStore = require('connect-redis')(session);

module.exports = {
  secret: SESSION_KEY,
  resave: false,
  saveUninitialized: false,
  name: 'webrtc-translate-platform',
  cookie: {
    httpOnly: true,
    secure: false,
    maxAge: 7 * 24 * 60 * 60 * 1000
  },
  store: new redisStore({ client: redisClient, logErrors: true })
};
