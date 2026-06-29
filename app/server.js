// ===== خادم نظام متابعة المتدربات — vllogsraye =====
const express = require('express');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');
const multer = require('multer');
const db = require('./db');
const TEMPLATES = require('./templates');

const app = express();
const PORT = process.env.PORT || 3001;

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
app.use('/uploads', express.static(UPLOAD_DIR));
app.use(express.static(path.join(__dirname, 'public')));

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
// حساب الأيام المتبقية للدورة الشهرية + المرحلة الحالية
function cycleInfo(t) {
  if (!t || !t.last_period_date) return null;
  const len = t.cycle_length || 28;
  const now = new Date(today());
  const next = new Date(t.last_period_date);
  next.setDate(next.getDate() + len);
  let daysUntil = Math.round((next - now) / 86400000);
  while (daysUntil < 0) { next.setDate(next.getDate() + len); daysUntil = Math.round((next - now) / 86400000); }
  const dayInCycle = ((len - daysUntil) % len + len) % len; // 0..len-1
  let phase = 'الطور الجريبي', phaseTip = 'طاقتك ترتفع — وقت ممتاز لزيادة الأوزان';
  if (dayInCycle <= 4)         { phase = 'الحيض';        phaseTip = 'اسمعي لجسمك — خففي الحمل إذا احتجتِ'; }
  else if (dayInCycle <= 12)   { phase = 'الطور الجريبي'; phaseTip = 'طاقة عالية — أفضل وقت للتمارين الثقيلة'; }
  else if (dayInCycle <= 16)   { phase = 'التبويض';      phaseTip = 'ذروة قوتك — استغليها وانتبهي للمفاصل'; }
  else                         { phase = 'الطور الجسمي';  phaseTip = 'طبيعي تشعرين بإرهاق — تمارين متوسطة وكارديو خفيف'; }
  return { daysUntil, nextDate: next.toISOString().slice(0, 10), cycleLength: len, lastDate: t.last_period_date, phase, phaseTip };
}

// ===== المصادقة =====
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: 'أدخلي اسم المستخدم وكلمة المرور' });

  const admin = db.prepare('SELECT * FROM admins WHERE LOWER(username)=LOWER(?)').get(username);
  if (admin && bcrypt.compareSync(password, admin.password_hash)) {
    req.session.uid = admin.id; req.session.role = 'admin';
    return res.json({ role: 'admin' });
  }
  const t = db.prepare('SELECT * FROM trainees WHERE LOWER(username)=LOWER(?)').get(username);
  if (t && bcrypt.compareSync(password, t.password_hash)) {
    if (!traineeActive(t)) return res.status(403).json({ message: 'انتهى اشتراكك أو تم إيقافه. تواصلي مع المدربة.' });
    req.session.uid = t.id; req.session.role = 'trainee';
    return res.json({ role: 'trainee' });
  }
  return res.status(401).json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
});

app.get('/api/me', (req, res) => {
  if (!req.session || !req.session.uid) return res.json({ role: null });
  res.json({ role: req.session.role });
});

app.post('/api/logout', (req, res) => { req.session = null; res.json({ ok: true }); });

// ===== الإدارة: لوحة الإحصائيات =====
app.get('/api/admin/stats', requireAuth, requireAdmin, (req, res) => {
  const t = today();
  const total = db.prepare('SELECT COUNT(*) c FROM trainees').get().c;
  const active = db.prepare('SELECT COUNT(*) c FROM trainees WHERE active=1 AND end_date>=?').get(t).c;
  const trainedToday = db.prepare('SELECT COUNT(DISTINCT trainee_id) c FROM workout_logs WHERE log_date=?').get(t).c;
  const recent = db.prepare(`
    SELECT ws.completed_at, ws.duration_min, tr.name AS trainee, pd.title AS day_title
    FROM workout_sessions ws
    JOIN trainees tr ON tr.id = ws.trainee_id
    LEFT JOIN plan_days pd ON pd.id = ws.plan_day_id
    ORDER BY ws.id DESC LIMIT 20`).all();
  res.json({ total, active, expired: total - active, trainedToday, recent });
});

