require('dotenv').config();

const Discord = require('discord.js');
const client = new Discord.Client();
const Wolfram = require('node-wolfram');

client.on('ready', () => {
	console.log('Logged in as ' + client.user.username + '#' + client.user.discriminator);
});

client.on('message', msg => {
	if (msg.isMentioned(client.user) && msg.author.id !== '220352311422091264') {
		console.log(msg.author);
		msg.reply('Hey! I\'m not available at the moment. I\'ll get back to you as soon as possible.');
	} else if (msg.author.id === '220352311422091264' && msg.channel.id === '694399153228218468') {
		console.log('saw message: ' + msg.content);
		msg.delete(3000);
		console.log('deleted message: ' + msg.content);
	} else if (msg.content.startsWith("sarthak say ") && msg.author.id !== '220352311422091264') {
		msg.channel.send(msg.content.slice(12, msg.content.length));
	} else if (msg.content.startsWith("math ") && msg.author.id !== '220352311422091264') {

		function WolframPlugin() {
			this.wolfram = new Wolfram(process.env.WOLFRAM_APP_ID)
		};

		WolframPlugin.prototype.respond = function (query, channel, bot, tmpMsg) {
			this.wolfram.query(query, function (error, result) {
				if (error) {
					console.log(error);
					tmpMsg.edit("Couldn't talk to Wolfram Alpha :(")
				} else {
					var response = "";
					if (result.queryresult.$.success == "true") {
						tmpMsg.delete();
						if (result.queryresult.hasOwnProperty("warnings")) {
							for (var i in result.queryresult.warnings) {
								for (var j in result.queryresult.warnings[i]) {
									if (j != "$") {
										try {
											channel.send(result.queryresult.warnings[i][j][0].$.text);
										} catch (e) {
											console.log("WolframAlpha: failed displaying warning:\n" + e.stack());
										}
									}
								}
							}
						}
						if (result.queryresult.hasOwnProperty("assumptions")) {
							for (var i in result.queryresult.assumptions) {
								for (var j in result.queryresult.assumptions[i]) {
									if (j == "assumption") {
										try {
											channel.send(`Assuming ${result.queryresult.assumptions[i][j][0].$.word} is ${result.queryresult.assumptions[i][j][0].value[0].$.desc}`);
										} catch (e) {
											console.log("WolframAlpha: failed displaying assumption:\n" + e.stack());
										}
									}
								}
							}
						}
						for (var a = 0; a < result.queryresult.pod.length; a++) {
							var pod = result.queryresult.pod[a];
							response += "**" + pod.$.title + "**:\n";
							for (var b = 0; b < pod.subpod.length; b++) {
								var subpod = pod.subpod[b];
								//can also display the plain text, but the images are prettier
								/*for(var c=0; c<subpod.plaintext.length; c++)
								{
								    response += '\t'+subpod.plaintext[c];
								}*/
								for (var d = 0; d < subpod.img.length; d++) {
									response += "\n" + subpod.img[d].$.src;
									channel.send(response);
									response = "";
								}
							}
							response += "\n";
						}
					} else {
						if (result.queryresult.hasOwnProperty("didyoumeans")) {
							var msg = [];
							for (var i in result.queryresult.didyoumeans) {
								for (var j in result.queryresult.didyoumeans[i].didyoumean) {
									msg.push(result.queryresult.didyoumeans[i].didyoumean[j]._);
								}
							}
							tmpMsg.edit("Did you mean: " + msg.join(" "));
						} else {
							tmpMsg.edit("No results from Wolfram Alpha :(");
						}
					}
				}
			});
		};
	}
});

client.login(process.env.DISCORD_TOKEN);