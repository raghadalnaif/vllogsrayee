// ===== دوال مشتركة =====
async function api(url, opts = {}) {
  const o = { headers: {}, ...opts };
  if (o.body && typeof o.body === 'object' && !(o.body instanceof FormData)) {
    o.headers['Content-Type'] = 'application/json';
    o.body = JSON.stringify(o.body);
  }
  try {
    const r = await fetch(url, o);
    if (r.status === 401 || (r.status === 403 && url.includes('/home'))) {
      location.href = '/';
      return null;
    }
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { toast(d.message || 'حدث خطأ', true); return null; }
    return d;
  } catch (_) {
    toast('تعذّر الاتصال بالخادم', true);
    return null;
  }
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

let _toastTimer;
function toast(msg, isErr) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.toggle('err', !!isErr);
  t.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

async function logout() {
  await fetch('/api/logout', { method: 'POST' });
  location.href = '/';
}

// أيقونة + لون حسب العضلة المستهدفة (بدون تحميل من الإنترنت — يناسب النت البطيء)
function muscleVisual(m) {
  m = String(m || '');
  if (/غلوت|جلوت/.test(m))            return ['🍑', '#fce4ec', '#c2185b'];
  if (/سمان|كعب/.test(m))             return ['🦶', '#e8f5e9', '#2e7d32'];
  if (/رجل|فخذ|كوادر|هامس|سكوات/.test(m)) return ['🦵', '#e0f2f1', '#00796b'];
  if (/ظهر|لات|سحب|تجديف/.test(m))    return ['🔙', '#e3f2fd', '#1565c0'];
  if (/باي|تراي|ذراع|ساعد/.test(m))   return ['💪', '#fff3e0', '#e65100'];
  if (/كتف|دلت/.test(m))              return ['🏋️', '#ede7f6', '#5e35b1'];
  if (/صدر/.test(m))                  return ['🫀', '#ffebee', '#c62828'];
  if (/بطن|كور|خصر/.test(m))          return ['🔥', '#fffde7', '#f9a825'];
  return ['🏋️', '#f1f8e9', '#558b2f'];
}

// خريطة العضلة المستهدفة (رسم تشريحي) — مصدر الصور: Wikimedia Commons (CC BY-SA)
function muscleNum(m) {
  m = String(m || '');
  if (/غلوت|جلوت/.test(m))            return { n: 8,  back: true };
  if (/هامس/.test(m))                 return { n: 11, back: true };
  if (/ظهر|لات|سحب|تجديف/.test(m))    return { n: 12, back: true };
  if (/تراب|trap/.test(m))            return { n: 9,  back: true };
  if (/صدر/.test(m))                  return { n: 4 };
  if (/كتف|دلت/.test(m))              return { n: 2 };
  if (/باي/.test(m))                  return { n: 1 };
  if (/تراي/.test(m))                 return { n: 5 };
  if (/خصر/.test(m))                  return { n: 14 };
  if (/بطن|كور/.test(m))              return { n: 6 };
  if (/سمان|كعب/.test(m))             return { n: 7 };
  if (/كوادر|فخذ|رجل|أرجل|سكوات/.test(m)) return { n: 10 };
  return null;
}
function muscleDiagram(target) {
  const mm = muscleNum(target);
  if (!mm) return '';
  const body = mm.back ? 'body-back' : 'body-front';
  return `<div class="muscle-map">
    <img class="mm-base" src="/img/muscles/${body}.svg" loading="lazy" alt="">
    <img class="mm-hi" src="/img/muscles/m${mm.n}.svg" loading="lazy" alt="العضلة المستهدفة">
  </div>`;
}

// امتداد إطارات الصورة: التشريحية svg، الفعلية jpg
function demoExt(demoUrl) { return /\/anat\//.test(demoUrl || '') ? 'svg' : 'jpg'; }

// صورة تكنيك متحرّكة داخل التمرين — تُفضّل الصورة الفعلية (واقعية)
function demoAnim(ex) {
  if (!ex) return '';
  const url = ex.demo_real || ex.demo_url;
  if (!url) return '';
  const e = demoExt(url);
  return `<div class="demo-anim">
    <img class="df0" src="${esc(url)}/0.${e}" loading="lazy" alt="${esc(ex.name)}">
    <img class="df1" src="${esc(url)}/1.${e}" loading="lazy" alt="">
  </div>`;
}

// صورة مصغّرة للتمرين: صورة التمرين الحقيقية (تشريحية/فعلية أو مرفوعة) — تحميل كسول
function exThumb(ex) {
  const url = ex.media_url || '';
  if (/\.(gif|jpg|jpeg|png|webp)$/i.test(url))
    return `<img class="ex-thumb" loading="lazy" src="${esc(url)}" alt="${esc(ex.name)}">`;
  if (ex.demo_url)
    return `<img class="ex-thumb" loading="lazy" src="${esc(ex.demo_url)}/0.${demoExt(ex.demo_url)}" alt="${esc(ex.name)}">`;
  const [ic, bg] = muscleVisual(ex.target_muscle);
  return `<div class="ex-thumb-tile" style="background:${bg}">${ic}</div>`;
}
