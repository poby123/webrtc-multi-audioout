module.exports = {
  secret: process.env.SESSION_KEY,
  // secret: 'session secrets',
  resave: false,
  saveUninitialized: false,
};
