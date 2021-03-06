const CryptoJS = require('crypto-js');
const Constants = require('../config/constants');

exports.encryptObj = (obj) => {
  let stringify = JSON.stringify(obj);
  return CryptoJS.AES.encrypt(stringify, Constants.STATUS_KEY).toString();
};

exports.decryptObj = (cipher) => {
  let bytes = CryptoJS.AES.decrypt(cipher, Constants.STATUS_KEY);
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
};

exports.checkSignin = (req) => {
  return !!req.user;
};

exports.makeid = (length) => {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};
