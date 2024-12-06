require('dotenv').config();
const { Client, GatewayIntentBits,ChannelType, Partials, EmbedBuilder, PermissionsBitField, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const express = require('express');

// Set up Express server
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('Hello from the bot app!'));

app.listen(port, () => console.log(`Server running on port ${port}`));

// Initialize Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember],
});
// Menu command to show buttons
client.on('messageCreate', async (message) => {
  if (message.content.toLowerCase() === '/menu') {
    const menuEmbed = new EmbedBuilder()
      .setColor('Blue')
      .setTitle('Main Menu')
      .setDescription('Choose a category to view commands:')
      .addFields(
        { name: 'Owner Commands', value: 'Manage server and users' },
        { name: 'Service Commands', value: 'Explore available services' }
      );

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('owner_commands')
        .setLabel('Owner Commands')
        .setStyle('Primary'),
      new ButtonBuilder()
        .setCustomId('service_commands')
        .setLabel('Service Commands')
        .setStyle('Secondary')
    );

    await message.channel.send({ embeds: [menuEmbed], components: [buttons] });
  }
});

// Handle button interactions
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === 'owner_commands') {
    const ownerEmbed = new EmbedBuilder()
      .setColor('Green')
      .setTitle('Owner Commands')
      .setDescription(`
**Available Commands:**
- \`!kick @user\` - Kick a user from the server.
- \`!ban @user\` - Ban a user from the server.
- \`!clear <number>\` - Clear a specified number of messages.
- \`!menu\` - Show the command menu.
`)
      .setFooter({ text: 'Use these commands responsibly!' });

    await interaction.update({ embeds: [ownerEmbed], components: [getMenuButtons()] });
  }

  if (interaction.customId === 'service_commands') {
    const serviceEmbed = new EmbedBuilder()
      .setColor('Gold')
      .setTitle('Service Commands')
      .setDescription(`
**CoD BO6 Bot Lobbies Instructions**

- **Complete challenges faster**: In Bot Lobbies, you can unlock camos, complete objectives, and progress through challenges as quickly as possible without the frustration of regular SBMM matches.
- Do Not Kill the real player in the enermy team! Bots are easily to be identified.
- When you choose Bot Lobby,Never Call a Nuke. Call a nuke will cause the game to end prematurely. , and we will deduct one game as punishment.
- **Improve your stats**: Your kill/death ratio (K/D) can be improved to a certain extent by controlling BO6 Bot Lobbies and improving your overall game performance.
- **Upgrade your weapons**: Black Ops 6 Bot Lobbies allow you to quickly upgrade your guns by getting high kills with little effort.

**Commands:**
- \`!service bo6\` - View BO6 service details.
      `)
      .setFooter({ text: 'Contact support for more information.' });

    await interaction.update({ embeds: [serviceEmbed], components: [getMenuButtons()] });
  }
});

// Function to return the menu buttons for re-use
function getMenuButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('owner_commands')
      .setLabel('Owner Commands')
      .setStyle('Primary'),
    new ButtonBuilder()
      .setCustomId('service_commands')
      .setLabel('Service Commands')
      .setStyle('Secondary')
  );
}


// Configurations
const bannedWords = ['nigger', 'slut']; // Example: Replace with actual banned words
const ownerID = '1313556003756834856';
const spamLimit = 4;
const spamTimeWindow = 10000;
const raidThreshold = 5;
const spamRoleName = 'Spam';
const verifiedRoleName = 'Verified';
const muteDuration = 600000; // 10 minutes

// Trackers
const messageCounts = {};
const memberJoinTimestamps = {};

// On bot ready
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  updateUptime();
  setInterval(updateUptime, 60000); // Update every minute
});

// Update bot's presence with uptime
function updateUptime() {
  const uptimeSeconds = Math.floor(process.uptime());
  const days = Math.floor(uptimeSeconds / 86400);
  const hours = Math.floor((uptimeSeconds % 86400) / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = uptimeSeconds % 60;

  const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;

  client.user.setPresence({
    activities: [{ name: `Uptime: ${uptimeString} | Zespera`, type: 3 }],
    status: 'online',
  });
}

// Message handling
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // Handle owner commands
  if (message.author.id === ownerID && message.content.startsWith('!')) {
    handleOwnerCommands(message);
    return;
  }

  // Handle service commands
  if (message.content.startsWith('!service')) {
    handleServiceCommands(message);
    return;
  }

  // Handle spam prevention and banned words
  handleSpamAndBannedWords(message);
});

