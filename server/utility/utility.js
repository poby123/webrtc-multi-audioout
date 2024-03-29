const CryptoJS = require('crypto-js');
const { AES_KEY } = require('../config/constants');

exports.encryptObj = (obj) => {
  let stringify = JSON.stringify(obj);
  return CryptoJS.AES.encrypt(stringify, AES_KEY).toString();
};

exports.decryptObj = (cipher) => {
  let bytes = CryptoJS.AES.decrypt(cipher, AES_KEY);
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
};

exports.checkSignin = (req) => {
  return !!req.user;
};

exports.makeid = (length) => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};
