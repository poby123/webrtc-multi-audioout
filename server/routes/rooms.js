var express = require('express');
var router = express.Router();

function checkSignin(req, res, next) {
  if (req.user) {
    next();
  } else {
    res.redirect('/');
  }
}

/* GET home page. */
router.get('/create', checkSignin, (req, res) => {

});

module.exports = router;
