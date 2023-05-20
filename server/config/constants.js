require('dotenv').config()

module.exports = {
    PORT: process.env.PORT || 3000,
    AES_KEY: process.env.AES_KEY || 'secret',
    SESSION_KEY: process.env.SESSION_KEY || 'secret',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || 'test google id',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || 'test google client secret',
}