// ===== الإدارة: المشتركات =====
app.get('/api/admin/trainees', requireAuth, requireAdmin, (req, res) => {
  const rows = db.prepare(`SELECT id,name,username,password_plain,coach_note,start_date,end_date,daily_calorie_goal,
    weight_kg,height_cm,age,gender,activity_level,deficit_pct,body_fat_pct,macro_style,protein_g,carb_g,fat_g,active,tracked FROM trainees ORDER BY id DESC`).all();
  const t = today();
  rows.forEach(r => {
    r.days_left = daysLeft(r.end_date);
    r.status = (r.active && r.end_date >= t) ? 'active' : 'expired';
  });
  res.json(rows);
});

app.post('/api/admin/trainees', requireAuth, requireAdmin, (req, res) => {
  const { name, username, password, months, daily_calorie_goal,
    weight_kg, height_cm, age, gender, activity_level, deficit_pct, body_fat_pct,
    macro_style, protein_g, carb_g, fat_g, tracked } = req.body;
  if (!name || !username || !password || !months) return res.status(400).json({ message: 'أكملي كل الحقول' });
  if (db.prepare('SELECT id FROM trainees WHERE username=?').get(username))
    return res.status(400).json({ message: 'اسم المستخدم مستخدم مسبقاً' });
  const start = new Date();
  const end = new Date(); end.setMonth(end.getMonth() + parseInt(months));
  const info = db.prepare(`INSERT INTO trainees
    (name,username,password_hash,password_plain,start_date,end_date,daily_calorie_goal,
     weight_kg,height_cm,age,gender,activity_level,deficit_pct,body_fat_pct,
     macro_style,protein_g,carb_g,fat_g,tracked,active,created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,?)`).run(
    name, username, bcrypt.hashSync(password, 10), password,
    start.toISOString().slice(0, 10), end.toISOString().slice(0, 10),
    parseInt(daily_calorie_goal) || 2000,
    weight_kg ? parseFloat(weight_kg) : null, height_cm ? parseFloat(height_cm) : null,
    age ? parseInt(age) : null, gender || 'female', activity_level || 'moderate',
    (deficit_pct !== undefined && deficit_pct !== '') ? parseFloat(deficit_pct) : 0,
    (body_fat_pct !== undefined && body_fat_pct !== '') ? parseFloat(body_fat_pct) : null,
    macro_style || 'balanced',
    parseInt(protein_g) || 0, parseInt(carb_g) || 0, parseInt(fat_g) || 0,
    (tracked === 0 || tracked === '0' || tracked === false) ? 0 : 1,
    new Date().toISOString());
  res.json({ id: info.lastInsertRowid });
});

