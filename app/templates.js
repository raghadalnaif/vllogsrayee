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
  gym_4_v2: {
    label: 'نادي 4 أيام — Legs / Push / Pull / Legs+Core',
    days: [
      { title: 'اليوم 1 — أرجل وغلوتس (Legs day)', goal: 'تضخيم الغلوتس والأرجل الخلفية', exercises: [
        { name: 'هيب ثرست',         sets: 4, reps: '8-12' },
        { name: 'ديدليفت',           sets: 4, reps: '8-10' },
        { name: 'كيك باك بالكيبل',   sets: 4, reps: '10-15' },
        { name: 'سكوات سومو',        sets: 4, reps: '8-12' },
        { name: 'ماكينة أبداكتور',   sets: 4, reps: '8-12' },
        { name: 'ليغ كيرل',         sets: 4, reps: '8-12' },
      ]},
      { title: 'اليوم 2 — دفع (Push day)', goal: 'صدر وأكتاف وترايسبس وكور', exercises: [
        { name: 'شولدر بريس',                    sets: 4, reps: '8-12' },
        { name: 'ضغط صدر بالمكينة',              sets: 4, reps: '8-12' },
        { name: 'بنش بريس مائل',                 sets: 4, reps: '8-12' },
        { name: 'رفرفة جانبية (لاترال ريز)',      sets: 4, reps: '8-12' },
        { name: 'ترايسبس بُش داون',              sets: 4, reps: '8-12' },
        { name: 'كرنش',                          sets: 4, reps: '10-15' },
      ]},
      { title: 'اليوم 3 — سحب (Pull day)', goal: 'ظهر وبايسبس وكور', exercises: [
        { name: 'لات بُل داون',              sets: 4, reps: '8-12' },
        { name: 'سحب جالس (سيتد رو)',        sets: 4, reps: '8-12' },
        { name: 'رفع أمامي (أبرايت رو)',     sets: 3, reps: '8-12' },
        { name: 'فيس بُل',                   sets: 3, reps: '8-12' },
        { name: 'هامر كيرل',                 sets: 3, reps: '8-12' },
        { name: 'بايسبس كيرل',               sets: 3, reps: '8-12' },
        { name: 'ديد باغ',                   sets: 3, reps: '12' },
      ]},
      { title: 'اليوم 4 — أرجل وكور', goal: 'أرجل أمامية وكور', exercises: [
        { name: 'ليغ بريس',                  sets: 4, reps: '8-12' },
        { name: 'سكوات',                     sets: 4, reps: '8-12' },
        { name: 'ديدليفت مستقيم الأرجل',    sets: 4, reps: '8-12' },
        { name: 'ليغ إكستنشن',               sets: 3, reps: '8-12' },
        { name: 'ماكينة أداكتور',            sets: 3, reps: '8-12' },
        { name: 'بلانك',                     sets: 3, reps: '60 ثانية' },
        { name: 'كرنش عكسي',                sets: 3, reps: '10-15' },
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

  // ===== برامج طبية متخصصة =====
  diastasis_severe: {
    label: 'انفصال عضلي شديد — نادي + بيت (4 أيام)',
    days: [
      { title: 'غلوتس وأرجل — منزلي', goal: 'تقوية الجزء السفلي بدون ضغط على البطن', exercises: [
        { name: 'غلوت بريدج', sets: 3, reps: '15 — نطاق حركة صغير' },
        { name: 'دونكي كيك', sets: 3, reps: '12 لكل جهة' },
        { name: 'فاير هايدرنت', sets: 3, reps: '12 لكل جهة' },
        { name: 'ديد باغ', sets: 3, reps: '10 — ركّزي على تنفس البطن' },
        { name: 'رفع الكعبين (كاف ريز)', sets: 3, reps: '20' },
      ]},
      { title: 'جذع علوي — نادي', goal: 'تقوية الظهر والكتف بدون إجهاد الجذع', exercises: [
        { name: 'لات بُل داون', sets: 3, reps: '12 — تنفس متحكم' },
        { name: 'سحب جالس (سيتد رو)', sets: 3, reps: '12' },
        { name: 'شولدر بريس', sets: 3, reps: '10 — جلوس مع ظهر مسنود' },
        { name: 'رفرفة جانبية (لاترال ريز)', sets: 3, reps: '12' },
        { name: 'سوبرمان', sets: 3, reps: '12 — بدون رفع مبالغ' },
      ]},
      { title: 'أرجل خفيفة — نادي', goal: 'تحميل تدريجي بدون ضغط داخل البطن', exercises: [
        { name: 'ليغ بريس', sets: 3, reps: '12 — قدمان مرتفعتان قليلاً' },
        { name: 'ليغ إكستنشن', sets: 3, reps: '15' },
        { name: 'ليغ كيرل', sets: 3, reps: '12' },
        { name: 'ماكينة أبداكتور', sets: 3, reps: '15' },
        { name: 'ماكينة أداكتور', sets: 3, reps: '15' },
      ]},
      { title: 'كور علاجي — منزلي', goal: 'تأهيل عضلة البطن العميقة — لا كرنش', exercises: [
        { name: 'ديد باغ', sets: 4, reps: '10 بطيء — مع زفير عند الرفع' },
        { name: 'سوبرمان', sets: 3, reps: '12' },
        { name: 'غلوت بريدج', sets: 3, reps: '15 — مع إمالة الحوض الخلفية' },
        { name: 'بلانك', sets: 3, reps: '20 ثانية — على الركبتين' },
        { name: 'فاير هايدرنت', sets: 3, reps: '15 لكل جهة' },
      ]},
    ]
  },

  diastasis_mild: {
    label: 'انفصال عضلي خفيف — نادي + بيت (4 أيام)',
    days: [
      { title: 'غلوتس وأرجل — نادي', goal: 'بناء تدريجي مع مراقبة الجذع', exercises: [
        { name: 'هيب ثرست', sets: 4, reps: '10-12 — مع شد الكور في القمة' },
        { name: 'ليغ بريس', sets: 3, reps: '12' },
        { name: 'كيك باك بالكيبل', sets: 3, reps: '12 لكل جهة' },
        { name: 'ماكينة أبداكتور', sets: 3, reps: '15' },
        { name: 'ديد باغ', sets: 3, reps: '12' },
      ]},
      { title: 'دفع علوي — نادي', goal: 'قوة الجزء العلوي مع ظهر مسنود', exercises: [
        { name: 'ضغط صدر بالمكينة', sets: 3, reps: '10-12' },
        { name: 'شولدر بريس', sets: 3, reps: '10 — جلوس مع ظهر مدعوم' },
        { name: 'رفرفة جانبية (لاترال ريز)', sets: 3, reps: '12-15' },
        { name: 'ترايسبس بُش داون', sets: 3, reps: '12' },
        { name: 'بلانك', sets: 3, reps: '30 ثانية — لوح مستقيم' },
      ]},
      { title: 'سحب وظهر — نادي', goal: 'تقوية الظهر لدعم الجذع', exercises: [
        { name: 'لات بُل داون', sets: 4, reps: '10-12' },
        { name: 'سحب جالس (سيتد رو)', sets: 3, reps: '12' },
        { name: 'فيس بُل', sets: 3, reps: '15' },
        { name: 'هامر كيرل', sets: 3, reps: '12' },
        { name: 'بايسبس كيرل', sets: 3, reps: '12' },
      ]},
      { title: 'فل بودي علاجي — منزلي', goal: 'جلسة خفيفة بدون إجهاد', exercises: [
        { name: 'سكوات', sets: 3, reps: '15 — بطيء ومتحكم' },
        { name: 'دونكي كيك', sets: 3, reps: '12 لكل جهة' },
        { name: 'غلوت بريدج', sets: 3, reps: '15' },
        { name: 'سوبرمان', sets: 3, reps: '12' },
        { name: 'ديد باغ', sets: 3, reps: '10' },
      ]},
    ]
  },

  high_weight_diastasis: {
    label: 'وزن عالي + انفصال عضلي شديد — نادي (4 أيام)',
    days: [
      { title: 'أرجل سفلية منخفضة الشدة', goal: 'بناء القوة بدون تحميل عالٍ على المفاصل', exercises: [
        { name: 'ليغ بريس', sets: 3, reps: '15 — وزن خفيف ونطاق كامل' },
        { name: 'ليغ إكستنشن', sets: 3, reps: '15' },
        { name: 'ليغ كيرل', sets: 3, reps: '12' },
        { name: 'ماكينة أبداكتور', sets: 3, reps: '15' },
        { name: 'ماكينة أداكتور', sets: 3, reps: '15' },
      ]},
      { title: 'ظهر علوي وكتف — مدعوم', goal: 'تقوية العضلات الداعمة مع حماية العمود الفقري', exercises: [
        { name: 'لات بُل داون', sets: 3, reps: '12 — وزن متحكم به' },
        { name: 'سحب جالس (سيتد رو)', sets: 3, reps: '12' },
        { name: 'رفرفة جانبية (لاترال ريز)', sets: 3, reps: '12 — وزن خفيف' },
        { name: 'فيس بُل', sets: 3, reps: '15' },
        { name: 'ديد باغ', sets: 3, reps: '10 — أساس التأهيل' },
      ]},
      { title: 'غلوتس — كرسي وماكينات', goal: 'تفعيل الغلوتس بدون ضغط على الركبة والبطن', exercises: [
        { name: 'ماكينة أبداكتور', sets: 4, reps: '15-20' },
        { name: 'ماكينة أداكتور', sets: 4, reps: '15-20' },
        { name: 'كيك باك بالكيبل', sets: 3, reps: '12 لكل جهة — مسنودة على الجهاز' },
        { name: 'ليغ كيرل', sets: 3, reps: '12' },
        { name: 'ليغ بريس', sets: 3, reps: '12 — قدمان عاليتان لتفعيل الغلوتس' },
      ]},
      { title: 'كور علاجي + جزء علوي', goal: 'تقوية العضلة العميقة وتحسين الوقفة', exercises: [
        { name: 'ديد باغ', sets: 4, reps: '10 — الأساس' },
        { name: 'سوبرمان', sets: 3, reps: '10 — مع تنفس عميق' },
        { name: 'بلانك', sets: 3, reps: '15 ثانية على الركبتين' },
        { name: 'ضغط صدر بالمكينة', sets: 3, reps: '12 — جلوس مريح' },
        { name: 'شولدر بريس', sets: 3, reps: '10 — جلوس مع ظهر مسنود' },
      ]},
    ]
  },
};

module.exports = TEMPLATES;
