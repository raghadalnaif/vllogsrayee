// =====================================================
// get-orders.js — يجيب قائمة مشتريات العميل
// =====================================================
const crypto = require('crypto');

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

  let phone, session;
  try {
    ({ phone, session } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'بيانات غير صالحة' }) };
  }

  if (!verifySession(phone, session)) {
    return { statusCode: 401, body: JSON.stringify({ error: 'جلسة غير صالحة' }) };
  }

  try {
    const { getStore } = require('@netlify/blobs');
    const store = getStore('purchases');
    const orders = JSON.parse((await store.get(phone)) || '[]');

    // تعريف الملفات لكل باقة
    const files = {
      1: { name: 'جدول موحد — Body Recomposition', icon: '💪', url: '/workout-guide.pdf' },
      3: { name: 'اعرف وش تاكل', icon: '🥗', url: '/nutrition.html' }
    };

    const enriched = orders.map(o => ({
      ...o,
      ...files[o.pkg],
      dateFormatted: new Date(o.date).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })
    }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orders: enriched })
    };
  } catch (e) {
    console.error('Blobs error:', e.message);
    return { statusCode: 500, body: JSON.stringify({ error: 'خطأ في الخادم' }) };
  }
};
