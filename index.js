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

// menu
client.on('messageCreate', async (message) => {
  if (message.content.toLowerCase() === '/menu') {
    const menuEmbed = new EmbedBuilder()
      .setColor('Blue')
      .setTitle('📋 Main Menu')
      .setDescription('Explore the available categories below:')
      .addFields(
        { name: '🔧 Owner Commands', value: 'Manage server settings and users.', inline: true },
        { name: '🎮 Service Bo6', value: 'Check out our Bot Lobbies.', inline: true },
        { name: '🚧 Service Codm', value: 'Coming soon! Stay tuned.', inline: true }
      )
      .setFooter({ text: 'Use the buttons below to navigate through the options.' });

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('owner_commands')
        .setLabel('🔧 Owner Commands')
        .setStyle('Primary'),
      new ButtonBuilder()
        .setCustomId('service_bo6')
        .setLabel('🎮 Service Bo6')
        .setStyle('Secondary'),
      new ButtonBuilder()
        .setCustomId('service_codm')
        .setLabel('🚧 Service Codm')
        .setStyle('Secondary')
        .setDisabled(true) // Disable the button since it's coming soon
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
- \`/kick @user\` - Kick a user from the server.
- \`/ban @user\` - Ban a user from the server.
- \`/clear <number>\` - Clear a specified number of messages.
- \`/menu\` - Show the command menu.
`)
      .setFooter({ text: 'Use these commands responsibly!' });

    await interaction.update({ embeds: [ownerEmbed], components: [getMenuButtons()] });
  }

  if (interaction.customId === 'service_bo6') {
    const serviceEmbed = new EmbedBuilder()
      .setColor('Gold')
      .setTitle('Service bo6')
      .setDescription(`
**CoD BO6 Bot Lobbies Instructions**

- **Complete challenges faster**: In Bot Lobbies, you can unlock camos, complete objectives, and progress through challenges as quickly as possible without the frustration of regular SBMM matches.
- Do Not Kill the real player in the enemy team! Bots are easily identified.
- **Improve your stats**: Your kill/death ratio (K/D) can be improved by controlling BO6 Bot Lobbies.

- **BOT LOBBIES**
- \`Mixed Lobby\` - Join a low level, low kill match, play with bad users (Real players/bots) latency 300, location USA.
- \`Full Bot Lobby\` - 10 Full Bot accounts, Only 1 real player (you).
      `)
      .setFooter({ text: 'Credit Card Payments Only - Yoco Payment Link.' });

    await interaction.update({ embeds: [serviceEmbed], components: [getMenuButtons()] });
  }

  if (interaction.customId === 'service_codm') {
    const serviceEmbed = new EmbedBuilder()
      .setColor('Gold')
      .setTitle('Service Codm')
      .setDescription(`
  **Codm Bot Lobbies Instructions**
  
  - **Complete challenges faster**: In Bot Lobbies, you can unlock camos, complete objectives, and progress through challenges as quickly as possible without the frustration of regular SBMM matches.
  - Do Not Kill the real player in the enemy team! Bots are easily identified.
  - **Improve your stats**: Your kill/death ratio (K/D) can be improved by controlling Codm Bot Lobbies.
  
  - **BOT LOBBIES**
  - \`Full Bot Lobby\` - 10 Full Bot accounts, Only 1 real player (you).
      `)
      .setFooter({ text: 'Credit Card Payments Only - Yoco Payment Link.' });
  
    await interaction.update({ embeds: [serviceEmbed], components: [getMenuButtons()] });
  }
  
});

// Function to return the menu buttons for re-use
function getMenuButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('owner_commands')
      .setLabel('🔧 Owner Commands')
      .setStyle('Primary'),
    new ButtonBuilder()
      .setCustomId('service_bo6')
      .setLabel('🎮 Service Bo6')
      .setStyle('Secondary'),
    new ButtonBuilder()
      .setCustomId('service_codm')
      .setLabel('🚧 Service Codm')
      .setStyle('Secondary')
      .setDisabled(true) // Disable the button since it's coming soon
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
  if (message.author.id === ownerID && message.content.startsWith('/')) {
    handleOwnerCommands(message);
    return;
  }

  // Handle service commands
  if (message.content.startsWith('/service')) {
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
  try {
    if (message.content.toLowerCase().startsWith('/service bo6')) {
      const serviceEmbed = new EmbedBuilder()
        .setColor('Gold')
        .setTitle('🎮 BO6 Bot Lobbies Service')
        .setDescription(`
**Welcome to the BO6 Bot Lobby Service!**

We provide efficient and affordable bot lobbies for **Call of Duty: Black Ops 6**, helping you level up and unlock items faster!

---

**📋 Pricing:**
- **Mixed Lobby:** R5/game
- **Full Bot Lobby:** R45/game

**🎮 Game Mode: Domination**
- Matches last **30 minutes**.
- **200 points wins**.
- **Up to 150 headshots per game**!

---

**🚀 How It Works:**
1. Click the button below to purchase a **Mixed Lobby** or **Full Bot Lobby**.
2. Follow the invite instructions provided after payment.
3. **Enjoy** fast progression and unlocking new items!

---

**❓ Need Help?**
Reach out to our support team if you have any questions or issues.

Start your journey now! 🔥
        `)
        .setImage('https://mitchcactus.co/nitropack_static/FhDfyRqwHafuFlnqYqbLYqWLshmFdhix/assets/images/optimized/rev-2582f9a/mitchcactus.co/wp-content/uploads/2024/10/How-to-Get-Bot-Lobbies-in-Black-Ops-6-768x369.webp') // Replace with your image URL
        .setFooter({ text: 'Payments accepted via Yoco. Credit Card only.' });

      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('buy_mixed') // Ensure IDs match in the handler
          .setLabel('Buy Mixed Lobby - R5')
          .setStyle('Primary'),
        new ButtonBuilder()
          .setCustomId('buy_full') // Ensure IDs match in the handler
          .setLabel('Buy Full Bot Lobby - R45')
          .setStyle('Primary')
          .setDisabled(true)
      );

      await message.channel.send({
        embeds: [serviceEmbed],
        components: [buttons],
      });
    }
  } catch (error) {
    console.error('Error handling /service command:', error);
    await message.channel.send('⚠️ An error occurred while processing your request. Please try again later.');
  }
});

