// ===== خادم نظام متابعة المتدربات — vllogsraye =====
const express = require('express');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');
const multer = require('multer');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;
// المسار الأساسي — التطبيق يُخدَّم تحت vllogsraye.com/app
const BASE = process.env.BASE_PATH || '/app';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'vlsess',
  keys: [process.env.SESSION_SECRET || 'vllogsraye-change-this-secret-key'],
  maxAge: 30 * 24 * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: 'lax'
}));

// ===== رفع ملفات التمارين (GIF/فيديو/صور) =====
const UPLOAD_DIR = path.join(__dirname, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, Date.now() + '-' + Math.random().toString(36).slice(2, 8) + ext);
  }
});
const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } });
app.use(BASE + '/uploads', express.static(UPLOAD_DIR));
app.use(BASE, express.static(path.join(__dirname, 'public')));

// كل المسارات تحت BASE
const router = express.Router();

// ===== أدوات مساعدة =====
const today = () => new Date().toISOString().slice(0, 10);
function requireAuth(req, res, next) {
  if (!req.session || !req.session.uid) return res.status(401).json({ error: 'unauthorized' });
  next();
}
function requireAdmin(req, res, next) {
  if (!req.session || req.session.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
  next();
}
function requireTrainee(req, res, next) {
  if (!req.session || req.session.role !== 'trainee') return res.status(403).json({ error: 'forbidden' });
  next();
}
function traineeActive(t) {
  if (!t || !t.active) return false;
  return t.end_date >= today();
}
function daysLeft(end) {
  const d = Math.round((new Date(end) - new Date(today())) / 86400000);
  return Math.max(0, d);
}

// ===== المصادقة =====
router.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: 'أدخلي اسم المستخدم وكلمة المرور' });

  const admin = db.prepare('SELECT * FROM admins WHERE username=?').get(username);
  if (admin && bcrypt.compareSync(password, admin.password_hash)) {
    req.session.uid = admin.id; req.session.role = 'admin';
    return res.json({ role: 'admin' });
  }
  const t = db.prepare('SELECT * FROM trainees WHERE username=?').get(username);
  if (t && bcrypt.compareSync(password, t.password_hash)) {
    if (!traineeActive(t)) return res.status(403).json({ message: 'انتهى اشتراكك أو تم إيقافه. تواصلي مع المدربة.' });
    req.session.uid = t.id; req.session.role = 'trainee';
    return res.json({ role: 'trainee' });
  }
  return res.status(401).json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
});

router.get('/api/me', (req, res) => {
  if (!req.session || !req.session.uid) return res.json({ role: null });
  res.json({ role: req.session.role });
});

router.post('/api/logout', (req, res) => { req.session = null; res.json({ ok: true }); });

// ===== الإدارة: لوحة الإحصائيات =====
router.get('/api/admin/stats', requireAuth, requireAdmin, (req, res) => {
  const t = today();
  const total = db.prepare('SELECT COUNT(*) c FROM trainees').get().c;
  const active = db.prepare('SELECT COUNT(*) c FROM trainees WHERE active=1 AND end_date>=?').get(t).c;
  const trainedToday = db.prepare('SELECT COUNT(DISTINCT trainee_id) c FROM workout_logs WHERE log_date=?').get(t).c;
  const recent = db.prepare(`
    SELECT w.created_at, w.weight, w.reps, tr.name AS trainee, e.name AS exercise
    FROM workout_logs w
    JOIN trainees tr ON tr.id = w.trainee_id
    LEFT JOIN exercises e ON e.id = w.exercise_id
    ORDER BY w.id DESC LIMIT 15`).all();
  res.json({ total, active, expired: total - active, trainedToday, recent });
});

// ===== الإدارة: المشتركات =====
router.get('/api/admin/trainees', requireAuth, requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT id,name,username,start_date,end_date,daily_calorie_goal,active FROM trainees ORDER BY id DESC').all();
  const t = today();
  rows.forEach(r => {
    r.days_left = daysLeft(r.end_date);
    r.status = (r.active && r.end_date >= t) ? 'active' : 'expired';
  });
  res.json(rows);
});

