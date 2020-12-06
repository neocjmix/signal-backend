const redis = require('redis')
const {createHourlyUniqId} = require('./createHourlyUniqId')

const DIGIT = 6;

const REDIS_ENDPOINT = process.env.AWS_SAM_LOCAL
  ? "//docker.for.mac.host.internal:6379"
  : "//signal-redis-micro.0rf8zm.0001.apn2.cache.amazonaws.com:6379";

const redisClient = redis.createClient(REDIS_ENDPOINT);


const doSave = ({roomId, ...roomInfo}, expire) =>
  redisClient
    .multi()
    .set(`signal:room:${roomId}`, JSON.stringify(roomInfo), 'EX', expire);

exports.save = room => new Promise((resolve, reject) => {
  if (room.roomId) {
    return doSave(room, 60 * 10).exec((execError, results) => {
      if (execError || results === null) reject(execError);
      resolve(room.roomId)
    });
  }

  redisClient.watch("signal:room:next-index", watchError => {
    if (watchError) reject(watchError);

    redisClient.get("signal:room:next-index", (getError, nextIndex) => {
      if (getError) throw getError;
      const nextIdxNum = nextIndex == null ? 0 : +nextIndex;
      const uniqId = createHourlyUniqId(10, DIGIT)(nextIdxNum);

      doSave({...room, roomId: uniqId}, 60 * 10)
        .set("signal:room:next-index", (nextIdxNum + 1) % Math.pow(10, DIGIT - 1))
        .exec((execError, results) => {
          if (execError || results === null) reject(execError);
          resolve(uniqId)
        });
    });
  });
});

exports.get = roomId => new Promise((resolve, reject) =>
  redisClient.get(`signal:room:${roomId}`, (err, value) => err
    ? reject(err)
    : resolve(value)))
