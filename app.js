require('dotenv').config();

const Discord = require('discord.js');
const client = new Discord.Client();
const axios = require('axios');
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
	if (msg.isMentioned(client.user) && msg.author.id !== '220352311422091264') {
		// Auto-Replier
		msg.reply('Hey! I\'m not available at the moment. I\'ll get back to you as soon as possible.');
	} else if (msg.content.toLowerCase().startsWith("sarthak say ") && msg.author.id !== '220352311422091264') {
		// Sarthak Say Command
		msg.channel.send(msg.content.slice(12, msg.content.length));
	} else if (msg.content.toLowerCase().startsWith("sarthak upload") && msg.author.id !== '220352311422091264') {
		// Upload to s3 Command
		await msg.channel.send("Send your file please!");
		let filter = m => m.author.id === msg.author.id; //use that message only if the author is the same (filter will be used globally)
		msg.channel.awaitMessages(filter, {
			max: 1
		}).then(async fileMessage => {
			let messageContentsWithFile = Array.from(fileMessage); // Convert Set to Array
			let fileContentsFromMessage = Array.from(messageContentsWithFile[0][1].attachments); // Get Attachments Set and convert to Array
			if (fileContentsFromMessage === undefined || fileContentsFromMessage.length == 0) {
				msg.reply('Sorry, I don\'t see a file, I\'ve cancelled your request.');
			} else {
				let fileUrl = fileContentsFromMessage[0][1].url; // Get Url from Attachments Array
				const discordUrlRegex = RegExp(/(?:https:\/\/cdn.discordapp.com\/attachments)\/(.+)\/(.+)\/(.+)/i); // RegExp to check against
				const discordFileInfo = discordUrlRegex.exec(fileUrl); // Execute against a RegExp to get file name
				var fileName = discordFileInfo[3]; // Get File Name from Array: discordFileInfo
				// Check if object exists in s3
				try {
					await s3.headObject({
						Bucket: "sarthakmohanty",
						Key: "public/uploads/" + fileName
					}).promise()
					// If exists, ask for confirmation
					msg.reply('looks like you were about to override someone else\'s file. if you are sure you want to do this, reply `yes` if so and anything else to cancel. I\'ll wait for 20 seconds before I cancel the request.')
					// Check if user said yes
					msg.channel.awaitMessages(filter, {
						max: 1,
						time: 20000
					}).then(async confirmationReplace => {
						let contentArrayFromConfirmationReplace = Array.from(confirmationReplace);
						let contentFromConfirmationReplace = contentArrayFromConfirmationReplace[0][1].content; // content of res
						if (contentFromConfirmationReplace.toLowerCase() === 'yes') {
							// If yes, then replace.
							msg.reply('Confirmed! I\'ll replace the file `' + fileName + '` now!');
							//let createdObject = createNewObject(fileUrl, fileName);
							//console.log(createdObject);
							createNewObject(fileUrl, fileName);
						} else {
							// Otherwise don't, unless they want to add a time (ask yes/no)
							msg.reply('ahh ok that\'s fine. change the file name if you still want to do it or I can do it for you. **reply `yes` if you want to add the time to the name** and anything else to cancel. I\'ll wait for 20 seconds before I cancel the request.')
							// wait for response
							msg.channel.awaitMessages(filter, {
								max: 1,
								time: 20000
							}).then(async confirmationAddTime => {
								// get response content
								let contentArrayFromConfirmationAddTime = Array.from(confirmationAddTime);
								let contentFromConfirmationAddTime = contentArrayFromConfirmationAddTime[0][1].content; // content of res
								if (contentFromConfirmationAddTime.toLowerCase() === 'yes') {
									// add epoch time to fileName variable
									const editedFileName = Date.now() + '_-_' + fileName;
									// add file with new file name
									msg.reply('YAYAYAY I\'ll add the file ' + editedFileName + ' now!');
									createNewObject(fileUrl, editedFileName).then(resMsg => msg.reply(resMsg));
								} else {
									// still no? ok then.
									msg.reply('ahh ok ok. I\'m here when you need me tho.');
								}
							});
						}
					});
				} catch (err) {
					// Otherwise, create a new object
					msg.reply('ooey a new file! yum yum, I\'ll add the file `' + fileName + '` now!')
					createNewObject(fileUrl, fileName).then(resMsg => msg.reply(resMsg));
				}
			}
		});
	}
});

/**
 * createNewObject function parameters.
 * @param {String} link - link axios needs to fetch data from
 * @param {String} name - name object will be stored as / can be used with folder structure 
 */

function createNewObject(link, name) {
	// Get Buffer Data from Link using Axios
	const responseMessage = axios.get(link, {
			responseType: 'arraybuffer'
		})
		.then((buffer) => {
			let mimeType = buffer.headers["content-type"]; // Get MIME Type from Header
			// Check if MIMETYPE is valid
			if (mimeType.length !== 0) {
				// Set params to upload to s3
				var params = {
					Bucket: "sarthakmohanty", // object bucket
					Body: buffer.data, // buffer data from axios
					Key: "public/uploads/" + name,
					ContentType: mimeType, // MIMETYPE from axios
					ACL: "public-read", // Keeps object public
				};
				// Upload to s3
				s3.putObject(params, function (err, data) {
					if (err) {
						console.log(err, err.stack);
						return "Whoops. I ran into an error and don't know how to fix it!"
					} else {
						// Send message to channel with link
						return "Here's yo' normal public (faster) file link: https://sarthakmohanty.s3.amazonaws.com/public/uploads/" + encodeURI(name) + "\n here's yo' discord public link: " + link; // Send Discord Link & CDN Link
					}
				});
			} else {
				// Send error message to channel
				return "uhh we got an invalid filetype in the house. upload a supported filetype. this is a very, *very*, ***very***, rare error which usually means Sarthak fucked up his code somewhere.";
			}
		});
}

client.login(process.env.DISCORD_TOKEN);