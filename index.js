require('dotenv').config();
const { Client, GatewayIntentBits, Partials, EmbedBuilder, PermissionsBitField } = require('discord.js');


// Create an express app to bind to a port
const app = express();
const port = process.env.PORT || 3000; // Use Render's PORT or default to 3000

app.get('/', (req, res) => {
  res.send('Hello from the bot app!');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});



const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember],
});

// Configuration
const bannedWords = ['nigger, slut']; // Replace with actual banned words
const ownerID = '1313556003756834856'; // Replace with your Discord user ID
const spamLimit = 4; // Messages allowed in time window
const spamTimeWindow = 10000; // Time window in ms (10 seconds)
const raidThreshold = 5; // Members allowed in 30 seconds
const spamRoleName = 'Spam'; // Role assigned to spammers
const verifiedRoleName = 'Verified'; // Role to remove when user is spamming
const muteDuration = 600000; // 10 minutes in milliseconds

// Trackers
const messageCounts = {};
const userWarnings = {};
const memberJoinTimestamps = {};

// Ready Event
// Ready Event
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  
  updateUptime(); // Call the function initially
  setInterval(updateUptime, 60000); // Update every minute
});

// Function to update the bot's bio with uptime
function updateUptime() {
  const uptimeSeconds = Math.floor(process.uptime());
  const days = Math.floor(uptimeSeconds / (3600 * 24));
  const hours = Math.floor((uptimeSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = uptimeSeconds % 60;

  const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;

  client.user.setPresence({
    activities: [{ name: `Uptime: ${uptimeString} | Zespera`, type: 3 }],
    status: 'online',
  });
}


client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const userId = message.author.id;
  const currentTime = Date.now();

  // SPAM PREVENTION
  if (!messageCounts[userId]) {
    messageCounts[userId] = { count: 1, timestamp: currentTime };
  } else {
    messageCounts[userId].count++;
  }

  if (currentTime - messageCounts[userId].timestamp <= spamTimeWindow) {
    if (messageCounts[userId].count > spamLimit) {
      // Find the roles
      const spamRole = message.guild.roles.cache.find(role => role.name === spamRoleName);
      const verifiedRole = message.guild.roles.cache.find(role => role.name === verifiedRoleName);

      if (!spamRole || !verifiedRole) {
        console.error(`Roles "${spamRoleName}" or "${verifiedRoleName}" not found!`);
        return;
      }

      const member = message.guild.members.cache.get(userId);
      if (!member.roles.cache.has(spamRole.id)) {
        // Remove Verified role and add Spam role
        await member.roles.remove(verifiedRole).catch(console.error);
        await member.roles.add(spamRole).catch(console.error);

        const spamEmbed = new EmbedBuilder()
          .setColor('Red')
          .setTitle('Spam Detected')
          .setDescription(`❌ You have been muted for spamming. The Verified role has been removed, and you will be unmuted in 10 minutes.`)
          .setFooter({ text: 'Please follow server rules.' });

        await message.channel.send({ embeds: [spamEmbed] });

        // Schedule role changes after 10 minutes
        setTimeout(async () => {
          await member.roles.remove(spamRole).catch(console.error);
          await member.roles.add(verifiedRole).catch(console.error);

          const unmuteEmbed = new EmbedBuilder()
            .setColor('Green')
            .setTitle('Unmuted')
            .setDescription(`✅ You have been unmuted and your Verified role has been restored.`)
            .setFooter({ text: 'Please avoid spamming in the future.' });

          await message.channel.send({ embeds: [unmuteEmbed], content: `<@${userId}>` });
        }, muteDuration);
      }
    }
  } else {
    messageCounts[userId] = { count: 1, timestamp: currentTime };
}


  // BANNED WORDS FILTER
  const lowerCaseMessage = message.content.toLowerCase();
  for (const word of bannedWords) {
    if (lowerCaseMessage.includes(word)) {
      await message.delete().catch(console.error);
      const filterEmbed = new EmbedBuilder()
        .setColor('Red')
        .setTitle('Inappropriate Language')
        .setDescription('❌ Your message contained banned language.')
        .setFooter({ text: 'Please follow the server rules.' });

      return message.channel.send({ embeds: [filterEmbed] });
    }
  }

  // COMMAND HANDLING (OWNER ONLY)
  if (message.author.id !== ownerID) return;

  const prefix = '!';
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // KICK COMMAND
  if (command === 'kick') {
    const member = message.mentions.members.first();
    if (!member) return message.reply('❌ Please mention a user to kick.');
    if (!message.guild.me.permissions.has(PermissionsBitField.Flags.KickMembers)) {
      return message.reply('❌ I need "Kick Members" permission.');
    }

    member.kick().then(() => {
      message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Green')
            .setTitle('User Kicked')
            .setDescription(`${member.user.tag} was kicked.`),
        ],
      });
    }).catch(err => {
      console.error(err);
      message.reply('❌ Failed to kick the user.');
    });
  }

  // BAN COMMAND
  if (command === 'ban') {
    const member = message.mentions.members.first();
    if (!member) return message.reply('❌ Please mention a user to ban.');
    if (!message.guild.me.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      return message.reply('❌ I need "Ban Members" permission.');
    }

    member.ban().then(() => {
      message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setTitle('User Banned')
            .setDescription(`${member.user.tag} was banned.`),
        ],
      });
    }).catch(err => {
      console.error(err);
      message.reply('❌ Failed to ban the user.');
    });
  }

// CLEAR COMMAND
if (command === 'clear') {
  const amount = parseInt(args[0]);
  if (isNaN(amount) || amount <= 0 || amount > 100) {
    return message.reply('❌ Provide a number between 1 and 100.');
  }

  const messages = await message.channel.messages.fetch({ limit: amount });

  // Bulk delete messages and send a confirmation
  message.channel.bulkDelete(messages, true).then(() => {
    message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor('Blue')
          .setTitle(`Deleted ${messages.size} messages.`),
      ],
    }).then(msg => {
      // Delete the confirmation message after 5 seconds
      setTimeout(() => msg.delete().catch(console.error), 5000);
    });
  }).catch(err => {
    console.error(err);
    message.reply('❌ Failed to clear messages.').then(msg => {
      setTimeout(() => msg.delete().catch(console.error), 5000);
    });
  });
}


  // MENU COMMAND
  if (command === 'menu') {
    const menuEmbed = new EmbedBuilder()
      .setColor('Blue')
      .setTitle('Bot Commands')
      .setDescription(`
**Moderation Commands:**
- \`!kick @user\` - Kick a user.
- \`!ban @user\` - Ban a user.
- \`!clear <number>\` - Delete messages.
- \`!banlist\` - List banned users.

**Use these commands responsibly.**
      `);

    message.reply({ embeds: [menuEmbed] });
  }
});

// RAID PREVENTION
client.on('guildMemberAdd', (member) => {
  const now = Date.now();
  memberJoinTimestamps[member.id] = now;

  const recentJoins = Object.values(memberJoinTimestamps).filter(t => now - t <= 30000); // 30s window
  if (recentJoins.length > raidThreshold) {
    member.kick('Potential raid detected.').catch(console.error);
  }
});

client.login(process.env.TOKEN);






