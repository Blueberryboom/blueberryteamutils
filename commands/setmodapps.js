const { SlashCommandBuilder } = require('discord.js');
const db = require('../database/db');

// ===== CONFIG =====
const logChannelId = "1468013210446594280";

// ===== PERMISSIONS =====
const allowedRoleIds = [
  "1468294909420240917", // Blueberry Overlord
  "1468294685452927059", // Administrator
  "1468292177397285037" // Senior Moderator 
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setmodapps')
    .setDescription('Set whether moderator applications are open or closed')

    .addStringOption(option =>
      option
        .setName('status')
        .setDescription('Open or closed')
        .setRequired(true)
        .addChoices(
          { name: 'Open', value: 'open' },
          { name: 'Closed', value: 'closed' }
        )
    )

    .addStringOption(option =>
      option
        .setName('message')
        .setDescription('Custom message to show')
        .setRequired(true)
    ),

  async execute(interaction) {

    // ===== ROLE GATE =====
    const hasRole = allowedRoleIds.some(id =>
      interaction.member.roles.cache.has(id)
    );

    if (!hasRole) {
      return interaction.reply({
        content: "❌ You don't have permission to use this command.",
        ephemeral: true
      });
    }

    const status = interaction.options.getString('status');
    const message = interaction.options.getString('message');

    // ===== SAVE TO DATABASE =====
    await db.query(`
      UPDATE mod_applications
      SET
        open = ?,
        message = ?,
        set_by = ?,
        time = ?
      WHERE id = 1
    `, [
      status === 'open',
      message,
      interaction.user.tag,
      Date.now()
    ]);

    await interaction.reply({
      content: `✅ Moderator applications set to **${status.toUpperCase()}**`,
      ephemeral: true
    });

    // ---- LOG ----
    const log = interaction.guild.channels.cache.get(logChannelId);

    if (log) {
      log.send(
`🎉 **Mod Applications Updated**
👤 By: ${interaction.user.tag}  
📌 Status: **${status.toUpperCase()}**
📝 Message:
> ${message}`
      );

    }
  }
};
