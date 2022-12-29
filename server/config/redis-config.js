const redis = require('redis');
const redisClient = redis.createClient({
    legacyMode: true
});
redisClient.connect().catch(console.error);

module.exports = { redis, redisClient };