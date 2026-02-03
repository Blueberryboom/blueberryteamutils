const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// ===== CONFIG =====
const logChannelId = "1468013210446594280";

// ===== PERMISSIONS =====
const allowedRoleIds = [
  "1468294909420240917", // Blueberry Overlord
  "1468294685452927059", // Administrator
  "1468292177397285037",  // Senior Moderator
  "1468294094403928348" // Event Team
];
// ==================

const goalFile = path.join(__dirname, '../memberGoal.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setgoal')
    .setDescription('Set member goal')
    .addIntegerOption(o =>
      o.setName('amount')
       .setDescription('Member target')
       .setRequired(true)
    ),

  async execute(interaction) {

    // ===== ROLE GATE =====
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
    // =====================

    const amount = interaction.options.getInteger('amount');

    fs.writeFileSync(goalFile, JSON.stringify({
      goal: amount,
      setBy: interaction.user.tag,
      time: Date.now()
    }, null, 2));

    await interaction.reply({
      content: `✅ Member goal set to **${amount}**`,
      ephemeral: true
    });

    // ---- LOG ----
    const log = interaction.guild.channels.cache.get(logChannelId);
    if (log) {
      log.send(
`🎯 **Member Goal Updated**  
👤 By: ${interaction.user.tag}  
🎯 Goal: ${amount}`
      );
    }

  }
};
