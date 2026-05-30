// =====================================================
// verify-otp.js — يتحقق من الكود ويُرجع session token
// =====================================================
const crypto = require('crypto');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let phone, otp, token, ts;
  try {
    ({ phone, otp, token, ts } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'بيانات غير صالحة' }) };
  }

  // تحقق من انتهاء الصلاحية (5 دقائق)
  if (Date.now() - parseInt(ts) > 5 * 60 * 1000) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'انتهى الكود — اضغط "إعادة الإرسال"' })
    };
  }

  // تحقق من التوقيع
  const expected = crypto
    .createHmac('sha256', process.env.OTP_SECRET || 'dev-secret-change-me')
    .update(`${phone}:${otp}:${ts}`)
    .digest('hex');

  if (expected !== token) {
    return { statusCode: 400, body: JSON.stringify({ error: 'الكود غلط، حاول مرة ثانية' }) };
  }

  // توليد session token صالح 30 يوم
  const sessionDay = Math.floor(Date.now() / (30 * 86400 * 1000)).toString();
  const session = crypto
    .createHmac('sha256', process.env.OTP_SECRET || 'dev-secret-change-me')
    .update(`session:${phone}:${sessionDay}`)
    .digest('hex');

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: true, session })
  };
};
