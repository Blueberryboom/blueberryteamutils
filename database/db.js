const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

let pool;

async function init() {

  pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10
  });

  console.log("🫐 MariaDB connected");

  // ----- AUTO TABLE SETUP -----
  const schema = fs.readFileSync(
    path.join(__dirname, 'schema.sql'),
    'utf8'
  );

  await pool.query(schema);

  console.log("🫐 Ticket tables ensured");
}

async function createTicket(data) {

  const ticketId =
    Math.floor(1000 + Math.random() * 9000).toString();

  await pool.query(
`INSERT INTO tickets
(ticket_id, user_id, username, type, channel_id)
VALUES (?, ?, ?, ?, ?)`,
[
  ticketId,
  data.user_id,
  data.username,
  data.type,
  data.channel_id
]);

  return ticketId;
}

async function logAction(ticketId, action, staff, extra = null) {

  await pool.query(
`INSERT INTO ticket_logs
(ticket_id, action, staff_id, staff_name, extra)
VALUES (?, ?, ?, ?, ?)`,
[
  ticketId,
  action,
  staff.id,
  staff.tag,
  extra
]);
}

async function getOpenTicket(userId) {

  const [rows] = await pool.query(
`SELECT * FROM tickets
 WHERE user_id = ?
 AND status != 'closed'`,
[userId]
);

  return rows[0];
}

async function closeTicket(ticketId, reason) {

  await pool.query(
`UPDATE tickets
 SET status='closed',
     closed_at=NOW(),
     close_reason=?
 WHERE ticket_id=?`,
[reason, ticketId]
);
}

async function claimTicket(ticketId, staffId) {

  await pool.query(
`UPDATE tickets
 SET status='claimed',
     claimed_by=?
 WHERE ticket_id=?`,
[staffId, ticketId]
);
}

module.exports = {
  init,
  pool,

  createTicket,
  logAction,

  getOpenTicket,

  closeTicket,
  claimTicket
};
