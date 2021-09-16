const CronJob = require('cron').CronJob;
const {handler} = require('./index');
let isRunning = false;

const job = new CronJob('* * * * *', () => {
  if (isRunning) {
    return console.log('Won\'t run, there is still a process around \n\n');
  }

  isRunning = true;
  handler(null, {}, (err, result) => {
    isRunning = false;
    if (err) {
      return console.error('Something happened', err);
    }

    console.log('9 cron.js > result === ', result);
  })
}, null, true, 'America/Bogota');

job.start();

console.log('starting as cronjob!');