module.exports = {
  auth: {
    registerSuccess: 'تم تسجيل المستخدم بنجاح',
    loginSuccess: 'تم تسجيل الدخول بنجاح',
    invalidCredentials: 'بيانات الاعتماد غير صحيحة',
    userExists: 'المستخدم موجود بالفعل',
    passwordReset: 'تم إرسال رابط إعادة تعيين كلمة المرور',
    profileUpdated: 'تم تحديث الملف الشخصي بنجاح'
  },
  cases: {
    created: 'تم إنشاء القضية بنجاح',
    notFound: 'القضية غير موجودة',
    updated: 'تم تحديث القضية بنجاح',
    deleted: 'تم حذف القضية بنجاح',
    assigned: 'تم تعيين محامي للقضية',
    statusUpdated: 'تم تحديث حالة القضية'
  },
  lawyers: {
    registered: 'تم تسجيل المحامي بنجاح',
    approved: 'تم اعتماد المحامي',
    notFound: 'المحامي غير موجود',
    updated: 'تم تحديث ملف المحامي بنجاح'
  },
  payments: {
    created: 'تم إنشاء الدفعة بنجاح',
    confirmed: 'تم تأكيد الدفعة بنجاح',
    refunded: 'تم استرداد المبلغ بنجاح',
    failed: 'فشلت عملية الدفع',
    notFound: 'الدفعة غير موجودة'
  },
  messages: {
    sent: 'تم إرسال الرسالة بنجاح',
    markedAsRead: 'تم تحديد الرسالة كمقروءة',
    notFound: 'الرسالة غير موجودة'
  },
  admin: {
    statsRetrieved: 'تم استرجاع الإحصائيات بنجاح',
    userUpdated: 'تم تحديث المستخدم بنجاح',
    userDeleted: 'تم حذف المستخدم بنجاح'
  },
  violationTypes: {
    speeding: 'تجاوز السرعة',
    redlight: 'مخالفة إشارة حمراء',
    stopsign: 'مخالفة علامة توقف',
    cellphone: 'استخدام الهاتف',
    hov: 'مخالفة مسار HOV',
    reckless: 'قيادة متهورة',
    suspended: 'رخصة معلقة',
    dui: 'قيادة تحت التأثير',
    lanechange: 'تغيير المسار',
    noinsurance: 'بدون تأمين',
    racing: 'سباق',
    construction: 'منطقة بناء'
  },
  cities: {
    Riyadh: 'الرياض',
    Jeddah: 'جدة',
    Mecca: 'مكة المكرمة',
    Medina: 'المدينة المنورة',
    Dammam: 'الدمام',
    Khobar: 'الخبر',
    Tabuk: 'تبوك',
    Abha: 'أبها',
    Hail: 'حائل',
    Najran: 'نجران',
    Jubail: 'الجبيل',
    Taif: 'الطائف',
    Yanbu: 'ينبع',
    Buraidah: 'بريدة',
    KhamisMushait: 'خميس مشيط'
  },
  caseStatus: {
    pending: 'في الانتظار',
    assigned: 'تم التعيين',
    in_progress: 'قيد التنفيذ',
    court_date_set: 'تم تحديد موعد الجلسة',
    awaiting_decision: 'في انتظار القرار',
    won: 'مكتسبة',
    lost: 'خسرت',
    dismissed: 'مرفوضة'
  },
  errors: {
    serverError: 'خطأ في الخادم',
    notFound: 'غير موجود',
    unauthorized: 'غير مصرح',
    forbidden: 'ممنوع',
    validationError: 'خطأ في التحقق',
    duplicate: 'مكرر',
    invalidInput: 'إدخال غير صالح'
  },
  success: {
    created: 'تم الإنشاء بنجاح',
    updated: 'تم التحديث بنجاح',
    deleted: 'تم الحذف بنجاح',
    retrieved: 'تم الاسترجاع بنجاح'
  }
};
