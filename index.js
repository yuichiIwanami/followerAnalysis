const moment = require('moment');
const Bacon = require('baconjs');
const Twitter = require('twitter');
const config = require('./config');

"use strict";

const client = new Twitter(config.auth);

const oneWeek = moment().subtract(1, 'weeks');
const oneMonth = moment().subtract(1, 'months');
const threeMonths = moment().subtract(3, 'months');
const halfYears = moment().subtract(6, 'months');
const oneYear = moment().subtract(1, 'years');
const threeYears = moment().subtract(3, 'years');

const format = 'ddd MMM DD HH:mm:ss Z YYYY';

const initial = {
    users: 0,
    protectedUsers: 0,
    noTweet: 0,
    oneWeek: 0,
    oneMonth: 0,
    threeMonths: 0,
    halfYears: 0,
    oneYear: 0,
    threeYears: 0,
    moreThan: 0
};

const stream =
    Bacon.fromNodeCallback(client, 'get', 'followers/list', config.params)
    .flatMap((data) => {
        return Bacon.fromArray(data.users);
    })
    .reduce(initial, (prev, data) => {
        prev.users++;
        const lastTweeted = !data || !data.status || moment(data.status.created_at, format);

        switch (true) {
            case data.protected:
                prev.protectedUsers++;
                break;
            case !data.status:
                prev.noTweet++;
                break;
            case lastTweeted.isAfter(oneWeek):
                prev.oneWeek++;
                break;
            case lastTweeted.isAfter(oneMonth):
                prev.oneMonth++;
                break;
            case lastTweeted.isAfter(threeMonths):
                prev.threeMonths++;
                break;
            case lastTweeted.isAfter(halfYears):
                prev.halfYears++;
                break;
            case lastTweeted.isAfter(oneYear):
                prev.oneYear++;
                break;
            case lastTweeted.isAfter(threeYears):
                prev.threeYears++;
                break;
            default:
                prev.moreThan++;
        }
        return prev;
    });
    //.log();
stream.onValue((result) => {
    const display = _display.bind(null, result.users);
    console.log(`
users: ${result.users}

protected: ${display(result.protectedUsers)}
no tweets: ${display(result.noTweet)}
tweeted within
 one week: ${display(result.oneWeek)}
 one month: ${display(result.oneMonth)}
 three months: ${display(result.threeMonths)}
 half years: ${display(result.halfYears)}
 one year: ${display(result.oneYear)}
 three years: ${display(result.threeYears)}
 more than: ${display(result.moreThan)}
`);
});

stream.onEnd((data) => {
});

stream.onError((err) => {
    console.log(err);
});

function _display(users, count) {
    return `${count} / ${(count/users*100).toFixed(1)}%`;
}