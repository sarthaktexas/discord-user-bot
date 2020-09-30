require('dotenv').config();

const Discord = require('discord.js');
const client = new Discord.Client();

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
  }
});

client.login(process.env.DISCORD_TOKEN);