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
  weight_kg REAL,
  height_cm REAL,
  age INTEGER,
  gender TEXT DEFAULT 'female',
  activity_level TEXT DEFAULT 'moderate',
  deficit_pct REAL DEFAULT 0,
  active INTEGER DEFAULT 1,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT
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

// ترقية قواعد بيانات قديمة (أُنشئت قبل إضافة أعمدة حاسبة السعرات)
const traineeCols = db.prepare("PRAGMA table_info(trainees)").all().map(c => c.name);
function addColIfMissing(name, def) {
  if (!traineeCols.includes(name)) db.exec(`ALTER TABLE trainees ADD COLUMN ${name} ${def}`);
}
addColIfMissing('weight_kg', 'REAL');
addColIfMissing('height_cm', 'REAL');
addColIfMissing('age', 'INTEGER');
addColIfMissing('gender', "TEXT DEFAULT 'female'");
addColIfMissing('activity_level', "TEXT DEFAULT 'moderate'");
addColIfMissing('deficit_pct', 'REAL DEFAULT 0');

// ===== زرع مكتبة تمارين كاملة (مرة واحدة فقط) =====
const EXERCISE_LIBRARY = [
  // غلوتس
  { name: 'هيب ثرست', target_muscle: 'غلوتس', notes: 'ضعي الكتفين على بنش والقدمين على الأرض، ادفعي الحوض للأعلى حتى الاستقامة الكاملة مع شد الغلوتس في القمة.' },
  { name: 'دونكي كيك', target_muscle: 'غلوتس', notes: 'على أربع، ارفعي قدم واحدة للخلف والأعلى مع ثني الركبة 90 درجة دون تحريك الظهر.' },
  { name: 'غلوت بريدج', target_muscle: 'غلوتس', notes: 'استلقي على الظهر والركبتين مثنيتين، ادفعي الحوض للأعلى مع شد الغلوتس.' },
  { name: 'كيك باك بالكيبل', target_muscle: 'غلوتس', notes: 'اربطي الكيبل بالكاحل وادفعي الرجل للخلف بثبات مع تثبيت الجذع.' },
  { name: 'سكوات سومو', target_muscle: 'غلوتس وأرجل', notes: 'وقفة عريضة وأصابع القدم للخارج، انزلي للأسفل مع إبقاء الظهر مستقيم.' },
  { name: 'ديدليفت مستقيم الأرجل', target_muscle: 'غلوتس وهامسترينغ', notes: 'انزلي بالوزن مع انحناء بسيط بالركبة والتركيز على شد الخلف.' },
  { name: 'سكوات خلفي (باربل)', target_muscle: 'غلوتس وأرجل', notes: 'البار على الكتفين، انزلي حتى يصبح الفخذ موازياً للأرض مع ثبات الجذع.' },
  { name: 'فاير هايدرنت', target_muscle: 'غلوتس', notes: 'على أربع، ارفعي الركبة للجانب مع إبقائها مثنية 90 درجة.' },
  // أرجل
  { name: 'سكوات', target_muscle: 'أرجل', notes: 'القدمين بعرض الكتفين، انزلي مع إبقاء الركبة فوق القدم والظهر مستقيم.' },
  { name: 'لانجز', target_muscle: 'أرجل', notes: 'خطوة للأمام وانزلي حتى تصل الركبة الخلفية قرب الأرض، بالتبادل.' },
  { name: 'ليغ بريس', target_muscle: 'أرجل', notes: 'ادفعي اللوح بالقدمين مع تجنب قفل الركبة بالكامل في النهاية.' },
  { name: 'ليغ إكستنشن', target_muscle: 'كوادريسبس', notes: 'افردي الركبتين ببطء مع شد عضلة الفخذ الأمامية بالقمة.' },
  { name: 'ليغ كيرل', target_muscle: 'هامسترينغ', notes: 'اثني الركبتين ساحبة الوزن نحو المؤخرة دون رفع الحوض.' },
  { name: 'سبليت سكوات بلغاري', target_muscle: 'أرجل وغلوتس', notes: 'ضعي القدم الخلفية مرتفعة وانزلي بالرجل الأمامية حتى زاوية 90 درجة.' },
  { name: 'رفع الكعبين (كاف ريز)', target_muscle: 'السمانة', notes: 'ارتفعي على أطراف الأصابع ببطء ثم انزلي بتحكم.' },
  { name: 'ستيب أب', target_muscle: 'أرجل', notes: 'اصعدي على منصة مرتفعة برجل واحدة مع دفع كامل من الكعب.' },
  // ظهر
  { name: 'لات بُل داون', target_muscle: 'ظهر', notes: 'اسحبي البار نحو أعلى الصدر مع شد لوحي الكتف للخلف.' },
  { name: 'سحب جالس (سيتد رو)', target_muscle: 'ظهر', notes: 'اسحبي المقبض نحو البطن مع إبقاء الظهر مستقيماً.' },
  { name: 'تجديف منحني (بنت أوفر رو)', target_muscle: 'ظهر', notes: 'انحني للأمام مع استقامة الظهر واسحبي الوزن نحو البطن.' },
  { name: 'ديدليفت', target_muscle: 'ظهر وغلوتس', notes: 'ارفعي الوزن من الأرض بظهر مستقيم ودفع من الكعبين.' },
  { name: 'عقلة بمساعدة (بُل أب)', target_muscle: 'ظهر', notes: 'اسحبي جسمك للأعلى حتى يصل الذقن فوق البار، استخدمي مساعدة عند الحاجة.' },
  { name: 'سوبرمان', target_muscle: 'أسفل الظهر', notes: 'استلقي على البطن وارفعي الذراعين والرجلين معاً ببطء.' },
  { name: 'فيس بُل', target_muscle: 'ظهر وأكتاف', notes: 'اسحبي الحبل نحو الوجه مع فتح المرفقين للخارج.' },
  { name: 'تجديف بدمبل بيد واحدة', target_muscle: 'ظهر', notes: 'اسندي ركبة ويد على بنش واسحبي الدمبل نحو الخصر.' },
  // يدين وأكتاف
  { name: 'بايسبس كيرل', target_muscle: 'بايسبس', notes: 'ارفعي الدمبل نحو الكتف مع تثبيت المرفق بجانب الجسم.' },
  { name: 'ترايسبس بُش داون', target_muscle: 'ترايسبس', notes: 'ادفعي الحبل للأسفل مع تثبيت المرفقين قريبين من الجسم.' },
  { name: 'هامر كيرل', target_muscle: 'بايسبس وساعد', notes: 'مثل البايسبس كيرل لكن بقبضة محايدة (الإبهام للأعلى).' },
  { name: 'ترايسبس إكستنشن خلف الرأس', target_muscle: 'ترايسبس', notes: 'أنزلي الدمبل خلف الرأس ثم افردي الذراعين للأعلى.' },
  { name: 'شولدر بريس', target_muscle: 'أكتاف', notes: 'ادفعي الدمبل أو البار للأعلى من مستوى الكتف حتى فرد الذراعين.' },
  { name: 'رفرفة جانبية (لاترال ريز)', target_muscle: 'أكتاف', notes: 'ارفعي الدمبل للجانبين حتى مستوى الكتف دون هز الجسم.' },
  { name: 'بنش بريس بالدمبل', target_muscle: 'صدر وترايسبس', notes: 'ادفعي الدمبل للأعلى من مستوى الصدر وهي مستلقية على بنش.' },
  { name: 'ضغط (بوش أب)', target_muscle: 'صدر وترايسبس وأكتاف', notes: 'انزلي بالجسم مستقيم حتى يقترب الصدر من الأرض ثم ادفعي للأعلى.' },
  // كور
  { name: 'بلانك', target_muscle: 'كور', notes: 'ثبّتي الجسم على الساعدين وأطراف الأصابع بخط مستقيم لأطول مدة ممكنة.' },
  { name: 'كرنش', target_muscle: 'بطن', notes: 'ارفعي الجزء العلوي من الجسم نحو الركبتين مع شد البطن.' },
  { name: 'رفع الأرجل معلق', target_muscle: 'أسفل البطن', notes: 'وأنتِ معلقة، ارفعي الرجلين المستقيمتين حتى مستوى الحوض.' },
  { name: 'روسيان تويست', target_muscle: 'الخصر والبطن الجانبي', notes: 'اجلسي مائلة قليلاً للخلف ولفّي الجذع يمين ويسار.' },
  { name: 'ماونتن كلايمر', target_muscle: 'كور', notes: 'من وضعية بلانك، اجلبي الركبتين للصدر بالتبادل وبسرعة.' },
  { name: 'بلانك جانبي', target_muscle: 'الخصر الجانبي', notes: 'استلقي على جانب واحد وارفعي الحوض بثبات الساعد.' },
  { name: 'بايسكل كرنش', target_muscle: 'بطن وخصر', notes: 'لفّي المرفق نحو الركبة المعاكسة بحركة دواسة الدراجة.' },
  { name: 'ديد باغ', target_muscle: 'كور', notes: 'استلقي على الظهر وافردي ذراع ورجل معاكسة ببطء مع إبقاء الظهر ملاصق للأرض.' },
];

const seeded = db.prepare("SELECT value FROM meta WHERE key='exercises_seeded'").get();
if (!seeded) {
  const insertEx = db.prepare('INSERT INTO exercises (name,target_muscle,media_url,notes) VALUES (?,?,?,?)');
  const seedAll = db.transaction(() => {
    EXERCISE_LIBRARY.forEach(e => insertEx.run(e.name, e.target_muscle, '', e.notes));
    db.prepare("INSERT INTO meta (key,value) VALUES ('exercises_seeded','1')").run();
  });
  seedAll();
  console.log(`✅ تم زرع مكتبة تمارين جاهزة (${EXERCISE_LIBRARY.length} تمرين) — تقدرين تضيفين GIF/فيديو لأي تمرين من لوحة الإدارة.`);
}

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
