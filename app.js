require('dotenv').config()
const axios = require('axios');
const groupId = process.env.GROUP_ID
const Slimbot = require('slimbot')
const bot = new Slimbot(process.env.BOT_TOKEN);
const WhiteList = process.env.WHITE_LIST.split(",")
const SteamKey = process.env.STEAM_KEY
const fs = require('fs');

let emoji = {}
if (fs.existsSync("./emoji.json")) {
    let rawdata = fs.readFileSync('./emoji.json'); //{"id":"some_text"}
    emoji = JSON.parse(rawdata);
}
let optionalParams = {
    parse_mode: 'Markdown',
    disable_web_page_preview: true
}


let Statuses = {}

let sendStatus = () => {
    let msg = ""
    for (const [user, data] of Object.entries(Statuses)) {
        if(Object.keys(data)){
            msg += `${emoji[user] || ""} **${data.realName || ""}** [${data.playerName}](https://steamcommunity.com/profiles/${user}) `
            if(data.gameID) {
                msg += `играет в **[${data.gameName}](https://steamcommunity.com/app/${data.gameID})**`
            } else {
                msg += `не играет`
            }
            msg += "\n"
        }
        // console.log(`${user}: ${JSON.stringify(data)}`);
    }
    return msg
}

let steamAlert = (d) => {
    let steamID = d.response.players[0].steamid
    let gameId = d.response.players[0].gameid
    let playerName = d.response.players[0].personaname
    let realName = d.response.players[0].realname
    let gameName = d.response.players[0].gameextrainfo

    Statuses[steamID]["gameID"] = gameId
    Statuses[steamID]["gameName"] = gameName
    let msg = `${emoji[steamID] || ""} **${realName || ""} - [${playerName}](https://steamcommunity.com/profiles/${steamID}) играет в [${gameName}](https://steamcommunity.com/app/${gameId})`
    console.log(msg)
    bot.sendMessage(groupId, msg, optionalParams)
        .then(message => {
            // console.log(message);
        });
}

let steamStopAlert = (d) => {
    let steamID = d.response.players[0].steamid
    let gameId = d.response.players[0].gameid
    let playerName = d.response.players[0].personaname
    let realName = d.response.players[0].realname
    let gameName = Statuses[steamID].gameName

    let msg = `${emoji[steamID] || ""} **${realName || ""} - [${playerName}](https://steamcommunity.com/profiles/${steamID}) перестал играть в [${gameName}](https://steamcommunity.com/app/${gameId})`
    Statuses[steamID]["gameID"] = undefined
    Statuses[steamID]["gameName"] = undefined
    console.log(msg)
    bot.sendMessage(groupId, msg, optionalParams)
        .then(message => {
            // console.log(message);
        });
}

let FriendProcess = () => {
    // let x = friendlist.friendslist.friends
    WhiteList.forEach(f => {
        let url = `http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${SteamKey}&steamids=${f}`

        Get(url, (d) => {
            let steamID = d.response.players[0].steamid
            let playerName = d.response.players[0].personaname
            if (!Statuses.hasOwnProperty(steamID)) {
                Statuses[steamID] = {gameID: undefined}
            }
            Statuses[steamID].playerName = playerName
            Statuses[steamID].realName = d.response.players[0].realname
            if (d.response.players[0].gameextrainfo) {
                let gameID = d.response.players[0].gameid
                // console.log(steamID, playerName, gameID, "\n", d.response.players[0])

                if ((Statuses[steamID].gameID !== gameID)) {
                    steamAlert(d)
                }
                // console.log("\nname:", d.response.players[0].personaname)
                // console.log("steamid:", d.response.players[0].steamid)
                // console.log("game:", d.response.players[0].gameextrainfo)
            } else {
                if ((Statuses[steamID].gameID)) {
                    steamStopAlert(d)
                }
            }
        })
    })
}

let Get = (url, callback) => {
    axios.get(url)
        .then(function (response) {
            // handle success
            callback(response.data)
            // console.log(response.data);
        })
        .catch(function (error) {
            // handle error
            console.log(error);
        })
        .then(function () {
            // always executed
        });
}

bot.on('message', message => {
    switch (message.text) {
        case "/status":
            bot.sendMessage(groupId, sendStatus(), optionalParams)
            break;
        case "/status@gip_e_bot":
            bot.sendMessage(groupId, sendStatus(), optionalParams)
            break;
    }

    // slimbot.sendMessage(message.chat.id, 'Message received');
});

bot.startPolling()

FriendProcess()
setInterval(() => {
    FriendProcess()
    // console.log(Statuses)
}, 5000)