client.on('messageCreate', async (message) => {
  try {
    if (message.content.toLowerCase().startsWith('/service codm')) {
      const serviceEmbed = new EmbedBuilder()
        .setColor('Gold')
        .setTitle('🎮 Codm Bot Lobbies Service')
        .setDescription(`
**Welcome to the Codm Bot Lobby Service!**

We provide efficient and affordable bot lobbies for **Call of Duty: Mobile**, helping you level up and unlock items faster!

---

**📋 Pricing:**
- **Full Bot Lobby:** R5/game

**🎮 Game Mode: Domination**
- Matches last **30 minutes**.
- **200 points wins**.
- **Up to 150 headshots per game**!

---

**🚀 How It Works:**
1. Click the button below to purchase a **Full Bot Lobby**.
2. Follow the invite instructions provided after payment.
3. **Enjoy** fast progression and unlocking new items!

---

**❓ Need Help?**
Reach out to our support team if you have any questions or issues.

Start your journey now! 🔥
        `)
        .setImage('https://cdn.prod.website-files.com/65956e2711516206d2d1258f/6634c7715af10f24b00dc7b1_CODM%202663x1384-p-1080.webp') // Replace with your image URL
        .setFooter({ text: 'Payments accepted via Yoco. Credit Card only.' });

      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('buy_full') // Ensure IDs match in the handler
          .setLabel('Buy Full Bot Lobby - R5')
          .setStyle('Primary')
      );

      await message.channel.send({
        embeds: [serviceEmbed],
        components: [buttons],
      });
    }
  } catch (error) {
    await message.channel.send('⚠️ An error occurred while processing your request. Please try again later.');
  }
});



// Handle interaction events for button clicks
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  try {
    if (interaction.customId === 'buy_mixed' || interaction.customId === 'buy_full') {
      // Create a private ticket channel
      const ticketChannel = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.username}`, // Unique name for the ticket
        type: ChannelType.GuildText, // Text channel
        permissionOverwrites: [
          {
            id: interaction.guild.id, // Deny permissions for everyone
            deny: [PermissionsBitField.Flags.ViewChannel],
          },
          {
            id: interaction.user.id, // Allow the user access
            allow: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel],
          },
          {
            id: ownerID, // Allow the owner full access
            allow: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel],
          },
        ],
      });

      const ticketEmbed = new EmbedBuilder()
        .setColor('Gold')
        .setTitle('Ticket Created')
        .setDescription(`Hello ${interaction.user.username}, your ticket has been created. Please follow the instructions to proceed with purchasing the ${interaction.customId === 'buy_mixed' ? 'Mixed Lobby' : 'Full Bot Lobby'}.`)
        .setFooter({ text: 'A staff member will assist you shortly.' });

      const closeButton = new ButtonBuilder()
        .setCustomId('close_ticket') // Ensure the close button has its own ID
        .setLabel('Close Ticket')
        .setStyle('Danger');

      const buttonRow = new ActionRowBuilder().addComponents(closeButton);

      await ticketChannel.send({
        embeds: [ticketEmbed],
        components: [buttonRow],
      });

      await interaction.reply({
        content: `✅ Your ticket has been created: ${ticketChannel}. Please follow the instructions there.`,
        ephemeral: true, // Only visible to the user who clicked the button
      });
    }

    if (interaction.customId === 'close_ticket') {
      const ticketChannel = interaction.channel;

      // Only allow ticket creator or owner to close the ticket
      const ticketOwner = ticketChannel.name.split('-')[1];
      if (interaction.user.id !== ownerID && interaction.user.username !== ticketOwner) {
        return interaction.reply({
          content: '❌ You do not have permission to close this ticket.',
          ephemeral: true,
        });
      }

      await interaction.reply({
        content: '✅ Closing ticket. This channel will be deleted shortly.',
        ephemeral: true,
      });

      setTimeout(() => {
        ticketChannel.delete().catch(console.error);
      }, 5000); // 5-second delay for visibility
    }
  } catch (error) {
    await interaction.reply({
      content: '⚠️ An error occurred while processing your action. Please try again later.',
      ephemeral: true,
    });
  }
});




// Login bot
client.login(process.env.TOKEN);