router.post('/api/admin/trainees', requireAuth, requireAdmin, (req, res) => {
  const { name, username, password, months, daily_calorie_goal } = req.body;
  if (!name || !username || !password || !months) return res.status(400).json({ message: 'أكملي كل الحقول' });
  if (db.prepare('SELECT id FROM trainees WHERE username=?').get(username))
    return res.status(400).json({ message: 'اسم المستخدم مستخدم مسبقاً' });
  const start = new Date();
  const end = new Date(); end.setMonth(end.getMonth() + parseInt(months));
  const info = db.prepare(`INSERT INTO trainees
    (name,username,password_hash,start_date,end_date,daily_calorie_goal,active,created_at)
    VALUES (?,?,?,?,?,?,1,?)`).run(
    name, username, bcrypt.hashSync(password, 10),
    start.toISOString().slice(0, 10), end.toISOString().slice(0, 10),
    parseInt(daily_calorie_goal) || 2000, new Date().toISOString());
  res.json({ id: info.lastInsertRowid });
});

router.patch('/api/admin/trainees/:id', requireAuth, requireAdmin, (req, res) => {
  const id = req.params.id;
  const t = db.prepare('SELECT * FROM trainees WHERE id=?').get(id);
  if (!t) return res.status(404).json({ message: 'غير موجودة' });
  const { action, months, password, name, daily_calorie_goal } = req.body;
  if (action === 'extend') {
    const base = t.end_date > today() ? new Date(t.end_date) : new Date();
    base.setMonth(base.getMonth() + (parseInt(months) || 1));
    db.prepare('UPDATE trainees SET end_date=?, active=1 WHERE id=?').run(base.toISOString().slice(0, 10), id);
  } else if (action === 'stop') {
    db.prepare('UPDATE trainees SET active=0 WHERE id=?').run(id);
  } else if (action === 'activate') {
    db.prepare('UPDATE trainees SET active=1 WHERE id=?').run(id);
  } else if (action === 'password' && password) {
    db.prepare('UPDATE trainees SET password_hash=? WHERE id=?').run(bcrypt.hashSync(password, 10), id);
  } else if (action === 'edit') {
    db.prepare('UPDATE trainees SET name=COALESCE(?,name), daily_calorie_goal=COALESCE(?,daily_calorie_goal) WHERE id=?')
      .run(name || null, daily_calorie_goal ? parseInt(daily_calorie_goal) : null, id);
  }
  res.json({ ok: true });
});

router.delete('/api/admin/trainees/:id', requireAuth, requireAdmin, (req, res) => {
  const id = req.params.id;
  db.prepare('DELETE FROM workout_logs WHERE trainee_id=?').run(id);
  db.prepare('DELETE FROM calorie_logs WHERE trainee_id=?').run(id);
  db.prepare('SELECT id FROM plan_days WHERE trainee_id=?').all(id)
    .forEach(d => db.prepare('DELETE FROM plan_exercises WHERE plan_day_id=?').run(d.id));
  db.prepare('DELETE FROM plan_days WHERE trainee_id=?').run(id);
  db.prepare('DELETE FROM trainees WHERE id=?').run(id);
  res.json({ ok: true });
});

// ===== الإدارة: مكتبة التمارين =====
router.get('/api/admin/exercises', requireAuth, requireAdmin, (req, res) => {
  res.json(db.prepare('SELECT * FROM exercises ORDER BY name').all());
});

router.post('/api/admin/exercises', requireAuth, requireAdmin, upload.single('media'), (req, res) => {
  const { name, target_muscle, media_url, notes } = req.body;
  if (!name) return res.status(400).json({ message: 'اكتبي اسم التمرين' });
  let media = media_url || '';
  if (req.file) media = BASE + '/uploads/' + req.file.filename;
  const info = db.prepare('INSERT INTO exercises (name,target_muscle,media_url,notes) VALUES (?,?,?,?)')
    .run(name, target_muscle || '', media, notes || '');
  res.json({ id: info.lastInsertRowid });
});