app.patch('/api/admin/trainees/:id', requireAuth, requireAdmin, (req, res) => {
  const id = req.params.id;
  const t = db.prepare('SELECT * FROM trainees WHERE id=?').get(id);
  if (!t) return res.status(404).json({ message: 'غير موجودة' });
  const { action, months, password, name, daily_calorie_goal,
    weight_kg, height_cm, age, gender, activity_level, deficit_pct, body_fat_pct } = req.body;
  if (action === 'extend') {
    const base = t.end_date > today() ? new Date(t.end_date) : new Date();
    base.setMonth(base.getMonth() + (parseInt(months) || 1));
    db.prepare('UPDATE trainees SET end_date=?, active=1 WHERE id=?').run(base.toISOString().slice(0, 10), id);
  } else if (action === 'stop') {
    db.prepare('UPDATE trainees SET active=0 WHERE id=?').run(id);
  } else if (action === 'activate') {
    db.prepare('UPDATE trainees SET active=1 WHERE id=?').run(id);
  } else if (action === 'password' && password) {
    db.prepare('UPDATE trainees SET password_hash=?, password_plain=? WHERE id=?')
      .run(bcrypt.hashSync(password, 10), password, id);
  } else if (action === 'coach_note') {
    db.prepare('UPDATE trainees SET coach_note=? WHERE id=?').run(req.body.note || null, id);
  } else if (action === 'tracked') {
    db.prepare('UPDATE trainees SET tracked=? WHERE id=?').run(req.body.tracked ? 1 : 0, id);
  } else if (action === 'edit') {
    const { macro_style, protein_g, carb_g, fat_g, tracked } = req.body;
    db.prepare(`UPDATE trainees SET
      name=COALESCE(?,name), daily_calorie_goal=COALESCE(?,daily_calorie_goal),
      weight_kg=COALESCE(?,weight_kg), height_cm=COALESCE(?,height_cm), age=COALESCE(?,age),
      gender=COALESCE(?,gender), activity_level=COALESCE(?,activity_level), deficit_pct=COALESCE(?,deficit_pct),
      body_fat_pct=?, tracked=COALESCE(?,tracked),
      macro_style=COALESCE(?,macro_style), protein_g=COALESCE(?,protein_g),
      carb_g=COALESCE(?,carb_g), fat_g=COALESCE(?,fat_g)
      WHERE id=?`).run(
      name || null, daily_calorie_goal ? parseInt(daily_calorie_goal) : null,
      weight_kg ? parseFloat(weight_kg) : null, height_cm ? parseFloat(height_cm) : null,
      age ? parseInt(age) : null, gender || null, activity_level || null,
      (deficit_pct !== undefined && deficit_pct !== '') ? parseFloat(deficit_pct) : null,
      (body_fat_pct !== undefined && body_fat_pct !== '') ? parseFloat(body_fat_pct) : null,
      (tracked === undefined || tracked === null || tracked === '') ? null : (tracked ? 1 : 0),
      macro_style || null,
      protein_g ? parseInt(protein_g) : null, carb_g ? parseInt(carb_g) : null,
      fat_g ? parseInt(fat_g) : null,
      id);
  }
  res.json({ ok: true });
});

