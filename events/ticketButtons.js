const { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle 
} = require('discord.js');

const db = require('../database/db');
const config = require('../config/tickets');

module.exports = {
  name: 'interactionCreate',

  async execute(interaction) {
    if (!interaction.isButton()) return;

    const id = interaction.customId;

    if (![
      'ticket_claim',
      'ticket_close',
      'ticket_closereason',
      'ticket_close_confirm',
      'ticket_close_cancel'
    ].includes(id)) return;

    const [rows] = await db.query(
      "SELECT * FROM tickets WHERE channel_id = ?",
      [interaction.channel.id]
    );

    const ticket = Array.isArray(rows) ? rows[0] : null;

    if (!ticket) {
      return interaction.reply({
        content: "❌ Ticket not found in database.",
        ephemeral: true
      });
    }

    if (id === 'ticket_claim')
      return claimTicket(interaction, ticket);

    if (id === 'ticket_close')
      return askCloseConfirm(interaction, ticket);

    if (id === 'ticket_closereason')
      return askReason(interaction, ticket);

    if (id === 'ticket_close_confirm')
      return confirmClose(interaction, ticket, "No reason provided");

    if (id === 'ticket_close_cancel')
      return interaction.update({
        content: "✅ Close cancelled.",
        embeds: [],
        components: []
      });
  }
};

// ================= FUNCTIONS =================

async function claimTicket(interaction, ticket) {

  const isStaff = config.permissions[ticket.type].viewRoles
    .some(id => interaction.member.roles.cache.has(id));

  if (!isStaff) {
    return interaction.reply({
      content: "❌ Only staff can claim tickets.",
      ephemeral: true
    });
  }

  if (ticket.claimed_by) {
    return interaction.reply({
      content: "❌ This ticket is already claimed.",
      ephemeral: true
    });
  }

  await db.query(
    "UPDATE tickets SET claimed_by = ? WHERE id = ?",
    [interaction.user.id, ticket.id]
  );

  await db.query(
    "INSERT INTO ticket_logs (ticket_id, action, moderator, info) VALUES (?, ?, ?, ?)",
    [ticket.id, "CLAIM", interaction.user.id, "Ticket claimed"]
  );

  await interaction.channel.send({
    embeds: [
      new EmbedBuilder()
        .setColor(0x57F287)
        .setDescription(`✅ Ticket claimed by ${interaction.user}`)
    ]
  });

  await interaction.reply({
    content: "You claimed this ticket.",
    ephemeral: true
  });
}

// ------------------------------------------------

async function askCloseConfirm(interaction, ticket) {

  const isStaff = config.permissions[ticket.type].viewRoles
    .some(id => interaction.member.roles.cache.has(id));

  if (!isStaff) {
    return interaction.reply({
      content: "❌ Only staff can close tickets.",
      ephemeral: true
    });
  }

  const embed = new EmbedBuilder()
    .setTitle("⚠ Confirm Ticket Closure")
    .setColor(0xED4245)
    .setDescription(
`Are you sure you want to close this ticket?

• Channel will be **deleted**
• Ticket will be **removed from database**
• This cannot be undone`
    );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_close_confirm')
      .setLabel('Yes, Delete Ticket')
      .setStyle(ButtonStyle.Danger),

    new ButtonBuilder()
      .setCustomId('ticket_close_cancel')
      .setLabel('Cancel')
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.reply({
    embeds: [embed],
    components: [row],
    ephemeral: true
  });
}

// ------------------------------------------------

async function confirmClose(interaction, ticket, reason) {

  // Log the deletion first
  await db.query(
    "INSERT INTO ticket_logs (ticket_id, action, moderator, info) VALUES (?, ?, ?, ?)",
    [ticket.id, "DELETE", interaction.user.id, reason]
  );

  // Remove ticket from main table
  await db.query(
    "DELETE FROM tickets WHERE id = ?",
    [ticket.id]
  );

  // Send to log channel
  const log = interaction.guild.channels.cache.get(config.logChannelId);

  if (log) {
    log.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("🗑 Ticket Deleted")
          .setColor(0xED4245)
          .addFields(
            { name: "Channel", value: interaction.channel.name },
            { name: "By", value: interaction.user.tag },
            { name: "Reason", value: reason }
          )
          .setTimestamp()
      ]
    });
  }

  await interaction.reply({
    content: "🗑 Deleting ticket...",
    ephemeral: true
  });

  // Finally delete channel
  await interaction.channel.delete().catch(() => {});
}

// ------------------------------------------------

async function askReason(interaction, ticket) {

  await interaction.reply({
    content: "Please type the close reason in chat within 60 seconds.",
    ephemeral: true
  });

  const filter = m =>
    m.author.id === interaction.user.id &&
    m.channel.id === interaction.channel.id;

  const collector = interaction.channel.createMessageCollector({
    filter,
    max: 1,
    time: 60000
  });

  collector.on('collect', async msg => {
    await msg.delete().catch(() => {});
    await confirmClose(interaction, ticket, msg.content);
  });

  collector.on('end', c => {
    if (c.size === 0) {
      interaction.followUp({
        content: "❌ Timed out – close cancelled.",
        ephemeral: true
      });
    }
  });
}