router.delete('/api/admin/exercises/:id', requireAuth, requireAdmin, (req, res) => {
  db.prepare('DELETE FROM exercises WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// ===== الإدارة: جدول المشتركة =====
router.get('/api/admin/trainees/:id/plan', requireAuth, requireAdmin, (req, res) => {
  const days = db.prepare('SELECT * FROM plan_days WHERE trainee_id=? ORDER BY day_index').all(req.params.id);
  days.forEach(d => {
    d.exercises = db.prepare(`SELECT pe.*, e.name, e.target_muscle, e.media_url
      FROM plan_exercises pe JOIN exercises e ON e.id=pe.exercise_id
      WHERE pe.plan_day_id=? ORDER BY pe.order_index`).all(d.id);
  });
  res.json(days);
});

router.post('/api/admin/trainees/:id/days', requireAuth, requireAdmin, (req, res) => {
  const { day_index, title, goal } = req.body;
  const info = db.prepare('INSERT INTO plan_days (trainee_id,day_index,title,goal) VALUES (?,?,?,?)')
    .run(req.params.id, parseInt(day_index) || 1, title || '', goal || '');
  res.json({ id: info.lastInsertRowid });
});

router.delete('/api/admin/days/:id', requireAuth, requireAdmin, (req, res) => {
  db.prepare('DELETE FROM plan_exercises WHERE plan_day_id=?').run(req.params.id);
  db.prepare('DELETE FROM plan_days WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

router.post('/api/admin/days/:dayId/exercises', requireAuth, requireAdmin, (req, res) => {
  const { exercise_id, sets, reps, target_weight } = req.body;
  if (!exercise_id) return res.status(400).json({ message: 'اختاري تمريناً' });
  const max = db.prepare('SELECT COALESCE(MAX(order_index),0) m FROM plan_exercises WHERE plan_day_id=?').get(req.params.dayId).m;
  const info = db.prepare('INSERT INTO plan_exercises (plan_day_id,exercise_id,sets,reps,target_weight,order_index) VALUES (?,?,?,?,?,?)')
    .run(req.params.dayId, exercise_id, parseInt(sets) || 3, reps || '8-12', target_weight || '', max + 1);
  res.json({ id: info.lastInsertRowid });
});

router.delete('/api/admin/plan-exercises/:id', requireAuth, requireAdmin, (req, res) => {
  db.prepare('DELETE FROM plan_exercises WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// ===== الإدارة: تقرير المشتركة =====
router.get('/api/admin/trainees/:id/report', requireAuth, requireAdmin, (req, res) => {
  const id = req.params.id;
  const trainee = db.prepare('SELECT id,name,username,start_date,end_date,daily_calorie_goal,active FROM trainees WHERE id=?').get(id);
  if (!trainee) return res.status(404).json({ message: 'غير موجودة' });
  trainee.days_left = daysLeft(trainee.end_date);
  const logs = db.prepare(`SELECT log_date, COUNT(*) sets, COUNT(DISTINCT exercise_id) exercises
    FROM workout_logs WHERE trainee_id=? GROUP BY log_date ORDER BY log_date DESC LIMIT 30`).all(id);
  const totalSets = db.prepare('SELECT COUNT(*) c FROM workout_logs WHERE trainee_id=?').get(id).c;
  const lastWorkout = db.prepare('SELECT MAX(log_date) d FROM workout_logs WHERE trainee_id=?').get(id).d;
  const cals = db.prepare(`SELECT log_date, SUM(calories) calories, SUM(protein) protein
    FROM calorie_logs WHERE trainee_id=? GROUP BY log_date ORDER BY log_date DESC LIMIT 30`).all(id);
  const recentSets = db.prepare(`SELECT w.log_date, w.set_number, w.weight, w.reps, e.name exercise
    FROM workout_logs w LEFT JOIN exercises e ON e.id=w.exercise_id
    WHERE w.trainee_id=? ORDER BY w.id DESC LIMIT 60`).all(id);
  res.json({ trainee, logs, totalSets, lastWorkout, cals, recentSets });
});

// ===== الإدارة: تغيير كلمة المرور =====
router.post('/api/admin/password', requireAuth, requireAdmin, (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) return res.status(400).json({ message: 'كلمة المرور 6 أحرف على الأقل' });
  db.prepare('UPDATE admins SET password_hash=? WHERE id=?').run(bcrypt.hashSync(password, 10), req.session.uid);
  res.json({ ok: true });
});

// ===== المتدربة =====
router.get('/api/trainee/home', requireAuth, requireTrainee, (req, res) => {
  const t = db.prepare('SELECT * FROM trainees WHERE id=?').get(req.session.uid);
  if (!traineeActive(t)) { req.session = null; return res.status(403).json({ error: 'expired' }); }
  const cal = db.prepare('SELECT COALESCE(SUM(calories),0) c, COALESCE(SUM(protein),0) p FROM calorie_logs WHERE trainee_id=? AND log_date=?').get(t.id, today());
  const setsToday = db.prepare('SELECT COUNT(*) c FROM workout_logs WHERE trainee_id=? AND log_date=?').get(t.id, today()).c;
  const daysCount = db.prepare('SELECT COUNT(*) c FROM plan_days WHERE trainee_id=?').get(t.id).c;
  res.json({
    name: t.name, daysLeft: daysLeft(t.end_date), endDate: t.end_date,
    calorieGoal: t.daily_calorie_goal, caloriesToday: cal.c, proteinToday: Math.round(cal.p),
    setsToday, hasPlan: daysCount > 0
  });
});

router.get('/api/trainee/plan', requireAuth, requireTrainee, (req, res) => {
  const days = db.prepare('SELECT * FROM plan_days WHERE trainee_id=? ORDER BY day_index').all(req.session.uid);
  days.forEach(d => {
    d.exercises = db.prepare(`SELECT pe.*, e.name, e.target_muscle, e.media_url, e.notes
      FROM plan_exercises pe JOIN exercises e ON e.id=pe.exercise_id
      WHERE pe.plan_day_id=? ORDER BY pe.order_index`).all(d.id);
  });
  res.json(days);
});

router.post('/api/trainee/log', requireAuth, requireTrainee, (req, res) => {
  const { plan_exercise_id, exercise_id, set_number, weight, reps } = req.body;
  db.prepare(`INSERT INTO workout_logs (trainee_id,plan_exercise_id,exercise_id,log_date,set_number,weight,reps,created_at)
    VALUES (?,?,?,?,?,?,?,?)`).run(
    req.session.uid, plan_exercise_id || null, exercise_id || null, today(),
    parseInt(set_number) || 1, parseFloat(weight) || 0, parseInt(reps) || 0, new Date().toISOString());
  res.json({ ok: true });
});

router.get('/api/trainee/logs', requireAuth, requireTrainee, (req, res) => {
  const date = req.query.date || today();
  res.json(db.prepare('SELECT * FROM workout_logs WHERE trainee_id=? AND log_date=? ORDER BY id').all(req.session.uid, date));
});

router.post('/api/trainee/calories', requireAuth, requireTrainee, (req, res) => {
  const { meal_name, calories, protein, carbs, fat } = req.body;
  db.prepare(`INSERT INTO calorie_logs (trainee_id,log_date,meal_name,calories,protein,carbs,fat,created_at)
    VALUES (?,?,?,?,?,?,?,?)`).run(
    req.session.uid, today(), meal_name || 'وجبة',
    parseInt(calories) || 0, parseFloat(protein) || 0, parseFloat(carbs) || 0, parseFloat(fat) || 0, new Date().toISOString());
  res.json({ ok: true });
});

router.get('/api/trainee/calories', requireAuth, requireTrainee, (req, res) => {
  const date = req.query.date || today();
  res.json(db.prepare('SELECT * FROM calorie_logs WHERE trainee_id=? AND log_date=? ORDER BY id').all(req.session.uid, date));
});

router.delete('/api/trainee/calories/:id', requireAuth, requireTrainee, (req, res) => {
  db.prepare('DELETE FROM calorie_logs WHERE id=? AND trainee_id=?').run(req.params.id, req.session.uid);
  res.json({ ok: true });
});

router.get('/api/trainee/progress', requireAuth, requireTrainee, (req, res) => {
  const days = db.prepare(`SELECT log_date, COUNT(*) sets FROM workout_logs WHERE trainee_id=?
    GROUP BY log_date ORDER BY log_date DESC LIMIT 14`).all(req.session.uid);
  const cals = db.prepare(`SELECT log_date, SUM(calories) calories FROM calorie_logs WHERE trainee_id=?
    GROUP BY log_date ORDER BY log_date DESC LIMIT 14`).all(req.session.uid);
  res.json({ days, cals });
});

app.use(BASE, router);
// توجيه الجذر إلى التطبيق (احتياطي عند فتح المنفذ مباشرة)
app.get('/', (req, res) => res.redirect(BASE + '/'));

app.listen(PORT, () => console.log(`🚀 نظام vllogsraye يعمل على المنفذ ${PORT} تحت المسار ${BASE}`));
