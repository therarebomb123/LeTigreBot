console.clear();

const Discord = require("discord.js");
const roblox = require('noblox.js')
const TrelloModule = require('trello')
const Config = require("./config/Config.json");
const sConfig = require("./config/sConfig.json");
const fs = require("fs");
const dateFormat = require('dateformat');
const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest
const Token = sConfig.token;

const Trello = new TrelloModule(sConfig.trelloApplicationKey,sConfig.trelloUserToken)
const bot = new Discord.Client();

bot.on("ready", () => {
    console.log(bot.user.tag + " logged on successfully.")
});

var updateRoles = (member,rank,role) => {

}

var reports = {}
var blacklist = []

bot.on('guildMemberAdd',async (member) => {
    var guild = bot.guilds.get('524452811988140032')
    if (member.guild == guild) {
        await member.addRole(guild.roles.find('name',member.id))
        if (reports[member.id]) {
            var channel = guild.channels.get(reports[member.id])
            setTimeout(function() {
                channel.send(`<@${member.id}> This is your private channel.  Only you and the executives can read this.  Anything you'd like to inform Le Tigre executives please post here.  Pictures and/or video are welcome.  <@&524453329204543488>`)
            },2000)
        }
    }
})

bot.on('guildMemberRemove',async (member) => {
    var guild = bot.guilds.get('524452811988140032')
    if (member.guild == guild) {
        await guild.roles.find('name',member.id).delete()
        var channel = guild.channels.get(reports[member.id])
        await channel.setParent('525108271149875220')
        await channel.setName('lt-' + channel.name)
        await channel.send("--Discussion end--")
        reports[member.id] = undefined
    }
})

bot.on("voiceStateUpdate", (oldMem, newMem) => {
    if (newMem.user.bot) return 
    let newChan = newMem.voiceChannel
    let oldChan = oldMem.voiceChannel

    /*if (!newMem.manageable) { console.log("Higher role"); return 0; }*/
    if (oldChan === undefined && newChan !== undefined) { 
        newMem.addRole(Config.inVCRole, "User joined a voice channel.")
    } else if(newChan === undefined) {
        newMem.removeRole(Config.inVCRole, "User left a voice channel.")
    }
})

roblox.cookieLogin(sConfig.cookie).then((success) => {

}).catch(() => {console.log("Failed to login to Roblox.");});

function getCurrentTime() {
	var currentTime = new Date()
    return dateFormat(currentTime,"isoDateTime")
}

