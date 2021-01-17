var express = require('express');
var router = express.Router();

function checkSignin(req) {
  return !!req.user;
}

function makeid(length) {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

/* GET home page. */
router.get('/', function (req, res) {
  const type = req.query.type;
  const roomId = req.query.id;

  if (type == 'join' && roomId) {
    if (checkSignin(req)) {
      res.render('rtc', { username: req.user.displayName, userid: req.user.id, profile: req.user.photos[0].value });
    } else {
      res.redirect('/');
    }
  } else if (type == 'create') {
    if (checkSignin(req)) {
      const roomId = makeid(7);
      res.redirect(`/?type=join&id=${roomId}`);
    } else {
      res.redirect('/');
    }
  } else {
    const profile = req.user;
    res.render('index', { title: 'Translate Platform', user: profile });
  }
});

module.exports = router;
