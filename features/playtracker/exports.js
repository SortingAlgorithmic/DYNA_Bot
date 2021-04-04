module.exports = {
    initPlay: async function(msg,PLAYS,fs,pdir) {
        let xRegex = msg.content.toString().match(/^(\w+)\s(\d+)\s(\w+)\s(?:[exp]+)\s(\d+\/+\d+\/?\d*)\s(?:[avg]+)\s(\d+\.?\d*)/i);
        let playCapture = {
            state: 'open',
            creator: msg.author.id,
            created: (new Date().toISOString()),
            play_msg: '', 
            play: {
                ticker: xRegex[1].toString().toUpperCase(),
                qty: xRegex[2],
                capu: xRegex[3].toString().toUpperCase(),
                exp: xRegex[4],
                avg: xRegex[5]
            },
            following: []
        };
        let playMsg = {
            color: '#5DD9C1',
            author: {
                name: 'DYNA - Playtrack',
                icon_url: 'https://cdn.discordapp.com/avatars/826613778195415070/3f2853d9c4c7e8a8b42dee7eec0b4c32.webp?size=128'
            },
            footer: {
                text: 'React ✅ below to recieve a notification when this play closes.'
            },
            fields: [
                { name: '\u200b', value: `<@${playCapture.creator}> added a play! (${playCapture.play.capu}/${playCapture.play.ticker})` },
                { name: 'Added by', value: `<@${playCapture.creator}>`, inline: true },
                { name: 'Ticker', value: `${'```'}${playCapture.play.ticker}${'```'}`, inline: true },
                { name: 'Quantity', value: `${'```'}${playCapture.play.qty}${'```'}`, inline: true },
                { name: 'Average', value: `${'```'}${playCapture.play.avg}${'```'}`, inline: true },
                { name: 'Expires', value: `${'```'}${playCapture.play.exp}${'```'}`, inline: true }
            ]
        };
        msg.channel.send({embed: playMsg}).then( async(sentMsg) => {
            playCapture.play_msg = sentMsg.id.toString();
            PLAYS.push(playCapture);
            fs.writeFileSync(pdir, JSON.stringify(PLAYS).replace(/\\"/g, '"'));
        });
        msg.delete();
    },
    followPlay: async function(react,usr,PLAYS,fs,pdir) {
        PLAYS.forEach( ply => {
            if (ply.state == 'open' && react.message.id == ply.play_msg) {
                if (!ply.following.includes(usr.id.toString())) {
                    ply.following.push(usr.id.toString());
                    fs.writeFileSync(pdir, JSON.stringify(PLAYS).replace(/\\"/g, '"'));
                    return;
                }
            }
        });
    },
    closePlay: async function(react,user,bot,PLAYS,fs,pdir) {
        var i = 0;
        PLAYS.forEach( ply => {
            if (ply.state == 'open' && react.message.id == ply.play_msg && user.id == ply.creator) {
                let playMsg = { color: '#190933',
                    author: { name: 'DYNA - Playtrack', icon_url: 'https://cdn.discordapp.com/avatars/826613778195415070/3f2853d9c4c7e8a8b42dee7eec0b4c32.webp?size=128' },
                    footer: { text: 'This play has been closed.' },
                    fields: [
                        { name: '\u200b', value: `<@${ply.creator}> closed this play! (${ply.play.capu}/${ply.play.ticker})` },
                        { name: 'Closed by', value: `<@${ply.creator}>`, inline: true },
                        { name: 'Ticker', value: `${'```'}${ply.play.ticker}${'```'}`, inline: true },
                        { name: 'Quantity', value: `${'```'}${ply.play.qty}${'```'}`, inline: true },
                        { name: 'Average', value: `${'```'}${ply.play.avg}${'```'}`, inline: true },
                        { name: 'Expires', value: `${'```'}${ply.play.exp}${'```'}`, inline: true }
                    ]
                };
                ply.following.forEach(usr => bot.users.cache.get(usr).send({embed: playMsg}));
                react.message.channel.send({embed: playMsg});
                react.message.channel.messages.fetch(ply.play_msg).then(mesg => mesg.delete());
                PLAYS.splice(i, 1);
                fs.writeFileSync(pdir, JSON.stringify(PLAYS).replace(/\\"/g, '"'));
                return;
            }
            i += 1;
        });
    }
}