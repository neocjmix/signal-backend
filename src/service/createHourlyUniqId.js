const shuffleSeed = require('shuffle-seed');

const createHourlyUniqId = (hour, digit) => {
  const hourlyId = ~~(Date.now() / (1000 * 60 * 60 * hour))
  const frontDigit = Math.floor((digit - 1) / 2);
  const backDigit = Math.ceil((digit - 1) / 2);

  const frontSeqBase = new Array(frontDigit).fill(0).join("");
  const backSeqbase = new Array(backDigit).fill(0).join("");

  const frontSequence = new Array(Math.pow(10, frontDigit)).fill()
    .map((_, i) => (frontSeqBase + i).slice(-frontDigit));

  const backSequence = new Array(Math.pow(10, backDigit)).fill()
    .map((_, i) => (backSeqbase + i).slice(-backDigit));

  const shuffledFront = shuffleSeed.shuffle(frontSequence, hourlyId);
  const shuffledBack = shuffleSeed.shuffle(backSequence, hourlyId);
  const combinedSequence = shuffledFront.flatMap(s1 => shuffledBack.map(s2 => s1 + s2));
  return index => combinedSequence[index] + (hourlyId % hour);
};


exports.createHourlyUniqId = createHourlyUniqId