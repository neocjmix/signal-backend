const redis = require('redis')
const shuffleSeed = require('shuffle-seed');

const DIGIT = 6;

const REDIS_ENDPOINT = process.env.AWS_SAM_LOCAL
  ? "//docker.for.mac.host.internal:6379"
  : "//signal-redis-micro.0rf8zm.0001.apn2.cache.amazonaws.com:6379";

const redisClient = redis.createClient(REDIS_ENDPOINT);

const createHourlyUniqId = (hour, digit) => {
  const hourlyId = ~~(Date.now() / (1000 * 60 * 60 * hour))
  const frontDigit = Math.floor((digit - 1) / 2);
  const backDigit = Math.ceil((digit - 1) / 2);

  const frontSequence = new Array(Math.pow(10, frontDigit)).fill()
    .map((_, i) =>
      (new Array(frontDigit).fill(0).join("") + i).slice(-frontDigit));

  const backSequence = new Array(Math.pow(10, backDigit)).fill()
    .map((_, i) =>
      (new Array(backDigit).fill(0).join("") + i).slice(-backDigit));

  const shuffle1 = shuffleSeed.shuffle(frontSequence, hourlyId);
  const shuffle2 = shuffleSeed.shuffle(backSequence, hourlyId);
  const shuffledSequence = shuffle1.flatMap(s1 => shuffle2.map(s2 => s2 + s1));
  return index => shuffledSequence[index] + (hourlyId % 10);
};

exports.save = room => new Promise((resolve, reject) =>
  redisClient.watch("signal:room:next-index", watchError => {
    if (watchError) reject(watchError);

    redisClient.get("signal:room:next-index", (getError, nextIndex) => {
      if (getError) throw getError;
      const nextIdxNum = nextIndex == null ? 0 : +nextIndex;
      const uniqId = createHourlyUniqId(10, DIGIT)(nextIdxNum);

      redisClient
        .multi()
        .set(`signal:room:${uniqId}`, JSON.stringify(room), 'EX', 60 * 10)
        .set("signal:room:next-index", (nextIdxNum + 1) % Math.pow(10, DIGIT - 1))
        .exec((execError, results) => {
          if (execError || results === null) reject(execError);
          resolve(uniqId)
        });
    });
  })
);

exports.get = roomId => new Promise((resolve, reject) =>
  redisClient.get(`signal:room:${roomId}`, (err, value) => err
    ? reject(err)
    : resolve(value)))