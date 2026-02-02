const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, '../modapps.json');

// ===================== CONFIG =====================

// CHANNEL IDS where the bot is allowed to respond
const allowedChannels = [
  "1455310485363757338",   // general
];

// Channel where staff logs should go (set to null to disable)
const staffLogChannel = "1468013210446594280";

// Cooldown per user (5 minutes)
const COOLDOWN = 5 * 60 * 1000;

// ==================================================

const cooldowns = new Map();

function loadData() {
  if (!fs.existsSync(dataFile)) {
    return {
      open: false,
      message: "Moderator applications are currently CLOSED."
    };
  }

  return JSON.parse(fs.readFileSync(dataFile));
}

// Phrases that trigger the response
const triggers = [
  "can i be mod",
  "can i get mod",
  "how to be mod",
  "how do i get mod",
  "mod apps",
  "mod applications",
  "apply for mod",
  "be staff",
  "get staff"
];

module.exports = {
  name: 'messageCreate',

  async execute(message) {
    // Ignore bots
    if (message.author.bot) return;

    // ----- CHANNEL WHITELIST (ID BASED) -----
    if (!allowedChannels.includes(message.channel.id)) return;

    const content = message.content.toLowerCase();

    // Check if message matches any trigger
    if (!triggers.some(t => content.includes(t))) return;

    // ----- COOLDOWN CHECK -----
    const last = cooldowns.get(message.author.id);
    const now = Date.now();

    if (last && now - last < COOLDOWN) return;

    cooldowns.set(message.author.id, now);

    const data = loadData();

    const reply =
`🛡 **Moderator Applications**

${data.message}

👉 Use **/modapps** to check anytime.`;

    await message.reply(reply);

    // ----- OPTIONAL STAFF LOG -----
    if (staffLogChannel) {
      const logChannel =
        message.guild.channels.cache.get(staffLogChannel);

      if (logChannel) {
        logChannel.send(
`👤 **${message.author.tag}** asked about mod apps  
📍 Channel: <#${message.channel.id}>  
💬 Message: "${message.content}"`
        );
      }
    }
  }
};
