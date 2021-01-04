let passport = require('../config/passport');
let express = require('express');
let router = express.Router();

/* GET home page. */

router.get('/', (req, res)=>{
    res.render('signin');
})

router.get('/google', passport.authenticate('google', { scope: ['profile'] }));

router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/' }), (req, res) => {
  //success authentication
  res.redirect('/');
});

router.get('/signout', (req, res) => {
  req.logout();
  res.redirect('/');
});

module.exports = router;
