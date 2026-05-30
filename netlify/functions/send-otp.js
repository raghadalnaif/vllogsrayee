// =====================================================
// send-otp.js — يولّد OTP ويرسله على واتساب العميل
// متغيرات البيئة المطلوبة في Netlify:
//   OTP_SECRET       — كلمة سرية عشوائية (أي نص طويل)
//   ULTRAMSG_INSTANCE — Instance ID من ultramsg.com
//   ULTRAMSG_TOKEN   — Token من ultramsg.com
// =====================================================
const crypto = require('crypto');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let phone;
  try {
    ({ phone } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'بيانات غير صالحة' }) };
  }

  if (!phone || !/^\d{9,15}$/.test(phone)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'رقم الجوال غير صحيح' }) };
  }

  // توليد OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const ts  = Date.now().toString();

  // توقيع يُرسَل للعميل — يتحقق منه verify-otp بدون قاعدة بيانات
  const token = crypto
    .createHmac('sha256', process.env.OTP_SECRET || 'dev-secret-change-me')
    .update(`${phone}:${otp}:${ts}`)
    .digest('hex');

  // إرسال عبر Ultramsg
  const instance = process.env.ULTRAMSG_INSTANCE;
  const umToken  = process.env.ULTRAMSG_TOKEN;

  if (instance && umToken) {
    try {
      await fetch(`https://api.ultramsg.com/${instance}/messages/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          token: umToken,
          to: `+${phone}`,
          body: `🔑 كود التحقق — vllogsraye\n\n*${otp}*\n\nصالح 5 دقائق ⏱`
        })
      });
    } catch (e) {
      console.error('Ultramsg error:', e.message);
    }
  } else {
    // وضع التطوير — اطبع الكود في السجلات
    console.log(`[DEV] OTP for ${phone}: ${otp}`);
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: true, token, ts })
  };
};
