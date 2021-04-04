require('dotenv').config();
const cheerio = require('cheerio');
const fetch = require('node-fetch');
const fs = require('fs');
const Discord = require('discord.js');
const moment = require('moment');
const FEATURES = {
    PLAYTRACKER: require('./features/playtracker/exports.js'),
    TWITTER: require('./features/twitter/exports.js')
};
const bot = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });
const DISCORD_BOT_TOKEN=process.env.DISCORD_BOT_TOKEN;
const TWIT=process.env.TWITTER_BEARER_TOKEN;
const WEEKLY_EARNINGS=process.env.WEEKLY_EARNINGS;
var PLAYS = require('./features/playtracker/plays.json');
var TWEETERS = require('./features/twitter/users.json');

bot.login(DISCORD_BOT_TOKEN);

bot.on('ready', async() => {
    console.info(` * Logged in as ${bot.user.tag}!`);
});

bot.on('message', async (msg) => {
    if (msg.author.id == bot.user.id) {
        for (var i=0;i<msg.embeds.length;i++) {
            if (!msg.embeds[i].footer.text.includes('Twitter')) {
                if (msg.embeds[i].fields[0].value.includes(' added a play!')) {
                    msg.react('✅');
                }
            }
        }
    }
    if (msg.content === 'ping') { msg.reply('pong'); return; }
    let b = msg.content.toString().toLowerCase().replace('  ',' ').replace('  ',' ');
    if ((b.includes(' call ')||b.includes(' put ')) && b.includes (' exp ') && b.includes(' avg ')) {
        await FEATURES.PLAYTRACKER.initPlay(msg,PLAYS,fs,`${__dirname}/features/playtracker/plays.json`);
    } else if (/^\!news\s/i.test(msg.content.toString())) {
        if (/^\!news\sadd\s/i.test(msg.content.toString())) {
            await FEATURES.TWITTER.add(msg,TWIT,TWEETERS,fs,`${__dirname}/features/twitter/users.json`,fetch);
        } else if (/^\!news\sremove\s/i.test(msg.content.toString())) {
            await FEATURES.TWITTER.remove(msg,TWEETERS,fs,`${__dirname}/features/twitter/users.json`);
        } else if (/^\!news\slist\s/i.test(msg.content.toString())) {
            await FEATURES.TWITTER.list(msg,TWEETERS,fs,`${__dirname}/features/twitter/users.json`);
        }
    }
});

bot.on('messageReactionAdd', async (react, usr) => {
    if (usr.id==bot.user.id) { return; }
    if (react.partial) { try { await react.fetch(); } catch { console.error; return; } }
    switch (react._emoji.name) {
        case '❌':
            await FEATURES.PLAYTRACKER.closePlay(react,usr,bot,PLAYS,fs,`${__dirname}/features/playtracker/plays.json`);
        case '✅':
            await FEATURES.PLAYTRACKER.followPlay(react,usr,PLAYS,fs,`${__dirname}/features/playtracker/plays.json`);
    }
});

async function refreshTweets() {
    await FEATURES.TWITTER.refresh(bot,TWIT,TWEETERS,moment,fs,`${__dirname}/features/twitter/users.json`,fetch,WEEKLY_EARNINGS);
}
setInterval(refreshTweets,6400);