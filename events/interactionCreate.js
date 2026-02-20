const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'interactionCreate',

  async execute(interaction, client) {

    // ======================
    // SLASH COMMAND HANDLER
    // ======================
    if (interaction.isChatInputCommand()) {

      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(error);
        await interaction.reply({
          content: 'There was an error executing this command.',
          ephemeral: true
        });
      }
    }

    // ======================
    // BUTTON HANDLER
    // ======================
    if (interaction.isButton()) {

      const [action, userId] = interaction.customId.split("_");
      if (!userId) return;

      const member = await interaction.guild.members.fetch(userId).catch(() => null);
      if (!member) {
        return interaction.reply({ content: "User not found.", ephemeral: true });
      }

      // Prevent self-action
      if (interaction.user.id === userId) {
        return interaction.reply({
          content: "❌ You cannot moderate yourself.",
          ephemeral: true
        });
      }

      // Role hierarchy check
      if (member.roles.highest.position >= interaction.member.roles.highest.position) {
        return interaction.reply({
          content: "❌ You cannot moderate someone with equal or higher role.",
          ephemeral: true
        });
      }

      try {

        // ======================
        // TIMEOUT
        // ======================
        if (action === "timeout") {

          if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return interaction.reply({
              content: "❌ You need Timeout Members permission.",
              ephemeral: true
            });
          }

          await member.timeout(10 * 60 * 1000, `Timed out by ${interaction.user.tag}`);

          return interaction.reply({
            content: `⏳ ${member.user.tag} has been timed out for 10 minutes.`,
            ephemeral: true
          });
        }

        // ======================
        // KICK
        // ======================
        if (action === "kick") {

          if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
            return interaction.reply({
              content: "❌ You need Kick Members permission.",
              ephemeral: true
            });
          }

          await member.kick(`Kicked by ${interaction.user.tag}`);

          return interaction.reply({
            content: `${member.user.tag} has been kicked.`,
            ephemeral: true
          });
        }

        // ======================
        // BAN
        // ======================
        if (action === "ban") {

          if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            return interaction.reply({
              content: "❌ You need Ban Members permission.",
              ephemeral: true
            });
          }

          await member.ban({ reason: `Banned by ${interaction.user.tag}` });

          return interaction.reply({
            content: `${member.user.tag} has been banned.`,
            ephemeral: true
          });
        }

      } catch (err) {
        console.error(err);
        return interaction.reply({
          content: "❌ Action failed. Check bot role position & permissions.",
          ephemeral: true
        });
      }
    }
  }
};