app.delete('/api/admin/trainees/:id', requireAuth, requireAdmin, (req, res) => {
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
app.get('/api/admin/exercises', requireAuth, requireAdmin, (req, res) => {
  res.json(db.prepare('SELECT * FROM exercises ORDER BY name').all());
});

app.post('/api/admin/exercises', requireAuth, requireAdmin, upload.single('media'), (req, res) => {
  const { name, name_en, target_muscle, media_url, notes, alt_free } = req.body;
  if (!name) return res.status(400).json({ message: 'اكتبي اسم التمرين' });
  let media = media_url || '';
  if (req.file) media = '/uploads/' + req.file.filename;
  const info = db.prepare('INSERT INTO exercises (name,name_en,target_muscle,media_url,notes,alt_free) VALUES (?,?,?,?,?,?)')
    .run(name, name_en || '', target_muscle || '', media, notes || '', alt_free || '');
  res.json({ id: info.lastInsertRowid });
});

app.patch('/api/admin/exercises/:id', requireAuth, requireAdmin, (req, res) => {
  const { alt_free, media_url } = req.body;
  if (alt_free !== undefined)
    db.prepare('UPDATE exercises SET alt_free=? WHERE id=?').run(alt_free || '', req.params.id);
  if (media_url !== undefined)
    db.prepare('UPDATE exercises SET media_url=? WHERE id=?').run(media_url || '', req.params.id);
  res.json({ ok: true });
});

app.delete('/api/admin/exercises/:id', requireAuth, requireAdmin, (req, res) => {
  db.prepare('DELETE FROM exercises WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// ===== الإدارة: جدول المشتركة =====
app.get('/api/admin/trainees/:id/plan', requireAuth, requireAdmin, (req, res) => {
  const days = db.prepare('SELECT * FROM plan_days WHERE trainee_id=? ORDER BY day_index').all(req.params.id);
  days.forEach(d => {
    d.exercises = db.prepare(`SELECT pe.*, e.name, e.target_muscle, e.media_url
      FROM plan_exercises pe JOIN exercises e ON e.id=pe.exercise_id
      WHERE pe.plan_day_id=? ORDER BY pe.order_index`).all(d.id);
  });
  res.json(days);
});

app.post('/api/admin/trainees/:id/days', requireAuth, requireAdmin, (req, res) => {
  const { day_index, title, goal } = req.body;
  const info = db.prepare('INSERT INTO plan_days (trainee_id,day_index,title,goal) VALUES (?,?,?,?)')
    .run(req.params.id, parseInt(day_index) || 1, title || '', goal || '');
  res.json({ id: info.lastInsertRowid });
});

app.delete('/api/admin/days/:id', requireAuth, requireAdmin, (req, res) => {
  db.prepare('DELETE FROM plan_exercises WHERE plan_day_id=?').run(req.params.id);
  db.prepare('DELETE FROM plan_days WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

app.post('/api/admin/days/:dayId/exercises', requireAuth, requireAdmin, (req, res) => {
  const { exercise_id, sets, reps, target_weight } = req.body;
  if (!exercise_id) return res.status(400).json({ message: 'اختاري تمريناً' });
  const max = db.prepare('SELECT COALESCE(MAX(order_index),0) m FROM plan_exercises WHERE plan_day_id=?').get(req.params.dayId).m;
  const info = db.prepare('INSERT INTO plan_exercises (plan_day_id,exercise_id,sets,reps,target_weight,order_index) VALUES (?,?,?,?,?,?)')
    .run(req.params.dayId, exercise_id, parseInt(sets) || 3, reps || '8-12', target_weight || '', max + 1);
  res.json({ id: info.lastInsertRowid });
});

app.delete('/api/admin/plan-exercises/:id', requireAuth, requireAdmin, (req, res) => {
  db.prepare('DELETE FROM plan_exercises WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// ===== الإدارة: قوالب جاهزة =====
app.get('/api/admin/templates', requireAuth, requireAdmin, (req, res) => {
  res.json(Object.entries(TEMPLATES).map(([key, t]) => ({ key, label: t.label })));
});

app.post('/api/admin/trainees/:id/apply-template', requireAuth, requireAdmin, (req, res) => {
  const tpl = TEMPLATES[req.body.template];
  if (!tpl) return res.status(400).json({ message: 'قالب غير معروف' });
  const traineeId = req.params.id;
  const baseIdx = db.prepare('SELECT COALESCE(MAX(day_index),0) m FROM plan_days WHERE trainee_id=?').get(traineeId).m;
  const insertDay = db.prepare('INSERT INTO plan_days (trainee_id,day_index,title,goal) VALUES (?,?,?,?)');
  const findEx = db.prepare('SELECT id FROM exercises WHERE name=?');
  const insertPE = db.prepare('INSERT INTO plan_exercises (plan_day_id,exercise_id,sets,reps,target_weight,order_index) VALUES (?,?,?,?,?,?)');
  const apply = db.transaction(() => {
    tpl.days.forEach((day, i) => {
      const dayId = insertDay.run(traineeId, baseIdx + i + 1, day.title, day.goal || '').lastInsertRowid;
      day.exercises.forEach((ex, idx) => {
        const exRow = findEx.get(ex.name);
        if (!exRow) return;
        insertPE.run(dayId, exRow.id, ex.sets, ex.reps, '', idx + 1);
      });
    });
  });
  apply();
  res.json({ ok: true });
});

// ===== الإدارة: تقرير المشتركة =====
app.get('/api/admin/trainees/:id/report', requireAuth, requireAdmin, (req, res) => {
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
  const measurements = db.prepare(`SELECT * FROM measurements WHERE trainee_id=? ORDER BY log_date ASC, id ASC`).all(id);
  res.json({ trainee, logs, totalSets, lastWorkout, cals, recentSets, measurements });
});

// ===== الإدارة: تغيير كلمة المرور =====
app.post('/api/admin/password', requireAuth, requireAdmin, (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) return res.status(400).json({ message: 'كلمة المرور 6 أحرف على الأقل' });
  db.prepare('UPDATE admins SET password_hash=? WHERE id=?').run(bcrypt.hashSync(password, 10), req.session.uid);
  res.json({ ok: true });
});

// ===== المتدربة =====
app.get('/api/trainee/home', requireAuth, requireTrainee, (req, res) => {
  const t = db.prepare('SELECT * FROM trainees WHERE id=?').get(req.session.uid);
  if (!traineeActive(t)) { req.session = null; return res.status(403).json({ error: 'expired' }); }
  const cal = db.prepare(`SELECT COALESCE(SUM(calories),0) c, COALESCE(SUM(protein),0) p,
    COALESCE(SUM(carbs),0) cb, COALESCE(SUM(fat),0) f
    FROM calorie_logs WHERE trainee_id=? AND log_date=?`).get(t.id, today());
  const setsToday = db.prepare('SELECT COUNT(*) c FROM workout_logs WHERE trainee_id=? AND log_date=?').get(t.id, today()).c;
  const planDays = db.prepare('SELECT id, day_index, title FROM plan_days WHERE trainee_id=? ORDER BY day_index').all(t.id);
  const completedToday = new Set(
    db.prepare('SELECT plan_day_id FROM workout_sessions WHERE trainee_id=? AND session_date=?')
      .all(t.id, today()).map(r => r.plan_day_id)
  );
  planDays.forEach(d => { d.doneToday = completedToday.has(d.id); });
  const lastMeas = db.prepare('SELECT log_date FROM measurements WHERE trainee_id=? ORDER BY log_date DESC, id DESC LIMIT 1').get(t.id);
  const daysSinceMeas = lastMeas ? Math.round((new Date(today()) - new Date(lastMeas.log_date)) / 86400000) : null;
  res.json({
    name: t.name, daysLeft: daysLeft(t.end_date), endDate: t.end_date,
    calorieGoal: t.daily_calorie_goal, caloriesToday: cal.c,
    proteinGoal: t.protein_g || 0, carbGoal: t.carb_g || 0, fatGoal: t.fat_g || 0,
    proteinToday: Math.round(cal.p), carbToday: Math.round(cal.cb), fatToday: Math.round(cal.f),
    setsToday, hasPlan: planDays.length > 0,
    planDays,
    coachNote: t.coach_note || null,
    tracked: t.tracked ? 1 : 0,
    cycle: cycleInfo(t),
    needsMeasurement: (daysSinceMeas === null || daysSinceMeas >= 7),
    lastMeasurementDays: daysSinceMeas
  });
});

app.get('/api/trainee/plan', requireAuth, requireTrainee, (req, res) => {
  const uid = req.session.uid;
  const days = db.prepare('SELECT * FROM plan_days WHERE trainee_id=? ORDER BY day_index').all(uid);
  days.forEach(d => {
    d.exercises = db.prepare(`SELECT pe.*, e.name, e.name_en, e.target_muscle, e.media_url, e.notes, e.alt_free
      FROM plan_exercises pe JOIN exercises e ON e.id=pe.exercise_id
      WHERE pe.plan_day_id=? ORDER BY pe.order_index`).all(d.id);
    // الأداء السابق: آخر جلسة سابقة لكل تمرين (وزن × تكرار لكل ست)
    d.exercises.forEach(ex => {
      const lastDate = db.prepare(`SELECT MAX(log_date) d FROM workout_logs
        WHERE trainee_id=? AND exercise_id=? AND log_date<?`).get(uid, ex.exercise_id, today()).d;
      ex.previous = lastDate
        ? db.prepare(`SELECT set_number, weight, reps FROM workout_logs
            WHERE trainee_id=? AND exercise_id=? AND log_date=? ORDER BY set_number`).all(uid, ex.exercise_id, lastDate)
        : [];
    });
  });
  res.json(days);
});

const e1rm = (w, r) => w > 0 ? +(w * (1 + r / 30)).toFixed(1) : 0; // معادلة إيبلي لتقدير 1RM

app.post('/api/trainee/log', requireAuth, requireTrainee, (req, res) => {
  const { plan_exercise_id, exercise_id, set_number, weight, reps } = req.body;
  const w = parseFloat(weight) || 0, r = parseInt(reps) || 0;
  // أفضل أرقام سابقة لنفس التمرين (قبل تسجيل هذا الست) — لاكتشاف رقم قياسي جديد
  let pr = null;
  if (exercise_id && w > 0) {
    const prev = db.prepare(`SELECT COALESCE(MAX(weight),0) maxW, COALESCE(MAX(weight*reps),0) maxV
      FROM workout_logs WHERE trainee_id=? AND exercise_id=? AND weight>0`).get(req.session.uid, exercise_id);
    const prevRows = db.prepare(`SELECT weight, reps FROM workout_logs WHERE trainee_id=? AND exercise_id=? AND weight>0`).all(req.session.uid, exercise_id);
    const prevBest1rm = prevRows.reduce((m, x) => Math.max(m, e1rm(x.weight, x.reps)), 0);
    const isWeightPR = w > prev.maxW && prev.maxW > 0;
    const isVolPR = (w * r) > prev.maxV && prev.maxV > 0;
    const is1rmPR = e1rm(w, r) > prevBest1rm && prevBest1rm > 0;
    if (isWeightPR || isVolPR || is1rmPR) pr = { weight: isWeightPR, volume: isVolPR, e1rm: is1rmPR };
  }
  const info = db.prepare(`INSERT INTO workout_logs (trainee_id,plan_exercise_id,exercise_id,log_date,set_number,weight,reps,created_at)
    VALUES (?,?,?,?,?,?,?,?)`).run(
    req.session.uid, plan_exercise_id || null, exercise_id || null, today(),
    parseInt(set_number) || 1, w, r, new Date().toISOString());
  res.json({ ok: true, id: info.lastInsertRowid, pr });
});

// مكتبة التمارين للمتدربة (لإضافة تمرين من عندها)
app.get('/api/trainee/exercises', requireAuth, requireTrainee, (req, res) => {
  res.json(db.prepare('SELECT id,name,name_en,target_muscle,media_url,alt_free FROM exercises ORDER BY name').all());
});

// المتدربة تضيف تمريناً إلى يوم من جدولها
app.post('/api/trainee/days/:dayId/add-exercise', requireAuth, requireTrainee, (req, res) => {
  const day = db.prepare('SELECT * FROM plan_days WHERE id=? AND trainee_id=?').get(req.params.dayId, req.session.uid);
  if (!day) return res.status(404).json({ message: 'اليوم غير موجود' });
  const { exercise_id, sets, reps } = req.body;
  if (!exercise_id || !db.prepare('SELECT id FROM exercises WHERE id=?').get(exercise_id))
    return res.status(400).json({ message: 'اختاري تمريناً صحيحاً' });
  const max = db.prepare('SELECT COALESCE(MAX(order_index),0) m FROM plan_exercises WHERE plan_day_id=?').get(day.id).m;
  const info = db.prepare(`INSERT INTO plan_exercises (plan_day_id,exercise_id,sets,reps,target_weight,order_index,added_by)
    VALUES (?,?,?,?,?,?,'trainee')`).run(day.id, exercise_id, parseInt(sets) || 3, reps || '8-12', '', max + 1);
  res.json({ ok: true, id: info.lastInsertRowid });
});

// المتدربة تحذف تمريناً أضافته بنفسها فقط
app.delete('/api/trainee/plan-exercise/:id', requireAuth, requireTrainee, (req, res) => {
  const pe = db.prepare(`SELECT pe.* FROM plan_exercises pe
    JOIN plan_days pd ON pd.id=pe.plan_day_id
    WHERE pe.id=? AND pd.trainee_id=? AND pe.added_by='trainee'`).get(req.params.id, req.session.uid);
  if (!pe) return res.status(403).json({ message: 'لا يمكن حذف تمارين المدربة' });
  db.prepare('DELETE FROM plan_exercises WHERE id=?').run(pe.id);
  db.prepare('DELETE FROM workout_logs WHERE plan_exercise_id=?').run(pe.id);
  res.json({ ok: true });
});

app.delete('/api/trainee/log/:id', requireAuth, requireTrainee, (req, res) => {
  db.prepare('DELETE FROM workout_logs WHERE id=? AND trainee_id=?').run(req.params.id, req.session.uid);
  res.json({ ok: true });
});

app.post('/api/trainee/log-cardio', requireAuth, requireTrainee, (req, res) => {
  const { machine, duration_min } = req.body;
  if (!machine || !duration_min) return res.status(400).json({ message: 'اختاري الجهاز والمدة' });
  db.prepare(`INSERT INTO cardio_logs (trainee_id,session_date,machine,duration_min,created_at)
    VALUES (?,?,?,?,?)`).run(req.session.uid, today(), machine, parseInt(duration_min) || 0, new Date().toISOString());
  res.json({ ok: true });
});

app.get('/api/trainee/logs', requireAuth, requireTrainee, (req, res) => {
  const date = req.query.date || today();
  res.json(db.prepare('SELECT * FROM workout_logs WHERE trainee_id=? AND log_date=? ORDER BY id').all(req.session.uid, date));
});

app.post('/api/trainee/calories', requireAuth, requireTrainee, (req, res) => {
  const { meal_name, calories, protein, carbs, fat } = req.body;
  db.prepare(`INSERT INTO calorie_logs (trainee_id,log_date,meal_name,calories,protein,carbs,fat,created_at)
    VALUES (?,?,?,?,?,?,?,?)`).run(
    req.session.uid, today(), meal_name || 'وجبة',
    parseInt(calories) || 0, parseFloat(protein) || 0, parseFloat(carbs) || 0, parseFloat(fat) || 0, new Date().toISOString());
  res.json({ ok: true });
});

app.get('/api/trainee/calories', requireAuth, requireTrainee, (req, res) => {
  const date = req.query.date || today();
  res.json(db.prepare('SELECT * FROM calorie_logs WHERE trainee_id=? AND log_date=? ORDER BY id').all(req.session.uid, date));
});

app.post('/api/trainee/complete-workout', requireAuth, requireTrainee, (req, res) => {
  const { plan_day_id, duration_min } = req.body;
  db.prepare(`INSERT INTO workout_sessions (trainee_id,plan_day_id,session_date,completed_at,duration_min)
    VALUES (?,?,?,?,?)`).run(req.session.uid, plan_day_id || null, today(), new Date().toISOString(), parseInt(duration_min) || 0);
  res.json({ ok: true });
});

app.delete('/api/trainee/calories/:id', requireAuth, requireTrainee, (req, res) => {
  db.prepare('DELETE FROM calorie_logs WHERE id=? AND trainee_id=?').run(req.params.id, req.session.uid);
  res.json({ ok: true });
});

app.get('/api/trainee/progress', requireAuth, requireTrainee, (req, res) => {
  const uid = req.session.uid;
  const days = db.prepare(`SELECT log_date, COUNT(*) sets FROM workout_logs WHERE trainee_id=?
    GROUP BY log_date ORDER BY log_date DESC LIMIT 14`).all(uid);
  const cals = db.prepare(`SELECT log_date, SUM(calories) calories FROM calorie_logs WHERE trainee_id=?
    GROUP BY log_date ORDER BY log_date DESC LIMIT 14`).all(uid);
  const measurements = db.prepare(`SELECT * FROM measurements WHERE trainee_id=?
    ORDER BY log_date ASC, id ASC`).all(uid);
  const t = db.prepare('SELECT last_period_date, cycle_length FROM trainees WHERE id=?').get(uid);
  res.json({ days, cals, measurements, cycle: cycleInfo(t) });
});

// تسجيل قياسات التطور (وزن + سنتيمترات)
app.post('/api/trainee/measurement', requireAuth, requireTrainee, (req, res) => {
  const { weight_kg, waist_cm, hip_cm, thigh_cm, arm_cm, chest_cm, notes, last_period_date, cycle_length } = req.body;
  const num = v => (v === '' || v === undefined || v === null) ? null : parseFloat(v);
  if (![weight_kg, waist_cm, hip_cm, thigh_cm, arm_cm, chest_cm].some(v => num(v) !== null))
    return res.status(400).json({ message: 'أدخلي قياساً واحداً على الأقل' });
  db.prepare(`INSERT INTO measurements (trainee_id,log_date,weight_kg,waist_cm,hip_cm,thigh_cm,arm_cm,chest_cm,notes,created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?)`).run(req.session.uid, today(),
    num(weight_kg), num(waist_cm), num(hip_cm), num(thigh_cm), num(arm_cm), num(chest_cm),
    notes || '', new Date().toISOString());
  if (num(weight_kg)) db.prepare('UPDATE trainees SET weight_kg=? WHERE id=?').run(num(weight_kg), req.session.uid);
  if (last_period_date) db.prepare('UPDATE trainees SET last_period_date=? WHERE id=?').run(last_period_date, req.session.uid);
  if (cycle_length) db.prepare('UPDATE trainees SET cycle_length=? WHERE id=?').run(parseInt(cycle_length) || 28, req.session.uid);
  res.json({ ok: true });
});

// تحديث معلومات الدورة الشهرية فقط
app.post('/api/trainee/cycle', requireAuth, requireTrainee, (req, res) => {
  const { last_period_date, cycle_length } = req.body;
  if (last_period_date) db.prepare('UPDATE trainees SET last_period_date=? WHERE id=?').run(last_period_date, req.session.uid);
  if (cycle_length) db.prepare('UPDATE trainees SET cycle_length=? WHERE id=?').run(parseInt(cycle_length) || 28, req.session.uid);
  const t = db.prepare('SELECT last_period_date, cycle_length FROM trainees WHERE id=?').get(req.session.uid);
  res.json({ ok: true, cycle: cycleInfo(t) });
});

// حذف قياس
app.delete('/api/trainee/measurement/:id', requireAuth, requireTrainee, (req, res) => {
  db.prepare('DELETE FROM measurements WHERE id=? AND trainee_id=?').run(req.params.id, req.session.uid);
  res.json({ ok: true });
});

// ===== الإدارة: التنبيهات =====
app.get('/api/admin/notifications', requireAuth, requireAdmin, (req, res) => {
  const t = today();
  const completions = db.prepare(`
    SELECT ws.completed_at, ws.duration_min, tr.name, pd.title as day_title
    FROM workout_sessions ws
    JOIN trainees tr ON tr.id = ws.trainee_id
    LEFT JOIN plan_days pd ON pd.id = ws.plan_day_id
    WHERE ws.session_date=? AND tr.tracked=1
    ORDER BY ws.completed_at DESC`).all(t);
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const cutoff = threeDaysAgo.toISOString().slice(0, 10);
  const inactive = db.prepare(`
    SELECT tr.id, tr.name, MAX(wl.log_date) as last_workout
    FROM trainees tr
    LEFT JOIN workout_logs wl ON wl.trainee_id = tr.id
    WHERE tr.active=1 AND tr.tracked=1 AND tr.end_date >= ?
    GROUP BY tr.id
    HAVING last_workout IS NULL OR last_workout < ?
    ORDER BY last_workout ASC`).all(t, cutoff);
  res.json({ completions, inactive, date: t });
});

// تحقق يومي من انتهاء الاشتراكات (كل 24 ساعة)
setInterval(() => {
  const r = db.prepare("UPDATE trainees SET active=0 WHERE active=1 AND end_date < ?").run(today());
  if (r.changes > 0) console.log(`⏸️ [auto] تم إيقاف ${r.changes} اشتراك منتهي`);
}, 24 * 60 * 60 * 1000);

app.listen(PORT, () => console.log(`🚀 نظام vllogsraye يعمل على المنفذ ${PORT}`));
