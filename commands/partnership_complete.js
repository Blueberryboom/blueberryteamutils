const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

// ===== CONFIG =====
const allowedRoleIds = [
  "1468294909420240917", // Blueberry Overlord
  "1468294685452927059", // Administrator
  "1468292177397285037", // Senior Moderator
  "1468294094403928348", // Event Team
  "1455544392415842500", // Trial Mod
  "1468294406363680800"  // Moderator
];

const partnerRoleId = "1468302227075498105";        // @Partner
const eventPermsRoleId = "1470443565418025091";     // @Event Request Perms

const logChannelId = "1468013210446594280";         // management-logs
const partnershipsChannelId = "1459595084663099609"; // public showcase
// ==================

module.exports = {
  data: new SlashCommandBuilder()
    .setName('partnership_complete')
    .setDescription('Finish a partnership and announce it')

    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('Partner user')
        .setRequired(true)
    )

    .addStringOption(option =>
      option
        .setName('server_name')
        .setDescription('Name of their server')
        .setRequired(true)
    )

    .addBooleanOption(option =>
      option
        .setName('rules_shown')
        .setDescription('Have you shown them partner guidelines?')
        .setRequired(true)
    )

    .addBooleanOption(option =>
      option
        .setName('ad_sent')
        .setDescription('Has the AD been posted in BOTH our server and theirs?')
        .setRequired(true)
    ),

  async execute(interaction) {

    // ===== ACK IMMEDIATELY TO AVOID UNKNOWN INTERACTION =====
    await interaction.deferReply({ flags: 64 });

    // ----- ROLE CHECK -----
    const hasRole = allowedRoleIds.some(id =>
      interaction.member.roles.cache.has(id)
    );

    if (!hasRole) {
      return interaction.editReply({
        content: "❌ You don't have permission to use this command."
      });
    }

    // =========================================================
    // CORRECT MEMBER RESOLVING (FIX FOR NUMBER MENTION BUG)
    // =========================================================

    const member =
      interaction.options.getMember('user') ||
      await interaction.guild.members.fetch(
        interaction.options.getUser('user').id
      ).catch(() => null);

    const user = interaction.options.getUser('user');

    if (!member) {
      return interaction.editReply({
        content: "❌ User not in server or could not be resolved!"
      });
    }

    const serverName = interaction.options.getString('server_name');
    const rulesShown = interaction.options.getBoolean('rules_shown');
    const adSent = interaction.options.getBoolean('ad_sent');

    if (!rulesShown) {
      return interaction.editReply({
        content: "❌ You must confirm you showed them the partner guidelines!"
      });
    }

    if (!adSent) {
      return interaction.editReply({
        content: "❌ You must confirm OUR advert was posted in their server!"
      });
    }

    if (member.roles.cache.has(partnerRoleId)) {
      return interaction.editReply({
        content: "⚠️ User already has Partner role!"
      });
    }

    // ----- ADD ROLES (BOTH) -----
    try {
      await member.roles.add([
        partnerRoleId,
        eventPermsRoleId
      ]);
    } catch (err) {
      console.error("Role add failed:", err);
      return interaction.editReply({
        content: "❌ Failed to add roles — check bot role position & permissions."
      });
    }

    // =========================================================
    // ----- PUBLIC ANNOUNCEMENT (FIXED MENTIONS) -----
    // =========================================================

    const announce =
      interaction.guild.channels.cache.get(partnershipsChannelId);

    if (announce) {

      const embed = new EmbedBuilder()
        .setTitle(`<:312668partner:1470082523026686219> Partnership with ${serverName}`)
        .setColor(0x5865F2)

        .addFields(

          {
            name: "<:990644moderatorroleicon:1470566354196369491> Server Owner/Admin",
            value: `<@${member.id}>`,   // ✅ GUILD RESOLVED MENTION
            inline: false
          },

          {
            name: "<:3169blurpleverified1:1470050180601479178> Authorized By (Staff)",
            value: `<@${interaction.member.id}>`, // ✅ ALSO RESOLVED
            inline: false
          },

          {
            name: "<:312668partner:1470082523026686219> Info",
            value:
              "Want your server to be partnered with us? " +
              "Send us a ticket in <#1456400359798083789>",
            inline: false
          }
        )

        .setThumbnail(user.displayAvatarURL())
        .setTimestamp();

      announce.send({ embeds: [embed] });
    }

    // ----- DM TO PARTNER -----
    try {
      const dm = new EmbedBuilder()
        .setTitle("<:312668partner:1470082523026686219> Partnership Confirmed!")
        .setColor(0x57F287)
        .setDescription(
`Hi ${user.username}!

Your server **${serverName}** is now officially partnered with us and you now have the **Partner** role in our server!

Use **/network_planevent** to ask to host an event on our Minecraft network for free!

Please ensure you follow our partnership guidelines as agreed.

Need anything? Open a ticket anytime! :)

Thanks — **The Blueberry Team Management**`
        )
        .setTimestamp();

      await user.send({ embeds: [dm] });
    } catch (err) {
      // DM closed – ignore
    }

    // ----- LOGGING -----
    const log =
      interaction.guild.channels.cache.get(logChannelId);

    if (log) {

      const logEmbed = new EmbedBuilder()
        .setTitle("<:312668partner:1470082523026686219> Partnership Completed")
        .setColor(0x5865F2)

        .addFields(
          { name: "Partner", value: user.tag, inline: true },
          { name: "Server", value: serverName, inline: true },
          { name: "Rules Shown", value: rulesShown ? "Yes" : "No", inline: true },
          { name: "Our Ad Sent", value: adSent ? "Yes" : "No", inline: true },
          { name: "Authorized By", value: interaction.user.tag, inline: true },
          { name: "Roles Added", value: "Partner + Event Perms", inline: true }
        )

        .setTimestamp();

      log.send({ embeds: [logEmbed] });
    }

    // ----- FINAL RESPONSE -----
    await interaction.editReply({
      content: `✅ Partnership completed with **${serverName}** and roles assigned!`
    });
  }
};
