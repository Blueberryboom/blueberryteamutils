const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('networkinfo')
    .setDescription('Shows information about the Blueberry Network'),

  async execute(interaction) {

    const embed = new EmbedBuilder()
      .setColor(0x5865F2) // you can change to blueberry color like 0x4F46E5
      .setTitle('🫐 Blueberry Network Info')
      .setDescription('A small, friendily minecraft network!')
      .addFields(
        { name: '🎮 Server IP', value: '`play.blueberrynet.uk`', inline: false },
        { name: '> Notice', value: '> Cracked versions of Minecraft are not supported, and we always use the latest version!', inline: true },
        { name: '📊 Status Page', value: 'https://status.blueberrynet.uk', inline: false },
        { name: '🎉 Creator Program', value: 'https://discord.gg/VHmVWHVjyy', inline: false }
      )
      .setFooter({ text: 'BlueberryTeam Utils • Hosted on the Blueberry Network' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
