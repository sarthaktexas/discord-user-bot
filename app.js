require('dotenv').config();

const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs');
const AWS = require('aws-sdk');
var s3 = new AWS.S3({
	apiVersion: '2006-03-01',
	region: 'us-east-2',
	accessKeyId: process.env.AWS_ACCESS_KEY_ID,
	secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

client.on('ready', () => {
	console.log('Logged in as ' + client.user.username + '#' + client.user.discriminator);
});

client.on('message', async msg => {
	if (msg.author.id !== '220352311422091264') {
		if (msg.isMentioned(client.user)) {
			console.log(msg.author);
			msg.reply('Hey! I\'m not available at the moment. I\'ll get back to you as soon as possible.');
		} else if (msg.content.startsWith("sarthak say ")) {
			msg.channel.send(msg.content.slice(12, msg.content.length));
		} else if (msg.content.startsWith("sarthak upload")) {
			await message.channel.send("Send your file please..");
			let filter = m => m.author == message.author; //use that message only if the author is the same
			msg.channel.awaitMessages(filter, {
				max: 1
			}).then(res => {
				let file = res.attachments.first().file;
				fs.readFile(file, (err, data) => {
					res.channel.send("Read the file! Fetching data...");
					res.channel.send(data);
			});
		});
	} else {
		console.log('saw message: ' + msg.content);
		msg.delete(3000);
		console.log('deleted message: ' + msg.content);
	}
});

client.login(process.env.DISCORD_TOKEN);
