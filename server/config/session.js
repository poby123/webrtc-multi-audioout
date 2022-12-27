const { SESSION_KEY } = require('./constants');

module.exports = {
  secret: SESSION_KEY,
  resave: false,
  saveUninitialized: false,
};
