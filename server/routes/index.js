var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res) {
  const profile = req.user;
  // if (profile) {
  //   console.log('user : ', profile.displayName);
  //   console.log('photos : ', profile.photos[0].value);
  // }
  res.render('index', { user: profile });
});

module.exports = router;
