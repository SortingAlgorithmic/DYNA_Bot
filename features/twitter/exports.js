module.exports = {
    add: async function(msg,TWIT,TWEETERS,fs,udir,fetch) {
        let xUser = msg.content.toString().toLowerCase().split(' add ')[1].replace('@','');
        let xChannel;
        if (xChannel==undefined) {xChannel=msg.channel.id.toString();}
        if (!TWEETERS.list.includes(xUser)) {
            fetch(`https://api.twitter.com/2/users/by?usernames=${xUser}&user.fields=profile_image_url,username,name,id,url,verified,description,public_metrics`, {
                method: 'get',
                headers: { 'Authorization': `Bearer ${TWIT}` }}).then( async(res) => {
                    let body = await res.json();
                    let tweeter = {
                        username: body.data[0].username,
                        id: body.data[0].id,
                        name: body.data[0].name,
                        profile_image_url: body.data[0].profile_image_url,
                        verified: body.data[0].verified,
                        url: body.data[0].url,
                        channel: xChannel,
                        last_tweet: undefined
                    };
                    TWEETERS.data.push(tweeter);
                    TWEETERS.list.push(tweeter.username.toString().toLowerCase());
                    fs.writeFileSync(udir, JSON.stringify(TWEETERS).replace(/\\"/g, '"'));
                    let ver;
                    if (tweeter.verified==true) {ver='☑️';} else {ver='';};
                    msg.channel.send({embed: {
                        color: '#ACFCD9',
                        title: `${tweeter.name} (@${tweeter.username})${ver}`,
                        url: `https://twitter.com/${tweeter.username}`,
                        description: body.data[0].description,
                        thumbnail: {
                            url: tweeter.profile_image_url
                        },
                        footer: {
                            text: 'Twitter',
                            icon_url: 'https://abs.twimg.com/icons/apple-touch-icon-192x192.png'
                        },
                        fields: [
                            { name: 'Followers', value: body.data[0].public_metrics.followers_count, inline: true },
                            { name: 'Tweets', value: body.data[0].public_metrics.tweet_count, inline: true },
                            { name: '\u200b', value: `@${tweeter.username} has been added - Their tweets will appear in: \`\`\`${msg.channel.name}\`\`\``, inline: false }
                        ]
                    }});
            });
        }
    },
    remove: async function(msg,TWEETERS,fs,udir) {
        let xUser = msg.content.toString().toLowerCase().split(' remove ')[1].replace('@','');
        let xChannel;
        if (xChannel==undefined) {xChannel=msg.channel.id.toString();}
        if (TWEETERS.list.includes(xUser)) {
            var i = 0;
            TWEETERS.data.forEach( twtr => {
                if (twtr.username.toString().toLowerCase() == xUser) {
                    let ver;
                    if (twtr.verified==true) {ver='☑️';} else {ver='';};
                    msg.channel.send({embed: {
                        color: '#665687',
                        title: `${twtr.name} (@${twtr.username})${ver}`,
                        url: `https://twitter.com/${twtr.username}`,
                        thumbnail: {
                            url: twtr.profile_image_url
                        },
                        footer: {
                            text: 'Twitter',
                            icon_url: 'https://abs.twimg.com/icons/apple-touch-icon-192x192.png'
                        },
                        fields: [ { name: '\u200b', value: `@${xUser} has been removed - Their tweets will no longer be tracked.`, inline: false } ]
                    }});
                    TWEETERS.data.splice(i, 1);
                    TWEETERS.list.splice(i, 1);
                    fs.writeFileSync(udir, JSON.stringify(TWEETERS).replace(/\\"/g, '"'));
                    return;
                }
                i += 1;
            });
        }
    },
    list: async function(msg,TWEETERS,fs,udir) {
        TWEETERS.data.forEach( twtr => {
            let ver;
            if (twtr.verified==true) {ver='☑️';} else {ver='';};
            msg.channel.send({embed: {
                color: '#B084CC',
                title: `${twtr.name} (@${twtr.username})${ver}`,
                url: `https://twitter.com/${twtr.username}`,
                thumbnail: {
                    url: twtr.profile_image_url
                },
                footer: {
                    text: 'Twitter',
                    icon_url: 'https://abs.twimg.com/icons/apple-touch-icon-192x192.png'
                }
            }});
        });
    },
    refresh: async function(bot,TWIT,TWEETERS,moment,fs,udir,fetch,WEEKLY_EARNINGS) {
        TWEETERS.data.forEach( twtr => {
            let ky, vl;
            if (twtr.last_tweet==undefined) {
                ky = 'start_time';
                vl = String(moment.utc(moment().subtract('1','minutes').milliseconds(0).format()).format());
            } else {
                ky = 'since_id';
                vl = twtr.last_tweet;
            }
            let urlParams = `?expansions=attachments.media_keys,author_id,entities.mentions.username,in_reply_to_user_id,referenced_tweets.id,referenced_tweets.id.author_id&query=-is:retweet from:${twtr.username}&tweet.fields=attachments,author_id,conversation_id,created_at,entities,id,in_reply_to_user_id,public_metrics,referenced_tweets,source,text&media.fields=media_key,preview_image_url,type,url,public_metrics&user.fields=created_at,description,entities,id,location,name,pinned_tweet_id,profile_image_url,protected,public_metrics,url,username,verified&${ky}=${vl}`;
            fetch(`https://api.twitter.com/2/tweets/search/recent${urlParams}`,{
                method: 'get',
                headers: { 'Authorization': `Bearer ${TWIT}` } } ).then( async(res) => {
                    let body = await res.json();
                    let lastId;
                    if (body.meta.result_count == 0) {return;}
                    body.data.forEach( twt => {
                        if (twtr.username.toLowerCase() == 'ewhispers' && twt.text.includes('#earnings for the week')) {
                            bot.channels.cache.get(WEEKLY_EARNINGS).send(`https://twitter.com/${twtr.username}/status/${twt.id}\n${twt.created_at}`);
                        } else {
                            bot.channels.cache.get(twtr.channel).send(`https://twitter.com/${twtr.username}/status/${twt.id}\n${twt.created_at}`);
                        }
                        lastId = twt.id;
                    });
                    if (lastId !== undefined) {
                        twtr.last_tweet = lastId;
                        fs.writeFileSync(udir, JSON.stringify(TWEETERS).replace(/\\"/g, '"'));
                    }
            });
        });
    }
}