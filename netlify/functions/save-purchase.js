// =====================================================
// save-purchase.js — يحفظ الطلب للعميل
// يستخدم Netlify Blobs لتخزين مشتريات كل رقم جوال
// =====================================================
const crypto = require('crypto');

// تحقق من session token
function verifySession(phone, session) {
  const sessionDay = Math.floor(Date.now() / (30 * 86400 * 1000)).toString();
  const expected = crypto
    .createHmac('sha256', process.env.OTP_SECRET || 'dev-secret-change-me')
    .update(`session:${phone}:${sessionDay}`)
    .digest('hex');
  return expected === session;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let phone, pkg, session;
  try {
    ({ phone, pkg, session } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'بيانات غير صالحة' }) };
  }

  if (!verifySession(phone, session)) {
    return { statusCode: 401, body: JSON.stringify({ error: 'جلسة غير صالحة' }) };
  }

  try {
    const { getStore } = require('@netlify/blobs');
    const store = getStore('purchases');
    const existing = JSON.parse((await store.get(phone)) || '[]');

    if (!existing.find(o => o.pkg === pkg)) {
      existing.push({ pkg, date: new Date().toISOString() });
      await store.set(phone, JSON.stringify(existing));
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true })
    };
  } catch (e) {
    console.error('Blobs error:', e.message);
    return { statusCode: 500, body: JSON.stringify({ error: 'خطأ في الخادم' }) };
  }
};
