CREATE TABLE IF NOT EXISTS tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id VARCHAR(10),
  user_id VARCHAR(32),
  username VARCHAR(64),

  type ENUM('partner','creator','mod','other'),

  channel_id VARCHAR(32),

  status ENUM('open','claimed','closed') DEFAULT 'open',

  claimed_by VARCHAR(32) NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP NULL,

  close_reason TEXT NULL
);

CREATE TABLE IF NOT EXISTS ticket_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id VARCHAR(10),

  action ENUM('claim','close','user_add'),

  staff_id VARCHAR(32),
  staff_name VARCHAR(64),

  extra TEXT NULL,

  time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS member_goals (
  id INT AUTO_INCREMENT PRIMARY KEY,

  goal INT NOT NULL,

  set_by VARCHAR(64),
  set_by_id VARCHAR(32),

  time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  
);
