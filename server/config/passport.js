let passport = require('passport');
let GoogleStrategy = require('passport-google-oauth2').Strategy;
const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL } = require('./constants');


// Strategy 성공시 호출됨.
passport.serializeUser(function (user, done) {
  done(null, user); // 여기의 user가 desiralizeUser의 첫 번째 매개변수로 전달된다.
});

// 사용자가 요청할 때마다 호출된다.
passport.deserializeUser(function (user, done) {
  done(null, user); // 여기의 user가 req.user가 된다.
});

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: GOOGLE_CALLBACK_URL,
      passReqToCallback: true,
      proxy: true,
    },
    function (request, accessToken, refreshToken, profile, done) {
      done(null, profile);
    },
  ),
);

module.exports = passport;
