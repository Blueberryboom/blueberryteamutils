const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, '../modapps.json');

function saveData(data) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

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
    )

    // 🔒 ONLY MODS CAN USE
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const status = interaction.options.getString('status');
    const message = interaction.options.getString('message');

    const data = {
      open: status === 'open',
      message: message
    };

    saveData(data);

    await interaction.reply({
      content: `✅ Moderator applications set to **${status.toUpperCase()}**`,
      ephemeral: true
    });
  }
};
