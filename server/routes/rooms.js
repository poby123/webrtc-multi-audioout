var express = require('express');
var router = express.Router();

function checkSignin(req, res, next){
  if(req.user){
    next();
  }else{
    res.redirect('/auth/google');
  }
}

/* GET home page. */
router.get('/create', checkSignin, (req, res)=>{
  res.render('index');
})

module.exports = router;
