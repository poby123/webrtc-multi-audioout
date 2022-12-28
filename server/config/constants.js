require('dotenv').config()

module.exports = {
    PORT: process.env.PORT,
    AES_KEY: process.env.AES_KEY,
    SESSION_KEY: process.env.SESSION_KEY,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
}