// Handle spam and banned words
function handleSpamAndBannedWords(message) {
  const userId = message.author.id;
  const currentTime = Date.now();

  // Spam prevention
  if (!messageCounts[userId]) {
    messageCounts[userId] = { count: 1, timestamp: currentTime };
  } else {
    messageCounts[userId].count++;
  }

  if (currentTime - messageCounts[userId].timestamp <= spamTimeWindow) {
    if (messageCounts[userId].count > spamLimit) {
      handleSpam(message, userId);
    }
  } else {
    messageCounts[userId] = { count: 1, timestamp: currentTime };
  }

  // Banned words filter
  for (const word of bannedWords) {
    if (message.content.toLowerCase().includes(word)) {
      message.delete().catch(console.error);
      message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setTitle('Inappropriate Language')
            .setDescription('❌ Your message contained banned language.')
            .setFooter({ text: 'Please follow the server rules.' }),
        ],
      });
      return;
    }
  }
}

// Handle spam actions
async function handleSpam(message, userId) {
  const member = message.guild.members.cache.get(userId);
  const spamRole = message.guild.roles.cache.find((role) => role.name === spamRoleName);
  const verifiedRole = message.guild.roles.cache.find((role) => role.name === verifiedRoleName);

  if (!spamRole || !verifiedRole) {
    console.error(`Roles "${spamRoleName}" or "${verifiedRoleName}" not found!`);
    return;
  }

  if (!member.roles.cache.has(spamRole.id)) {
    await member.roles.remove(verifiedRole).catch(console.error);
    await member.roles.add(spamRole).catch(console.error);

    const spamEmbed = new EmbedBuilder()
      .setColor('Red')
      .setTitle('Spam Detected')
      .setDescription('❌ You have been muted for spamming. You will be unmuted in 10 minutes.')
      .setFooter({ text: 'Please follow server rules.' });

    await message.channel.send({ embeds: [spamEmbed] });

    setTimeout(async () => {
      await member.roles.remove(spamRole).catch(console.error);
      await member.roles.add(verifiedRole).catch(console.error);

      message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor('Green')
            .setTitle('Unmuted')
            .setDescription('✅ You have been unmuted.')
            .setFooter({ text: 'Please avoid spamming in the future.' }),
        ],
        content: `<@${userId}>`,
      });
    }, muteDuration);
  }
}

// Handle owner commands
function handleOwnerCommands(message) {
  const args = message.content.slice(1).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === 'kick') {
    const member = message.mentions.members.first();
    if (!member) return message.reply('❌ Please mention a user to kick.');
    if (!message.guild.me.permissions.has(PermissionsBitField.Flags.KickMembers)) {
      return message.reply('❌ I need the Kick Members permission.');
    }

    member.kick().then(() => {
      message.reply({
        embeds: [
          new EmbedBuilder().setColor('Green').setTitle('User Kicked').setDescription(`${member.user.tag} was kicked.`),
        ],
      });
    }).catch(console.error);
  }

  if (command === 'ban') {
    const member = message.mentions.members.first();
    if (!member) return message.reply('❌ Please mention a user to ban.');
    if (!message.guild.me.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      return message.reply('❌ I need the Ban Members permission.');
    }

    member.ban().then(() => {
      message.reply({
        embeds: [
          new EmbedBuilder().setColor('Red').setTitle('User Banned').setDescription(`${member.user.tag} was banned.`),
        ],
      });
    }).catch(console.error);
  }

  if (command === 'clear') {
    const amount = parseInt(args[0]);
    if (isNaN(amount) || amount <= 0 || amount > 100) {
      return message.reply('❌ Provide a number between 1 and 100.');
    }

    message.channel.bulkDelete(amount, true).then(() => {
      message.channel.send({
        embeds: [
          new EmbedBuilder().setColor('Blue').setTitle(`Deleted ${amount} messages.`),
        ],
      }).then((msg) => setTimeout(() => msg.delete().catch(console.error), 5000));
    }).catch(console.error);
  }
}

