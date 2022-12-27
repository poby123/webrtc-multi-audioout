let passport = require('../config/passport');
let express = require('express');
let router = express.Router();

/* GET home page. */

router.get('/google', passport.authenticate('google', { scope: ['profile'] }));

router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/' }), (req, res) => {
  //success authentication
  res.redirect('/');
});

router.get('/signout', (req, res) => {
  req.logout((err) => {
    if(err){
      console.log('[EEROR] /signout: ', err);
    }
    res.redirect('/');
  });
});

module.exports = router;
