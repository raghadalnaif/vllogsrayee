// ===== قاعدة البيانات (SQLite) =====
const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const db = new Database(path.join(__dirname, 'data.db'));
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS trainees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  daily_calorie_goal INTEGER DEFAULT 2000,
  active INTEGER DEFAULT 1,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS exercises (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  target_muscle TEXT DEFAULT '',
  media_url TEXT DEFAULT '',
  notes TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS plan_days (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trainee_id INTEGER NOT NULL,
  day_index INTEGER DEFAULT 1,
  title TEXT DEFAULT '',
  goal TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS plan_exercises (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_day_id INTEGER NOT NULL,
  exercise_id INTEGER NOT NULL,
  sets INTEGER DEFAULT 3,
  reps TEXT DEFAULT '8-12',
  target_weight TEXT DEFAULT '',
  order_index INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS workout_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trainee_id INTEGER NOT NULL,
  plan_exercise_id INTEGER,
  exercise_id INTEGER,
  log_date TEXT NOT NULL,
  set_number INTEGER DEFAULT 1,
  weight REAL DEFAULT 0,
  reps INTEGER DEFAULT 0,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS calorie_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trainee_id INTEGER NOT NULL,
  log_date TEXT NOT NULL,
  meal_name TEXT DEFAULT 'وجبة',
  calories INTEGER DEFAULT 0,
  protein REAL DEFAULT 0,
  carbs REAL DEFAULT 0,
  fat REAL DEFAULT 0,
  created_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_wl_trainee_date ON workout_logs(trainee_id, log_date);
CREATE INDEX IF NOT EXISTS idx_cl_trainee_date ON calorie_logs(trainee_id, log_date);
`);

// إنشاء حساب إدارة افتراضي عند أول تشغيل
const adminCount = db.prepare('SELECT COUNT(*) c FROM admins').get().c;
if (adminCount === 0) {
  const user = process.env.ADMIN_USER || 'vllogsraye';
  const pass = process.env.ADMIN_PASS || 'vllogs2025';
  db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)')
    .run(user, bcrypt.hashSync(pass, 10));
  console.log(`✅ تم إنشاء حساب الإدارة الافتراضي — المستخدم: ${user} / كلمة المرور: ${pass} (غيّريها من الإعدادات)`);
}

module.exports = db;