// Handle service commands
client.on('messageCreate', async (message) => {
  if (message.content.startsWith('/service bo6')) {
    const serviceEmbed = new EmbedBuilder()
      .setColor('Gold')
      .setTitle('BO6 Bot Lobbies')
      .setDescription(`
**Welcome to the BO6 Bot Lobby Service!** 🎮

We offer fast, efficient, and affordable bot lobbies for leveling up and unlocking items in Call of Duty: Black Ops 6. Here's everything you need to know:
---
**Pricing:**
- **Basic Lobby:** R45/game

**Game Mode:** Domination
- 200 points wins
- 30-minute matches
- 200 headshots per game
---
**How It Works:**
1. Click the button below to purchase the **Basic Lobby**.
2. Join the bot lobby invite you'll receive.
3. Once in the game, **switch sides** to place 5 bots on the other team, and get headshots to level up quickly.
4. **Enjoy** unlocking items and progressing faster than ever!
---
**Need Help?** 🤔
If you run into any issues or need further assistance, feel free to reach out to our support team!
**Get started now!**
`)
      .setImage('https://mitchcactus.co/nitropack_static/FhDfyRqwHafuFlnqYqbLYqWLshmFdhix/assets/images/optimized/rev-2582f9a/mitchcactus.co/wp-content/uploads/2024/10/How-to-Get-Bot-Lobbies-in-Black-Ops-6-768x369.webp') // Replace with the actual image URL you want to display
      .setFooter({ text: 'Contact support for help.' });

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('buy_basic').setLabel('Buy Basic Lobby').setStyle('Primary'),
    );

    await message.channel.send({ embeds: [serviceEmbed], components: [buttons] });
  }
});
;



// Interaction handler for button press
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === 'buy_basic') {
    // Create a private ticket channel without a category
    const ticketChannel = await interaction.guild.channels.create({
      name: `ticket-${interaction.user.username}`, // Unique name for the ticket
      type: ChannelType.GuildText, // Text channel
      permissionOverwrites: [
        {
          id: interaction.guild.id, // Deny permissions for everyone else
          deny: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel],
        },
        {
          id: interaction.user.id, // Allow the user to send messages and view the channel
          allow: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel],
        },
        {
          id: ownerID, // Replace with the actual owner's ID
          allow: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel], // Owner has full access
        },
      ],
    });

    // Send a message in the ticket channel
    const ticketEmbed = new EmbedBuilder()
      .setColor('Gold')
      .setTitle('Ticket Created')
      .setDescription(`Hello ${interaction.user.username}, your ticket has been created. Please follow the instructions to proceed with purchasing the Basic Lobby.`)
      .setFooter({ text: 'A staff member will assist you soon.' });

    const closeButton = new ButtonBuilder()
      .setCustomId('close_ticket')
      .setLabel('Close Ticket')
      .setStyle(2) // Primary button style
      .setDisabled(false); // Enable the button

    const buttonRow = new ActionRowBuilder().addComponents(closeButton);

    await ticketChannel.send({
      embeds: [ticketEmbed],
      components: [buttonRow],
    });

    // Notify the user that their ticket has been created
    await interaction.reply({
      content: `✅ Your ticket has been created: ${ticketChannel}. Please follow the instructions there.`,
      ephemeral: true,
    });
  }

  // Handle ticket closure by the owner
  if (interaction.customId === 'close_ticket') {
    // Ensure only the owner or the ticket creator can close the ticket
    const ticketChannel = interaction.channel;

    if (interaction.user.id !== ownerID && interaction.user.id !== ticketChannel.name.split('-')[1]) {
      return interaction.reply({
        content: '❌ You do not have permission to close this ticket.',
        ephemeral: true,
      });
    }

    // Send a confirmation message before deleting the ticket
    const confirmEmbed = new EmbedBuilder()
      .setColor('Red')
      .setTitle('Ticket Closed')
      .setDescription('The ticket will be closed and deleted shortly.');

    await interaction.reply({ embeds: [confirmEmbed], ephemeral: true });

    // Delete the ticket channel after a short delay
    setTimeout(() => {
      ticketChannel.delete().catch(console.error);
    }, 5000); // Delay to give users time to see the confirmation
  }
});

// Login bot
client.login(process.env.TOKEN);
