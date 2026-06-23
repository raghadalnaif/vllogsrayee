// ===== دوال مشتركة =====
// المسار الأساسي للتطبيق (vllogsraye.com/app)
const BASE = '/app';
async function api(url, opts = {}) {
  const o = { headers: {}, ...opts };
  if (o.body && typeof o.body === 'object' && !(o.body instanceof FormData)) {
    o.headers['Content-Type'] = 'application/json';
    o.body = JSON.stringify(o.body);
  }
  try {
    const r = await fetch(BASE + url, o);
    if (r.status === 401 || (r.status === 403 && url.includes('/home'))) {
      location.href = BASE + '/';
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
  await fetch(BASE + '/api/logout', { method: 'POST' });
  location.href = BASE + '/';
}
