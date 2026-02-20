const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('View detailed information about a user')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('User to view')
        .setRequired(true)
    ),

  async execute(interaction) {

    const target = interaction.options.getUser('user');
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);

    if (!member) {
      return interaction.reply({
        content: "❌ User not found in this server.",
        ephemeral: true
      });
    }

    const roles = member.roles.cache
      .filter(r => r.id !== interaction.guild.id)
      .map(r => r.toString())
      .join(", ") || "None";

    const embed = new EmbedBuilder()
      .setTitle(`👤 User Info — ${target.tag}`)
      .setColor(0x5865F2)
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: "User ID", value: target.id, inline: true },
        { name: "Bot?", value: target.bot ? "Yes" : "No", inline: true },
        { name: "Account Created", value: `<t:${Math.floor(target.createdTimestamp / 1000)}:F>`, inline: false },
        { name: "Joined Server", value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`, inline: false },
        { name: "Highest Role", value: member.roles.highest.toString(), inline: true },
        { name: "Boosting?", value: member.premiumSince ? "Yes" : "No", inline: true },
        { name: "Timed Out?", value: member.communicationDisabledUntil ? "Yes" : "No", inline: true },
        { name: "Roles", value: roles.length > 1024 ? "Too many roles to display." : roles }
      )
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`timeout_${target.id}`)
        .setLabel("Timeout")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId(`kick_${target.id}`)
        .setLabel("Kick")
        .setStyle(ButtonStyle.Danger),

      new ButtonBuilder()
        .setCustomId(`ban_${target.id}`)
        .setLabel("Ban")
        .setStyle(ButtonStyle.Danger)
    );

    await interaction.reply({
      embeds: [embed],
      components: [row]
    });
  }
};
