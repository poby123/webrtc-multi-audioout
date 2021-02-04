let express = require('express');
let router = express.Router();

const utility = require('../utility/utility');
const encryptObj = utility.encryptObj;
const makeid = utility.makeid;
const checkSignin = utility.checkSignin;

/* GET home page. */
router.get('/', function (req, res) {
  const type = req.query.type;
  const roomId = req.query.id;

  if (type == 'join' && roomId) {
    let status = { host: false, joined: false };
    status = encryptObj(status);

    if (checkSignin(req)) {
      const user = req.user;
      res.render('rtc', {
        username: user.displayName,
        userid: user.id,
        profile: user.photos[0].value,
        sessionId: new Date().getTime().toString() + makeid(10),
        status: status,
      });
    } else {
      res.render('rtc', {
        username: '',
        userid: '',
        profile: '',
        sessionId: new Date().getTime().toString() + makeid(10),
        status: status,
      });
    }
  } else if (type == 'create') {
    if (checkSignin(req)) {
      const roomId = makeid(11);
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
