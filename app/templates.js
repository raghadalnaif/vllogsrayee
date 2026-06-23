// ===== قوالب تمارين جاهزة (منزلي / نادي × 3-4-5 أيام) =====
// أسماء التمارين هنا يجب أن تطابق تماماً أسماء مكتبة التمارين المزروعة في db.js

const TEMPLATES = {
  home_3: {
    label: 'منزلي — 3 أيام',
    days: [
      { title: 'غلوتس وأرجل', goal: 'تنشيط الجزء السفلي', exercises: [
        { name: 'سكوات سومو', sets: 3, reps: '15' },
        { name: 'غلوت بريدج', sets: 3, reps: '15' },
        { name: 'لانجز', sets: 3, reps: '12' },
        { name: 'دونكي كيك', sets: 3, reps: '15 لكل جهة' },
        { name: 'رفع الكعبين (كاف ريز)', sets: 3, reps: '20' },
      ]},
      { title: 'ظهر ويدين', goal: 'تقوية الجزء العلوي', exercises: [
        { name: 'سوبرمان', sets: 3, reps: '15' },
        { name: 'تجديف بدمبل بيد واحدة', sets: 3, reps: '12' },
        { name: 'ضغط (بوش أب)', sets: 3, reps: '12' },
        { name: 'بايسبس كيرل', sets: 3, reps: '12' },
        { name: 'ترايسبس إكستنشن خلف الرأس', sets: 3, reps: '12' },
      ]},
      { title: 'فل بودي وكور', goal: 'حرق شامل وتقوية الجذع', exercises: [
        { name: 'سكوات', sets: 3, reps: '15' },
        { name: 'ضغط (بوش أب)', sets: 3, reps: '12' },
        { name: 'بلانك', sets: 3, reps: '30 ثانية' },
        { name: 'روسيان تويست', sets: 3, reps: '20' },
        { name: 'ماونتن كلايمر', sets: 3, reps: '20' },
      ]},
    ]
  },
  home_4: {
    label: 'منزلي — 4 أيام',
    days: [
      { title: 'غلوتس', goal: '', exercises: [
        { name: 'سكوات سومو', sets: 4, reps: '15' },
        { name: 'غلوت بريدج', sets: 4, reps: '15' },
        { name: 'دونكي كيك', sets: 3, reps: '15 لكل جهة' },
        { name: 'فاير هايدرنت', sets: 3, reps: '15 لكل جهة' },
        { name: 'ستيب أب', sets: 3, reps: '12' },
      ]},
      { title: 'أرجل', goal: '', exercises: [
        { name: 'سكوات', sets: 4, reps: '12' },
        { name: 'لانجز', sets: 3, reps: '12' },
        { name: 'سبليت سكوات بلغاري', sets: 3, reps: '10' },
        { name: 'رفع الكعبين (كاف ريز)', sets: 3, reps: '20' },
      ]},
      { title: 'ظهر ويدين', goal: '', exercises: [
        { name: 'سوبرمان', sets: 3, reps: '15' },
        { name: 'تجديف بدمبل بيد واحدة', sets: 3, reps: '12' },
        { name: 'ضغط (بوش أب)', sets: 3, reps: '12' },
        { name: 'بايسبس كيرل', sets: 3, reps: '12' },
        { name: 'هامر كيرل', sets: 3, reps: '12' },
      ]},
      { title: 'كور', goal: '', exercises: [
        { name: 'بلانك', sets: 3, reps: '40 ثانية' },
        { name: 'كرنش', sets: 3, reps: '20' },
        { name: 'روسيان تويست', sets: 3, reps: '20' },
        { name: 'بايسكل كرنش', sets: 3, reps: '20' },
        { name: 'ديد باغ', sets: 3, reps: '12' },
      ]},
    ]
  },
  home_5: {
    label: 'منزلي — 5 أيام',
    days: [
      { title: 'غلوتس', goal: '', exercises: [
        { name: 'سكوات سومو', sets: 4, reps: '15' },
        { name: 'غلوت بريدج', sets: 4, reps: '15' },
        { name: 'دونكي كيك', sets: 3, reps: '15 لكل جهة' },
        { name: 'فاير هايدرنت', sets: 3, reps: '15 لكل جهة' },
      ]},
      { title: 'أرجل', goal: '', exercises: [
        { name: 'سكوات', sets: 4, reps: '12' },
        { name: 'لانجز', sets: 3, reps: '12' },
        { name: 'سبليت سكوات بلغاري', sets: 3, reps: '10' },
        { name: 'رفع الكعبين (كاف ريز)', sets: 3, reps: '20' },
        { name: 'ستيب أب', sets: 3, reps: '12' },
      ]},
      { title: 'ظهر', goal: '', exercises: [
        { name: 'سوبرمان', sets: 4, reps: '15' },
        { name: 'تجديف بدمبل بيد واحدة', sets: 4, reps: '12' },
        { name: 'ديدليفت مستقيم الأرجل', sets: 3, reps: '12' },
      ]},
      { title: 'يدين', goal: '', exercises: [
        { name: 'بايسبس كيرل', sets: 3, reps: '12' },
        { name: 'هامر كيرل', sets: 3, reps: '12' },
        { name: 'ترايسبس إكستنشن خلف الرأس', sets: 3, reps: '12' },
        { name: 'شولدر بريس', sets: 3, reps: '12' },
        { name: 'رفرفة جانبية (لاترال ريز)', sets: 3, reps: '15' },
        { name: 'ضغط (بوش أب)', sets: 3, reps: '12' },
      ]},
      { title: 'كور', goal: '', exercises: [
        { name: 'بلانك', sets: 3, reps: '45 ثانية' },
        { name: 'كرنش', sets: 3, reps: '20' },
        { name: 'روسيان تويست', sets: 3, reps: '20' },
        { name: 'بايسكل كرنش', sets: 3, reps: '20' },
        { name: 'ديد باغ', sets: 3, reps: '12' },
        { name: 'بلانك جانبي', sets: 3, reps: '30 ثانية لكل جهة' },
      ]},
    ]
  },
  gym_3: {
    label: 'نادي — 3 أيام',
    days: [
      { title: 'غلوتس وأرجل', goal: '', exercises: [
        { name: 'هيب ثرست', sets: 4, reps: '12' },
        { name: 'سكوات خلفي (باربل)', sets: 4, reps: '10' },
        { name: 'ليغ بريس', sets: 3, reps: '12' },
        { name: 'ليغ كيرل', sets: 3, reps: '15' },
        { name: 'رفع الكعبين (كاف ريز)', sets: 3, reps: '20' },
      ]},
      { title: 'ظهر ويدين', goal: '', exercises: [
        { name: 'لات بُل داون', sets: 4, reps: '12' },
        { name: 'سحب جالس (سيتد رو)', sets: 3, reps: '12' },
        { name: 'بايسبس كيرل', sets: 3, reps: '12' },
        { name: 'ترايسبس بُش داون', sets: 3, reps: '12' },
      ]},
      { title: 'فل بودي وكور', goal: '', exercises: [
        { name: 'سكوات سومو', sets: 3, reps: '15' },
        { name: 'بنش بريس بالدمبل', sets: 3, reps: '12' },
        { name: 'شولدر بريس', sets: 3, reps: '12' },
        { name: 'بلانك', sets: 3, reps: '45 ثانية' },
        { name: 'روسيان تويست', sets: 3, reps: '20' },
      ]},
    ]
  },
  gym_4: {
    label: 'نادي — 4 أيام',
    days: [
      { title: 'غلوتس', goal: '', exercises: [
        { name: 'هيب ثرست', sets: 4, reps: '12' },
        { name: 'كيك باك بالكيبل', sets: 3, reps: '15' },
        { name: 'سكوات سومو', sets: 4, reps: '12' },
        { name: 'غلوت بريدج', sets: 3, reps: '15' },
      ]},
      { title: 'أرجل', goal: '', exercises: [
        { name: 'سكوات خلفي (باربل)', sets: 4, reps: '10' },
        { name: 'ليغ بريس', sets: 3, reps: '12' },
        { name: 'ليغ إكستنشن', sets: 3, reps: '15' },
        { name: 'ليغ كيرل', sets: 3, reps: '15' },
        { name: 'رفع الكعبين (كاف ريز)', sets: 3, reps: '20' },
      ]},
      { title: 'ظهر ويدين', goal: '', exercises: [
        { name: 'لات بُل داون', sets: 4, reps: '12' },
        { name: 'سحب جالس (سيتد رو)', sets: 3, reps: '12' },
        { name: 'ديدليفت', sets: 3, reps: '10' },
        { name: 'بايسبس كيرل', sets: 3, reps: '12' },
        { name: 'ترايسبس بُش داون', sets: 3, reps: '12' },
      ]},
      { title: 'كور', goal: '', exercises: [
        { name: 'بلانك', sets: 3, reps: '45 ثانية' },
        { name: 'كرنش', sets: 3, reps: '20' },
        { name: 'روسيان تويست', sets: 3, reps: '20' },
        { name: 'رفع الأرجل معلق', sets: 3, reps: '12' },
        { name: 'بلانك جانبي', sets: 3, reps: '30 ثانية لكل جهة' },
      ]},
    ]
  },
  gym_5: {
    label: 'نادي — 5 أيام',
    days: [
      { title: 'غلوتس', goal: '', exercises: [
        { name: 'هيب ثرست', sets: 4, reps: '12' },
        { name: 'كيك باك بالكيبل', sets: 3, reps: '15' },
        { name: 'سكوات سومو', sets: 4, reps: '12' },
        { name: 'ديدليفت مستقيم الأرجل', sets: 3, reps: '12' },
      ]},
      { title: 'أرجل', goal: '', exercises: [
        { name: 'سكوات خلفي (باربل)', sets: 4, reps: '10' },
        { name: 'ليغ بريس', sets: 3, reps: '12' },
        { name: 'ليغ إكستنشن', sets: 3, reps: '15' },
        { name: 'ليغ كيرل', sets: 3, reps: '15' },
        { name: 'رفع الكعبين (كاف ريز)', sets: 3, reps: '20' },
      ]},
      { title: 'ظهر', goal: '', exercises: [
        { name: 'لات بُل داون', sets: 4, reps: '12' },
        { name: 'سحب جالس (سيتد رو)', sets: 3, reps: '12' },
        { name: 'تجديف منحني (بنت أوفر رو)', sets: 3, reps: '12' },
        { name: 'ديدليفت', sets: 3, reps: '10' },
        { name: 'فيس بُل', sets: 3, reps: '15' },
      ]},
      { title: 'يدين', goal: '', exercises: [
        { name: 'بايسبس كيرل', sets: 3, reps: '12' },
        { name: 'هامر كيرل', sets: 3, reps: '12' },
        { name: 'ترايسبس بُش داون', sets: 3, reps: '12' },
        { name: 'ترايسبس إكستنشن خلف الرأس', sets: 3, reps: '12' },
        { name: 'شولدر بريس', sets: 3, reps: '12' },
        { name: 'رفرفة جانبية (لاترال ريز)', sets: 3, reps: '15' },
      ]},
      { title: 'كور', goal: '', exercises: [
        { name: 'بلانك', sets: 3, reps: '45 ثانية' },
        { name: 'كرنش', sets: 3, reps: '20' },
        { name: 'روسيان تويست', sets: 3, reps: '20' },
        { name: 'رفع الأرجل معلق', sets: 3, reps: '12' },
        { name: 'بايسكل كرنش', sets: 3, reps: '20' },
        { name: 'ديد باغ', sets: 3, reps: '12' },
      ]},
    ]
  },
};

module.exports = TEMPLATES;
