const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

// ===== CONFIG =====
const allowedRoleIds = [
  "111111111111111111", // Admin
  "222222222222222222"  // Staff
];

const logChannelId = "1468013210446594280";   // 👈 YOUR LOG CHANNEL
// ==================

module.exports = {
  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription('Make the bot send a message')
    .addStringOption(option =>
      option
        .setName('message')
        .setDescription('What to say')
        .setRequired(true)
    )
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('Where to send it (optional)')
        .setRequired(false)
    )
    .addBooleanOption(option =>
      option
        .setName('embed')
        .setDescription('Send as embed instead of plain text')
        .setRequired(false)
    ),

  async execute(interaction) {

    // ----- ROLE CHECK -----
    const member = interaction.member;

    const hasRole = allowedRoleIds.some(id =>
      member.roles.cache.has(id)
    );

    if (!hasRole) {
      return interaction.reply({
        content: "❌ You don't have permission to use this command.",
        ephemeral: true
      });
    }

    const text = interaction.options.getString('message');
    const channel = interaction.options.getChannel('channel') || interaction.channel;
    const useEmbed = interaction.options.getBoolean('embed');

    // Block @everyone/@here abuse
    if (text.includes("@everyone") || text.includes("@here")) {
      return interaction.reply({
        content: "❌ You cannot use @everyone or @here with this command.",
        ephemeral: true
      });
    }

    // ----- SEND MESSAGE -----
    let sentMessage;

    if (useEmbed) {
      const embed = new EmbedBuilder()
        .setDescription(text)
        .setColor(0x57F287)
        .setFooter({
          text: `Sent by ${interaction.user.tag}`
        });

      sentMessage = await channel.send({ embeds: [embed] });
    } else {
      sentMessage = await channel.send(text);
    }

    await interaction.reply({
      content: "✅ Message sent!",
      ephemeral: true
    });

    // ===== LOGGING =====
    const logChannel = interaction.guild.channels.cache.get(logChannelId);

    if (logChannel) {
      const logEmbed = new EmbedBuilder()
        .setTitle("📢 /say Command Used")
        .setColor(0x2F3136)
        .addFields(
          { name: "User", value: `${interaction.user.tag}`, inline: true },
          { name: "Channel", value: `<#${channel.id}>`, inline: true },
          { name: "Type", value: useEmbed ? "Embed" : "Plaintext", inline: true },
          { name: "Content", value: text.slice(0, 1000) }
        )
        .setDescription(`[Jump to message](${sentMessage.url})`)
        .setTimestamp();

      logChannel.send({ embeds: [logEmbed] });
    }

  }
};