bot.on('message',async (message) => {
    if (message.author.bot && !message.webhookID) return

    var args = message.content.trim().split(" ");
    var command = args.shift().toLowerCase();


    var speakerId
    var speakerRank

    if (!message.webhookID) {
        speakerId = await roblox.getIdFromUsername(message.member.displayName)
        speakerRank = await roblox.getRankInGroup(Config.groupId,speakerId)
    }

    if (message.channel.id == "528738004311998475") {
        var embed
        message.embeds.forEach(async (e) => {
            embed = e
            return
        })
        if (!embed) return
        var id = parseInt(embed.footer.text)
        var username = await roblox.getUsernameFromId(id)
        roblox.getRankInGroup(Config.groupId,id).then(async (rank) => {
            if (rank > 0) {
                roblox.setRank(Config.groupId, id,2).then(newRole => {
                    bot.channels.get('524308609329397801').send(new Discord.RichEmbed()
                    .setAuthor("Rank Log",message.author.displayAvatarURL)
                    .setDescription("User rank changed")
                    .addField("User",username,true)
                    .addField("New Rank",newRole.Name,true)
                    .addField("Speaker","LeTigreBleuBot",true)
                    .addField("Reason","Automatic promotion to pending application.",true)
                    .setTimestamp(getCurrentTime()))
                })
            }
            await message.react('✅')
            await message.react('❎')
            const filter = (reaction, user) => {
                return ['✅', '❎'].includes(reaction.emoji.name) && !user.bot
            };
            var collector = message.createReactionCollector(filter)
            collector.once('collect',r => {
                if (r.emoji.name === "✅") {
                    var user = r.users.find(u => u.bot == false)
                    collector.stop()
                    roblox.setRank(Config.groupId, id,3).then(newRole => {
                        bot.channels.get('524308609329397801').send(new Discord.RichEmbed()
                        .setAuthor("Rank Log",message.author.displayAvatarURL)
                        .setDescription("User rank changed")
                        .addField("User",username,true)
                        .addField("New Rank",newRole.Name,true)
                        .addField("Speaker",user,true)
                        .addField("Reason","Promoted to trainee- acceptance of application.",true)
                        .setTimestamp(getCurrentTime()))
                    })
                    bot.channels.get('529093289089957890').send(embed)
                }
                else if (r.emoji.name === '❎') {
                    var user = r.users.find(u => u.bot == false)
                    collector.stop()
                    roblox.setRank(Config.groupId, id,1).then(newRole => {
                        bot.channels.get('524308609329397801').send(new Discord.RichEmbed()
                        .setAuthor("Rank Log",message.author.displayAvatarURL)
                        .setDescription("User rank changed")
                        .addField("User",username,true)
                        .addField("New Rank",newRole.Name,true)
                        .addField("Speaker",user,true)
                        .addField("Reason","Demoted to audience- failed application.",true)
                        .setTimestamp(getCurrentTime()))
                    })
                }
            })

        }).catch(err => {
            console.error(err)
        })
    }
    if (command == Config.prefix + "ping") {
        message.reply(`Pong! ${bot.ping}ms`)
    }


    if (command === ">eval") {
        if (!(message.author.id == '189495219383697409' || message.author.id == '282639975013679114')) {
            message.channel.send("<@" + message.author.id + "> You are not authorized to use that command.").then(newMessage => {newMessage.delete(5000); message.delete(5000);})
        }
        else {
            message.channel.send("Executing...").then(msg => {
                try {
                    eval(args.join(" "))
                }
                catch (err) {
                    message.channel.send("An error occurred!").then(mss => {mss.delete(2000)})
                    message.author.createDM().then(dmChannel => {
                        dmChannel.send(err)
                    })
                    console.error(err)
                }
                msg.delete()
                message.delete()
            })
        }
    }

    if (command === Config.prefix + "events") {
        //console.log("Hello!")
        var p = Trello.getCardsForList('5bda01c787016f895ed6b10f')
        
        p.then((info) => {
            var msg = "Planned Events:\n"
            var ii = 1
            for (var i in info) {
                var data = info[i]
                if (data && data.labels.find(element => element.name == "Pending") && data.labels.find(element => element.name == "Approved")) {
                    console.log(data.name)
                    msg = msg + `${ii}. **${data.name}**\n`
                    ii++
                }
            }
            if (msg == "Planned Events:\n") msg = "No planned events."
            message.channel.send(msg)
        })

    }

    if (command === Config.prefix + "rank") {
        if (speakerRank < 245) {message.channel.send("You do not have permission to rank users.").then(m => {m.delete(5000); message.delete(5000)}); return}
    	var username = args.shift()
    	if (username){
            var m = await message.channel.send(`Checking Roblox for ${username}`)
            message.delete(20000)
            m.delete(20000)
    		roblox.getIdFromUsername(username)
			.then(function(id){
				roblox.getRankInGroup(Config.groupId, id)
				.then(function(rank){
					if(speakerRank <= parseInt(args[0])){
						m.edit(`You can not rank ${username} to that.`)
					} else {
						m.edit(`${id} is rank ${rank} and can be ranked.`)
						roblox.setRank(Config.groupId, id,parseInt(args.shift()))
						.then(function(newRole){
                            m.edit(`Ranked to ${newRole.Name}`)
                            var reason = args.join(" ")
                            if (reason == "" || reason == " ") reason = "No reason provided"
                            bot.channels.get('524308609329397801').send(new Discord.RichEmbed()
                            .setAuthor("Rank Log",message.author.displayAvatarURL)
                            .setDescription("User rank changed")
                            .addField("User",username,true)
                            .addField("New Rank",newRole.Name,true)
                            .addField("Speaker",message.member.displayName,true)
                            .addField("Reason",reason,true)
                            .setTimestamp(getCurrentTime()))
                            var u = message.guild.members.find(subject => subject.displayName.toLowerCase() == username.toLowerCase())
                            if (u) {
                                u.user.send(new Discord.RichEmbed()
                                .setTitle("Le Tigre Bleu Theatre")
                                .setColor("BLUE")
                                .setDescription(`Your rank in Le Tigre Bleu Theatre has been changed to **${newRole.Name}**.  The reason provided is **${reason}**.\n\nIf you feel the rank change was unfair and would like to appeal, please bring it up to Le Tigre executives by using the **!request** command in <#506586162153127974>.`)
                                .setTimestamp(getCurrentTime())
                                .setFooter("Le Tigre Bleu Theatre"))
                            }
						}).catch(function(err){
                            m.edit("Failed to rank.")
                            console.log(err)
						});
					}
				}).catch(function(err){
                    console.log(err)
					m.edit(`Couldn't get ${username} in the group ${Config.groupId}.`)
				});
			}).catch(function(err){ 
                console.log(err)
				m.edit(`${username} is not a valid account name.`)
			});
    	} else {
    		message.channel.send("Please enter a username.")
    	}
    	return;
    }

    if (command === Config.prefix + "shout") {
        if (speakerRank < 245) {message.channel.send("You do not have permission to shout.").then(m => {m.delete(5000); message.delete(5000)}); return}
        if (!args) {
            message.reply('Please specify a message to shout.')
            return
        }
        const shoutMSG = args.join(" ");

        roblox.shout(Config.groupId, shoutMSG)
            .then(function() {
                console.log(`Shouted ${shoutMSG}`);
                message.channel.send('Shouted to the group!').then(m => {m.delete(5000); message.delete(5000)})
                bot.channels.get('524308609329397801').send(new Discord.RichEmbed()
                    .setAuthor("Shout Log",message.author.displayAvatarURL)
                    .setDescription(message.member.displayName)
                    .addField("Message",shoutMSG,true)
                    .setTimestamp(getCurrentTime()))
            })
            .catch(function(error) {
                console.log(`Shout error: ${error}`)
            });
    }

    if (command === Config.prefix + "request") {
        var guild = bot.guilds.get('524452811988140032')
        if (blacklist.find(e => e == message.author.id)) {
            var rip = await message.channel.send("You are blacklisted from the Le Tigre Bleu request center.")
            rip.delete(5000);
            message.delete(5000);
            return
        }
        if (guild.roles.find('name',message.author.id)) {
            var rip = await message.channel.send("You already have a request channel opened.")
            rip.delete(5000);
            message.delete(5000);
            return
        }
        if (guild.members.get(message.author.id) && guild.members.get(message.author.id).roles.get('524453329204543488')) {message.delete(); return}
        message.channel.send("Check your DM.").then(notice => {notice.delete(15000); message.delete(15000)})
        message.author.send("Please join the server below. You will be able to make your report there.")
        let inv = await message.author.send("`Loading invite...`")
        //var status = await message.author.send("`Loading invite...`")
        var channel = await guild.createChannel(message.member.displayName,"text")
        channel.setParent('524453053664067584')
        channel.overwritePermissions(guild.roles.find('name','@everyone'),{"READ_MESSAGES":false})
        var role = await guild.createRole({name:message.author.id,color:"RED"})
        channel.overwritePermissions(role,{"READ_MESSAGES":true})
        channel.overwritePermissions('524453329204543488',{"READ_MESSAGES":true})
        var invite = await channel.createInvite({
            'unique':true,
            'maxUses':1,
            'maxAge':0,
        })
        reports[message.author.id] = channel.id
        inv.edit("https://discord.gg/" + invite.code)
    }
})

bot.login(Token);