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
var Filter = require('bad-words'),
filter = new Filter();

client.on('ready', () => {
	console.log('Logged in as ' + client.user.username + '#' + client.user.discriminator);
});

client.on('message', async msg => {
	if (msg.isMentioned(client.user) && !msg.author.bot && msg.author.id !== '220352311422091264') {
		// Auto-Replier
		console.log(msg.author);
		// msg.reply('Hey! I\'m not available at the moment. I\'ll get back to you as soon as possible.');
	} else if (msg.content.toLowerCase().startsWith("sarthak ping")) {
		let start = Date.now();
	    	msg.channel.sendMessage("*Pinging...*").then((pingRes) => {
	      		let end = Date.now();
	      		pingRes.edit(`Pong! **${(end - start).toFixed(0)}ms**`);
	    	});
	} else if (msg.content.toLowerCase().startsWith("sarthak avatar")) {
		var user;
		user = msg.mentions.users.first(); //mentioned user, if any
		if (!user) {
		  // if someone isn't mentioned
		  msg.reply("", {
		      embed: {
			color: 0xf01fb1,
			title: "Avatar",
			url: msg.author.avatarURL,
			image: {
				url: msg.author.avatarURL,
			},
		      },
		 });
		} else {
		  //if someone IS mentioned
		  msg.reply("", {
		      embed: {
			color: 0xf01fb1,
			title: "Avatar",
			url: user.avatarURL,
			image: {
				url: user.avatarURL,
			},
		      },
		 });
		}
	} else if (msg.content.toLowerCase().startsWith("sarthak clear")) {
		var args = msg.content.split(' ').slice(1); // All arguments behind the command
		var amount = args[1]; // Amount of messages which should be deleted

		if (!amount) return msg.reply('You haven\'t given an amount of messages which should be deleted!'); // Checks if the `amount` parameter is given
		if (isNaN(amount)) return msg.reply('The amount parameter isn`t a number!'); // Checks if the `amount` parameter is a number. If not, the command throws an error

		if (amount > 100) return msg.reply('You can`t delete more than 100 messages at once!'); // Checks if the `amount` integer is bigger than 100
		if (amount < 1) return msg.reply('You have to delete at least 1 message!'); // Checks if the `amount` integer is smaller than 1
		
		if (msg.author.id === '220352311422091264') {
			msg.delete(); // deletes command message
		} else {
			amount += 1;
		}

		msg.channel.fetchMessages({
			limit: amount
		}).then(function (messages) {
				messages.forEach(message => {
					if (message.author.id === '220352311422091264') {
						// if user said it, then delete.
						message.delete();
					}
				});
			});
	} else if (msg.content.toLowerCase().startsWith("sarthak say ") && msg.author.id !== '220352311422091264') {
		// Sarthak Say Command
		let sayBool = true;
		let messageContent = msg.content.slice(12, msg.content.length);
		// Jimmy Easter Egg
		if (msg.author.username === 'Math_Pro' && msg.author.discriminator === '4856') {
			sayBool = false;
			msg.reply('no shut up jim jom.');
			msg.channel.send('<:jimysmile:757076935565246476>');
		}
		// Love Easter Egg
		var loveWords = ["love", "luv", "lov", "lv"];
		let loveBanned = false;
		for (const word of loveWords) {
			if (messageContent.match(word)) {
				loveBanned = true;
				sayBool = false;
			}
		}
		if (loveBanned) {
			msg.reply(`Love is fake. It's not real. Don't believe in it. BOOOO <@${msg.author.id}>!`);
		}
		if (sayBool) {
			// Replace Message Diacritics with normal characters.
			var Diacritics = require('diacritic');
			let replacedMessageContent = Diacritics.clean(messageContent);
			// Replace fancy fonts & fancy unicode characters with normal characters.
			replacedMessageContent = toRegularCharacters(replacedMessageContent);
			// Get message and replace other commonly used characters
			replacedMessageContent = replacedMessageContent.toLowerCase().replace(/[.\/\\&:;~$%"<>#!?'`\(\)*^+,_-\s]/g, "").replace(/©️/g, 'c');
			// Check if bad word
			var badwords = require('./badwords.json')
			let banned = false;
			let bannedWords = '';
			for (const word of badwords) {
				if (replacedMessageContent.match(word)) {
					banned = true;
					bannedWords += ` ${word}`
				}
			}
			if (banned) {
				msg.reply('no no no. I can\'t say `' + filter.clean(bannedWords) + '`');
			} else {
				messageContent = filter.clean(messageContent);
				// Send message with filtered word
				msg.channel.send(messageContent);
			}
		}
	} else if (msg.content.toLowerCase().startsWith("sarthak upload") && msg.author.id !== '220352311422091264') {
		// Upload to s3 Command
		await msg.channel.send("Send your file please!");
		let filter = m => m.author.id === msg.author.id; //use that message only if the author is the same (filter will be used globally)
		msg.channel.awaitMessages(filter, {
			max: 1
		}).then(async fileMessage => {
			let messageContentsWithFile = Array.from(fileMessage); // Convert Set to Array
			let fileContentsFromMessage = Array.from(messageContentsWithFile[0][1].attachments); // Get Attachments Set and convert to Array
			if (fileContentsFromMessage === undefined || fileContentsFromMessage.length === 0) {
				msg.reply('Sorry, I don\'t see a file, I\'ve cancelled your request.');
			} else {
				let fileUrl = fileContentsFromMessage[0][1].url; // Get Url from Attachments Array
				const discordUrlRegex = RegExp(/(?:https:\/\/cdn.discordapp.com\/attachments)\/(.+)\/(.+)\/(.+)/i); // RegExp to check against
				const discordFileInfo = discordUrlRegex.exec(fileUrl); // Execute against a RegExp to get file name
				var fileName = discordFileInfo[3]; // Get File Name from Array: discordFileInfo
				// Check if object exists in s3
				try {
					await s3.headObject({
						Bucket: 'dcs7zyl28wkldban',
						Key: `angelhacks/${msg.author.id}/${fileName}`
					}).promise()
					// If exists, ask for confirmation
					msg.reply('looks like you were about to override your own file. if you are sure you want to do this, reply `yes` if so and anything else to cancel. I\'ll wait for 20 seconds before I cancel the request.')
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
							createNewObject(fileUrl, msg.author.id, fileName).then(resMsg => msg.reply(resMsg));
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
									createNewObject(fileUrl, msg.author.id, editedFileName).then(resMsg => msg.reply(resMsg));
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
					createNewObject(fileUrl, msg.author.id, fileName).then(resMsg => msg.reply(resMsg));
				}
			}
		});
	}
});

/**
 * Create a new s3 Object from link.
 * @param {String} link - link axios needs to fetch data from
 * @param {String} authorId - id of author for folder structure
 * @param {String} name - name object will be stored as / can be used with folder structure 
 */

async function createNewObject(link, authorId, name) {
	// Initiate responseMessage const
	let responseMessage;
	// Get Buffer Data from Link using Axios
	axios.get(link, {
			responseType: 'arraybuffer'
		})
		.then((buffer) => {
			let mimeType = buffer.headers["content-type"]; // Get MIME Type from Header
			// Check if MIMETYPE is valid
			if (mimeType.length !== 0) {
				// Set params to upload to s3
				var params = {
					Bucket: 'dcs7zyl28wkldban', // object bucket
					Body: buffer.data, // buffer data from axios
					Key: `angelhacks/${authorId}/${name}`,
					ContentType: mimeType, // MIMETYPE from axios
					ACL: 'public-read', // Keeps object public
				};
				// Upload to s3
				s3.putObject(params, function (err, data) {
					if (err) {
						console.log(err, err.stack);
						responseMessage = 'Whoops. I ran into an error and don\'t know how to fix it!'
					} else {
						// Send message to channel with link
						responseMessage = 'Here\'s yo\' normal public (faster) file link: <https://dcs7zyl28wkldban.s3.amazonaws.com/angelhacks/' + encodeURI(authorId) + '/' + encodeURI(name) + '>\n here\'s yo\' discord public link: <' + link + '>'; // Send Discord Link & CDN Link
						// log creation event
						responseMessage += `\n\n*Created ${name}! ETag: ${data.ETag} encrypted with ${data.ServerSideEncryption}.*`;
					}
				});
			} else {
				// Send error message to channel
				responseMessage = 'uhh we got an invalid filetype in the house. upload a supported filetype. this is a very, *very*, ***very***, rare error which usually means Sarthak messed up his code somewhere.';
			}
		});
	await new Promise(resolve => setTimeout(resolve, 2000));
	return responseMessage;
}

const unicodeNames = require('@unicode/unicode-13.0.0/Names');

const overrides = Object.freeze({
	'ん': 'h',
	'乇': 'E',
	'ﾚ': 'l',
	'尺': 'r',
	'凵': 'u',
	'◡': 'u',
	'‿': 'u',
	'Ʊ': 'u',
	'℉': 'F',
	'z': 's',
	'0': 'o',
	'4': 'a',
	'@': 'a',
	'©️': 'c',
	'®️': 'R',
	'🇦': 'a',
	'🇧': 'b',
	'🇨': 'c',
	'🇩': 'd',
	'🇪': 'e',
	'🇫': 'f',
	'🇬': 'g',
	'🇭': 'h',
	'🇮': 'i',
	'🇯': 'j',
	'🇰': 'k',
	'🇱': 'l',
	'🇲': 'm',
	'🇳': 'n',
	'🇴': 'o',
	'🇵': 'p',
	'🇶': 'q',
	'🇷': 'r',
	'🇸': 's',
	'🇹': 't',
	'🇺': 'u',
	'🇻': 'v',
	'🇼': 'w',
	'🇽': 'x',
	'🇾': 'y',
	'🇿': 'z',
	// ...
});

/**
 * Normalize fancy fonts.
 * @param {String} xs - string to normalize.
 */

const toRegularCharacters = xs => {
	if (typeof xs !== 'string') {
		throw new TypeError('xs must be a string');
	}

	return [...xs].map(x => {
		const override = overrides[x];

		if (override) {
			return override;
		}

		const names = unicodeNames
			.get(x.codePointAt(0))
			.split(/\s+/);

		// console.log({
		//   x,
		//   names,
		// });

		const isCapital = names.some(x => x == 'CAPITAL');

		const isLetter = isCapital || names.some(x => x == 'SMALL');

		if (isLetter) {
			// e.g. "Ŧ" is named "LATIN CAPITAL LETTER T WITH STROKE"
			const c = names.some(x => x == 'WITH') ?
				names[names.length - 3] :
				names[names.length - 1];

			return isCapital ?
				c :
				c.toLowerCase();
		}

		return x;
	}).join('');
};

client.login(process.env.DISCORD_TOKEN);
