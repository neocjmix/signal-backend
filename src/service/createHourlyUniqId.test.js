const {expect} = require('chai')
const {createHourlyUniqId} = require('./createHourlyUniqId');

describe('createHourlyUniqId', () => {
  it('generates distinct (N-1)-digit numbers excluding last number', () => {
    const hourlyUniqId = createHourlyUniqId(10,6);
    const counts = new Array(100000).fill(0);
    counts.forEach((_,i) => {
      counts[parseInt(hourlyUniqId(i).slice(0, -1), 10)]++;
    })
    expect(counts.every(count => count === 1)).to.be.true
  });
})