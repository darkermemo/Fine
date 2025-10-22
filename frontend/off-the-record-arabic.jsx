import React, { useState, useEffect } from 'react';
import { Camera, Upload, CheckCircle, Clock, FileText, MessageSquare, Shield, TrendingUp, DollarSign, Users, Star, Award, ChevronRight, ChevronLeft, Phone, Mail, MapPin, AlertCircle, Menu, X } from 'lucide-react';

const OffTheRecordArabic = () => {
  const [currentView, setCurrentView] = useState('home');
  const [ticketImage, setTicketImage] = useState(null);
  const [formData, setFormData] = useState({
    violationType: '',
    state: '',
    court: '',
    speed: '',
    speedLimit: '',
    date: '',
    cdlDriver: false
  });
  const [caseSubmitted, setCaseSubmitted] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Mock cases data (Arabic)
  const mockCases = [
    {
      id: 1,
      type: 'تجاوز السرعة',
      status: 'قيد التنفيذ',
      lawyer: 'سارة جونسون',
      court: 'محكمة الرياض المرورية',
      progress: 65,
      nextUpdate: 'تم تحديد موعد الجلسة',
      messages: 3
    },
    {
      id: 2,
      type: 'مخالفة إشارة حمراء',
      status: 'مرفوضة',
      lawyer: 'مايكل تشن',
      court: 'محكمة جدة',
      progress: 100,
      nextUpdate: 'تم رفض القضية - بدون نقاط!',
      messages: 7
    }
  ];

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTicketImage(reader.result);
        setCurrentView('form');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setCaseSubmitted(true);
    setCurrentView('confirmation');
  };

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-md border-r-4" style={{ borderColor: color }}>
      <div className="flex items-center justify-between">
        <div className="text-right">
          <p className="text-gray-600 text-xs md:text-sm mb-1">{label}</p>
          <p className="text-2xl md:text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <Icon className="w-10 h-10 md:w-12 md:h-12 opacity-20" style={{ color }} />
      </div>
    </div>
  );

  const FeatureCard = ({ icon: Icon, title, description }) => (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
      <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3 md:mb-4 mr-auto">
        <Icon className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
      </div>
      <h3 className="text-lg md:text-xl font-semibold mb-2 text-gray-900 text-right">{title}</h3>
      <p className="text-sm md:text-base text-gray-600 text-right leading-relaxed">{description}</p>
    </div>
  );

  // Mobile Navigation
  const MobileMenu = () => (
    <div className={`fixed inset-0 bg-gray-900 bg-opacity-95 z-50 transform transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex flex-col h-full p-6" dir="rtl">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-white">القائمة</h2>
          <button onClick={() => setMobileMenuOpen(false)} className="text-white">
            <X className="w-8 h-8" />
          </button>
        </div>
        <nav className="flex flex-col space-y-6">
          <button
            onClick={() => { setCurrentView('home'); setMobileMenuOpen(false); }}
            className="text-right text-xl text-white hover:text-blue-400 transition-colors"
          >
            الرئيسية
          </button>
          <button
            onClick={() => { setCurrentView('upload'); setMobileMenuOpen(false); }}
            className="text-right text-xl text-white hover:text-blue-400 transition-colors"
          >
            رفع مخالفة
          </button>
          <button
            onClick={() => { setCurrentView('dashboard'); setMobileMenuOpen(false); }}
            className="text-right text-xl text-white hover:text-blue-400 transition-colors"
          >
            قضاياي
          </button>
          <button className="text-right text-xl text-white hover:text-blue-400 transition-colors">
            المحامون
          </button>
          <button className="text-right text-xl text-white hover:text-blue-400 transition-colors">
            تواصل معنا
          </button>
        </nav>
      </div>
    </div>
  );

  // Home/Landing View
  const HomeView = () => (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white" dir="rtl">
      {/* Mobile Menu */}
      <MobileMenu />
      
      {/* Hero Section */}
      <div className="bg-blue-600 text-white py-12 md:py-20 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Mobile Menu Button */}
          {isMobile && (
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="absolute top-4 left-4 text-white z-40"
            >
              <Menu className="w-8 h-8" />
            </button>
          )}
          
          <div className="flex items-center justify-center mb-4">
            <h1 className="text-3xl md:text-5xl font-bold mr-4">خارج السجل</h1>
            <Shield className="w-12 h-12 md:w-16 md:h-16" />
          </div>
          <p className="text-xl md:text-2xl text-center mb-6 md:mb-8">قاتل مخالفتك المرورية في أقل من 60 ثانية</p>
          <p className="text-lg md:text-xl text-center mb-6 md:mb-8 text-blue-100">نسبة النجاح 97% • +1 مليون مخالفة • +1,000 محامي</p>
          
          <div className="flex flex-col md:flex-row justify-center gap-3 md:gap-4">
            <button
              onClick={() => setCurrentView('upload')}
              className="bg-white text-blue-600 px-6 md:px-8 py-3 md:py-4 rounded-lg text-base md:text-lg font-semibold hover:bg-blue-50 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <span>ارفع المخالفة الآن</span>
              <Camera className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentView('dashboard')}
              className="bg-blue-700 text-white px-6 md:px-8 py-3 md:py-4 rounded-lg text-base md:text-lg font-semibold hover:bg-blue-800 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <span>عرض قضاياي</span>
              <FileText className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 -mt-8 md:-mt-12 mb-12 md:mb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          <StatCard icon={CheckCircle} label="نسبة النجاح" value="97%" color="#10b981" />
          <StatCard icon={Users} label="القضايا المعالجة" value="+1م" color="#3b82f6" />
          <StatCard icon={Award} label="محامون خبراء" value="+1000" color="#8b5cf6" />
          <StatCard icon={DollarSign} label="متوسط التوفير" value="3400 ر.س" color="#f59e0b" />
        </div>
      </div>

      {/* How It Works */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 md:mb-12 text-gray-900">كيف يعمل</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <div className="text-center">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">1</div>
            <h3 className="text-lg md:text-xl font-semibold mb-2">التقط صورة</h3>
            <p className="text-sm md:text-base text-gray-600 leading-relaxed">التقط صورة للمخالفة المرورية أو ارفعها من جهازك</p>
          </div>
          <div className="text-center">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">2</div>
            <h3 className="text-lg md:text-xl font-semibold mb-2">أجب على الأسئلة</h3>
            <p className="text-sm md:text-base text-gray-600 leading-relaxed">املأ نموذج سريع بالمعلومات الأساسية عن مخالفتك</p>
          </div>
          <div className="text-center">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">3</div>
            <h3 className="text-lg md:text-xl font-semibold mb-2">دعنا نقاتلها</h3>
            <p className="text-sm md:text-base text-gray-600 leading-relaxed">نطابقك مع أفضل محامي يتعامل مع كل شيء من أجلك</p>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="bg-gray-50 py-12 md:py-16 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 md:mb-12 text-gray-900">لماذا تختار خارج السجل؟</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <FeatureCard
              icon={Shield}
              title="ضمان استرداد الأموال"
              description="إذا لم نربح قضيتك، تحصل على استرداد كامل للمبلغ. لا مخاطرة عليك."
            />
            <FeatureCard
              icon={TrendingUp}
              title="تقنية المطابقة الذكية"
              description="خوارزميتنا تطابقك مع المحامي الأكثر احتمالية للفوز بقضيتك المحددة."
            />
            <FeatureCard
              icon={Clock}
              title="بدون حضور المحكمة"
              description="محاميك يتعامل مع جميع الأوراق والحضور في المحكمة. لا تحتاج للحضور."
            />
            <FeatureCard
              icon={MessageSquare}
              title="تحديثات فورية"
              description="راسل محاميك في أي وقت واحصل على إشعارات فورية حول قضيتك."
            />
            <FeatureCard
              icon={DollarSign}
              title="تسعير ثابت شفاف"
              description="سعر واحد بسيط بدون تكاليف خفية. اعرف بالضبط ما ستدفعه مقدماً."
            />
            <FeatureCard
              icon={Star}
              title="محامون ذوو خبرة"
              description="نعمل فقط مع المحامين المروريين الأعلى تقييماً في منطقتك."
            />
          </div>
        </div>
      </div>

      {/* Violation Types */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-6 md:mb-8 text-gray-900">نتعامل مع جميع أنواع المخالفات</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {[
            'تجاوز السرعة',
            'إشارة حمراء',
            'علامة توقف',
            'استخدام الهاتف',
            'مسار HOV',
            'قيادة متهورة',
            'رخصة معلقة',
            'قيادة تحت التأثير',
            'تغيير المسار',
            'بدون تأمين',
            'سباق',
            'منطقة بناء'
          ].map((type) => (
            <div key={type} className="bg-white p-3 md:p-4 rounded-lg shadow text-center hover:shadow-md transition-shadow">
              <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-500 mx-auto mb-2" />
              <p className="font-medium text-gray-900 text-sm md:text-base">{type}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-blue-600 text-white py-12 md:py-16 px-4 md:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">جاهز لمقاتلة مخالفتك؟</h2>
          <p className="text-lg md:text-xl mb-6 md:mb-8 text-blue-100">انضم إلى أكثر من مليون شخص وثقوا بنا في مخالفاتهم المرورية</p>
          <button
            onClick={() => setCurrentView('upload')}
            className="bg-white text-blue-600 px-6 md:px-8 py-3 md:py-4 rounded-lg text-base md:text-lg font-semibold hover:bg-blue-50 transition-all shadow-lg"
          >
            ابدأ الآن
          </button>
        </div>
      </div>
    </div>
  );

  // Upload View
  const UploadView = () => (
    <div className="min-h-screen bg-gray-50 py-6 md:py-12 px-4 md:px-6" dir="rtl">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => setCurrentView('home')}
          className="text-blue-600 mb-4 md:mb-6 flex items-center gap-2 hover:text-blue-700"
        >
          <ChevronRight className="w-5 h-5" />
          <span>العودة للرئيسية</span>
        </button>
        
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-gray-900 text-right">ارفع مخالفتك</h2>
          <p className="text-sm md:text-base text-gray-600 mb-6 md:mb-8 text-right">التقط صورة أو ارفع صورة المخالفة المرورية</p>

          {!ticketImage ? (
            <div className="border-4 border-dashed border-gray-300 rounded-lg p-8 md:p-12 text-center hover:border-blue-400 transition-colors">
              <div className="flex flex-col items-center gap-4">
                <Camera className="w-12 h-12 md:w-16 md:h-16 text-gray-400" />
                <h3 className="text-lg md:text-xl font-semibold text-gray-900">ارفع صورة المخالفة</h3>
                <p className="text-sm md:text-base text-gray-600 mb-4">التقط صورة واضحة للمخالفة بالكامل</p>
                
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <div className="bg-blue-600 text-white px-6 md:px-8 py-3 rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2 text-sm md:text-base">
                    <Camera className="w-5 h-5" />
                    <span>التقط صورة</span>
                  </div>
                </label>

                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <div className="border-2 border-blue-600 text-blue-600 px-6 md:px-8 py-3 rounded-lg hover:bg-blue-50 transition-all flex items-center gap-2 text-sm md:text-base">
                    <Upload className="w-5 h-5" />
                    <span>ارفع من الجهاز</span>
                  </div>
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-4 md:space-y-6">
              <div className="relative">
                <img src={ticketImage} alt="Ticket" className="w-full rounded-lg shadow-md" />
                <button
                  onClick={() => setTicketImage(null)}
                  className="absolute top-4 left-4 bg-red-500 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-red-600 transition-all text-sm md:text-base"
                >
                  حذف
                </button>
              </div>
              
              <div className="flex items-center justify-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5 md:w-6 md:h-6" />
                <span className="font-semibold text-sm md:text-base">تم رفع المخالفة بنجاح!</span>
              </div>

              <button
                onClick={() => setCurrentView('form')}
                className="w-full bg-blue-600 text-white px-6 md:px-8 py-3 md:py-4 rounded-lg text-base md:text-lg font-semibold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
              >
                <span>المتابعة للتفاصيل</span>
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
          )}

          <div className="mt-6 md:mt-8 bg-blue-50 p-3 md:p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
              <div className="text-xs md:text-sm text-gray-700">
                <p className="font-semibold mb-1">نصائح لصورة واضحة:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>تأكد من قراءة جميع النصوص</li>
                  <li>قم بتضمين المخالفة بالكامل في الإطار</li>
                  <li>استخدم إضاءة جيدة وتجنب الظلال</li>
                  <li>ثبت الكاميرا</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Form View
  const FormView = () => (
    <div className="min-h-screen bg-gray-50 py-6 md:py-12 px-4 md:px-6" dir="rtl">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => setCurrentView('upload')}
          className="text-blue-600 mb-4 md:mb-6 flex items-center gap-2 hover:text-blue-700"
        >
          <ChevronRight className="w-5 h-5" />
          <span>العودة للرفع</span>
        </button>
        
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-gray-900 text-right">تفاصيل المخالفة</h2>
          <p className="text-sm md:text-base text-gray-600 mb-6 md:mb-8 text-right">ساعدنا في فهم مخالفتك بشكل أفضل</p>

          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-900 text-right">نوع المخالفة</label>
              <select
                value={formData.violationType}
                onChange={(e) => handleFormChange('violationType', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                required
                dir="rtl"
              >
                <option value="">اختر نوع المخالفة</option>
                <option value="speeding">تجاوز السرعة</option>
                <option value="redlight">مخالفة إشارة حمراء</option>
                <option value="stopsign">مخالفة علامة توقف</option>
                <option value="cellphone">استخدام الهاتف</option>
                <option value="hov">مخالفة مسار HOV</option>
                <option value="reckless">قيادة متهورة</option>
                <option value="other">أخرى</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-900 text-right">المدينة</label>
                <select
                  value={formData.state}
                  onChange={(e) => handleFormChange('state', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                  required
                  dir="rtl"
                >
                  <option value="">اختر المدينة</option>
                  <option value="Riyadh">الرياض</option>
                  <option value="Jeddah">جدة</option>
                  <option value="Mecca">مكة المكرمة</option>
                  <option value="Medina">المدينة المنورة</option>
                  <option value="Dammam">الدمام</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-900 text-right">تاريخ المخالفة</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleFormChange('date', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                  required
                  dir="rtl"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-900 text-right">اسم المحكمة</label>
              <input
                type="text"
                value={formData.court}
                onChange={(e) => handleFormChange('court', e.target.value)}
                placeholder="مثال: محكمة الرياض المرورية"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                required
                dir="rtl"
              />
            </div>

            {formData.violationType === 'speeding' && (
              <div className="grid grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-900 text-right">سرعتك</label>
                  <input
                    type="number"
                    value={formData.speed}
                    onChange={(e) => handleFormChange('speed', e.target.value)}
                    placeholder="120"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                    dir="rtl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-900 text-right">حد السرعة</label>
                  <input
                    type="number"
                    value={formData.speedLimit}
                    onChange={(e) => handleFormChange('speedLimit', e.target.value)}
                    placeholder="100"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                    dir="rtl"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="cdl"
                checked={formData.cdlDriver}
                onChange={(e) => handleFormChange('cdlDriver', e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="cdl" className="text-sm font-medium text-gray-900">
                لدي رخصة قيادة تجارية
              </label>
            </div>

            <div className="bg-green-50 p-4 md:p-6 rounded-lg border border-green-200">
              <div className="flex items-start gap-3 mb-4">
                <DollarSign className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-1 text-right">عرض السعر الفوري</h3>
                  <p className="text-3xl font-bold text-green-600 mb-2 text-right">945 ر.س</p>
                  <p className="text-sm text-gray-600 text-right">رسوم لمرة واحدة • بدون تكاليف خفية • ضمان استرداد الأموال</p>
                </div>
              </div>
              <div className="bg-white p-4 rounded border border-green-200">
                <p className="text-sm font-semibold text-gray-900 mb-2 text-right">التوفير المحتمل:</p>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li className="text-right">• زيادة التأمين: <span className="font-semibold">3,400 ر.س على 3 سنوات</span></li>
                  <li className="text-right">• غرامة المحكمة: <span className="font-semibold">500-1,200 ر.س</span></li>
                  <li className="text-right">• نقاط الرخصة: <span className="font-semibold">احتمال الإيقاف</span></li>
                </ul>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white px-6 md:px-8 py-3 md:py-4 rounded-lg text-base md:text-lg font-semibold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
            >
              <span>احجز قضيتي - 945 ر.س</span>
              <ChevronLeft className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  // Confirmation View
  const ConfirmationView = () => (
    <div className="min-h-screen bg-gray-50 py-6 md:py-12 px-4 md:px-6" dir="rtl">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8 text-center">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
            <CheckCircle className="w-10 h-10 md:w-12 md:h-12 text-green-600" />
          </div>
          
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900">تم تقديم القضية بنجاح!</h2>
          <p className="text-lg md:text-xl text-gray-600 mb-6 md:mb-8">نحن نطابقك مع المحامي المثالي</p>

          <div className="bg-blue-50 p-4 md:p-6 rounded-lg mb-6 md:mb-8 text-right">
            <h3 className="font-bold text-lg mb-4 text-gray-900">ماذا يحدث الآن:</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">1</div>
                <div>
                  <p className="font-semibold text-gray-900">المطابقة الذكية (الآن)</p>
                  <p className="text-sm text-gray-600">ذكاؤنا الاصطناعي يحلل قضيتك ويجد أفضل محامي</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">2</div>
                <div>
                  <p className="font-semibold text-gray-900">تعيين المحامي (خلال ساعة)</p>
                  <p className="text-sm text-gray-600">ستتلقى رسالة من محاميك</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">3</div>
                <div>
                  <p className="font-semibold text-gray-900">تقديم القضية (1-2 يوم)</p>
                  <p className="text-sm text-gray-600">محاميك يقدم الأوراق إلى المحكمة</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">4</div>
                <div>
                  <p className="font-semibold text-gray-900">تحديثات منتظمة</p>
                  <p className="text-sm text-gray-600">ستتلقى إشعارات حول كل تطور</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="bg-blue-600 text-white px-6 md:px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
            >
              <FileText className="w-5 h-5" />
              <span>عرض قضاياي</span>
            </button>
            <button
              onClick={() => setCurrentView('home')}
              className="border-2 border-gray-300 text-gray-700 px-6 md:px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all"
            >
              العودة للرئيسية
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Dashboard View
  const DashboardView = () => (
    <div className="min-h-screen bg-gray-50 py-6 md:py-12 px-4 md:px-6" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => setCurrentView('home')}
          className="text-blue-600 mb-4 md:mb-6 flex items-center gap-2 hover:text-blue-700"
        >
          <ChevronRight className="w-5 h-5" />
          <span>العودة للرئيسية</span>
        </button>

        <div className="mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-gray-900 text-right">قضاياي</h2>
          <p className="text-sm md:text-base text-gray-600 text-right">تتبع وإدارة قضايا المخالفات المرورية</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 md:w-6 md:h-6 text-orange-500" />
              <span className="text-sm md:text-base text-gray-600">القضايا النشطة</span>
            </div>
            <p className="text-3xl md:text-4xl font-bold text-gray-900 text-right">1</p>
          </div>
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-green-500" />
              <span className="text-sm md:text-base text-gray-600">القضايا المكسوبة</span>
            </div>
            <p className="text-3xl md:text-4xl font-bold text-gray-900 text-right">1</p>
          </div>
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />
              <span className="text-sm md:text-base text-gray-600">إجمالي التوفير</span>
            </div>
            <p className="text-3xl md:text-4xl font-bold text-gray-900 text-right">4,500 ر.س</p>
          </div>
        </div>

        <div className="space-y-4 md:space-y-6">
          {mockCases.map((caseItem) => (
            <div
              key={caseItem.id}
              className="bg-white rounded-lg shadow-md p-4 md:p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedCase(caseItem);
                setCurrentView('caseDetail');
              }}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between mb-4 gap-3">
                <div className="text-right">
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1">{caseItem.type}</h3>
                  <p className="text-sm md:text-base text-gray-600">{caseItem.court}</p>
                </div>
                <span className={`px-3 md:px-4 py-1 rounded-full text-xs md:text-sm font-semibold ${
                  caseItem.status === 'مرفوضة' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {caseItem.status}
                </span>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between text-xs md:text-sm mb-2">
                  <span className="font-semibold text-gray-900">{caseItem.progress}%</span>
                  <span className="text-gray-600">تقدم القضية</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${caseItem.progress}%` }}
                  />
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between pt-4 border-t border-gray-200 gap-3">
                <div className="flex items-center gap-4 text-xs md:text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">{caseItem.lawyer}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">{caseItem.messages} رسائل</span>
                  </div>
                </div>
                <ChevronLeft className="w-5 h-5 text-gray-400" />
              </div>

              <div className="mt-3 bg-blue-50 p-3 rounded text-xs md:text-sm">
                <span className="font-semibold text-blue-900">الأخير: </span>
                <span className="text-blue-700">{caseItem.nextUpdate}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 md:mt-8 text-center">
          <button
            onClick={() => setCurrentView('upload')}
            className="bg-blue-600 text-white px-6 md:px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all inline-flex items-center gap-2"
          >
            <Camera className="w-5 h-5" />
            <span>ارفع مخالفة أخرى</span>
          </button>
        </div>
      </div>
    </div>
  );

  // Case Detail View
  const CaseDetailView = () => {
    if (!selectedCase) return null;

    const mockMessages = [
      {
        id: 1,
        sender: 'lawyer',
        name: selectedCase.lawyer,
        time: 'منذ ساعتين',
        message: 'لقد راجعت قضيتك وقدمت الأوراق اللازمة للمحكمة. تم تحديد موعد الجلسة للشهر القادم.'
      },
      {
        id: 2,
        sender: 'user',
        name: 'أنت',
        time: 'منذ ساعة',
        message: 'شكراً لك! هل أحتاج لحضور جلسة المحكمة؟'
      },
      {
        id: 3,
        sender: 'lawyer',
        name: selectedCase.lawyer,
        time: 'منذ 30 دقيقة',
        message: 'لا، لا تحتاج للحضور. سأمثلك في المحكمة. سأبقيك على اطلاع بأي تطورات.'
      }
    ];

    return (
      <div className="min-h-screen bg-gray-50 py-6 md:py-12 px-4 md:px-6" dir="rtl">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => {
              setSelectedCase(null);
              setCurrentView('dashboard');
            }}
            className="text-blue-600 mb-4 md:mb-6 flex items-center gap-2 hover:text-blue-700"
          >
            <ChevronRight className="w-5 h-5" />
            <span>العودة للقضايا</span>
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Case Info */}
            <div className="lg:col-span-2 space-y-4 md:space-y-6">
              <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between mb-6 gap-3">
                  <div className="text-right">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">{selectedCase.type}</h2>
                    <p className="text-sm md:text-base text-gray-600">{selectedCase.court}</p>
                  </div>
                  <span className={`px-3 md:px-4 py-1 rounded-full text-xs md:text-sm font-semibold ${
                    selectedCase.status === 'مرفوضة' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-orange-100 text-orange-700'
                  }`}>
                    {selectedCase.status}
                  </span>
                </div>

                <div className="mb-6">
                  <div className="flex items-center justify-between text-xs md:text-sm mb-2">
                    <span className="font-semibold text-gray-900">{selectedCase.progress}%</span>
                    <span className="text-gray-600">تقدم القضية</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all"
                      style={{ width: `${selectedCase.progress}%` }}
                    />
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="font-semibold text-blue-900 mb-1 text-right">آخر تحديث</p>
                  <p className="text-blue-700 text-right">{selectedCase.nextUpdate}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
                <h3 className="text-lg md:text-xl font-bold mb-4 text-gray-900 flex items-center gap-2 justify-end">
                  <span>الرسائل</span>
                  <MessageSquare className="w-5 h-5" />
                </h3>
                
                <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                  {mockMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        msg.sender === 'lawyer' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {msg.sender === 'lawyer' ? <Users className="w-5 h-5" /> : 'أ'}
                      </div>
                      <div className={`flex-1 ${msg.sender === 'user' ? 'text-left' : 'text-right'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-xs md:text-sm text-gray-900">{msg.name}</span>
                          <span className="text-xs text-gray-500">{msg.time}</span>
                        </div>
                        <div className={`inline-block p-3 rounded-lg ${
                          msg.sender === 'user' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          <p className="text-xs md:text-sm">{msg.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button className="bg-blue-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg hover:bg-blue-700 transition-all text-sm md:text-base">
                    إرسال
                  </button>
                  <input
                    type="text"
                    placeholder="اكتب رسالتك..."
                    className="flex-1 p-2 md:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right text-sm md:text-base"
                    dir="rtl"
                  />
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4 md:space-y-6">
              <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
                <h3 className="font-bold text-base md:text-lg mb-4 text-gray-900 text-right">محاميك</h3>
                <div className="flex items-center gap-3 mb-4">
                  <div>
                    <p className="font-semibold text-gray-900 text-right">{selectedCase.lawyer}</p>
                    <p className="text-xs md:text-sm text-gray-600 text-right">متخصص في القانون المروري</p>
                  </div>
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs md:text-sm text-gray-600">(127 تقييم)</span>
                  <span className="font-semibold text-gray-900">4.9</span>
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                </div>
                <p className="text-xs md:text-sm text-gray-600 mb-4 text-right">نسبة نجاح 98% في القضايا المماثلة</p>
                <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2 text-sm md:text-base">
                  <span>إرسال رسالة</span>
                  <MessageSquare className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
                <h3 className="font-bold text-base md:text-lg mb-4 text-gray-900 text-right">تفاصيل القضية</h3>
                <div className="space-y-3 text-xs md:text-sm">
                  <div>
                    <p className="text-gray-600 text-right">رقم القضية</p>
                    <p className="font-semibold text-gray-900 text-right">#OTR-{selectedCase.id}2024</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-right">تاريخ التقديم</p>
                    <p className="font-semibold text-gray-900 text-right">15 أكتوبر 2024</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-right">موعد الجلسة</p>
                    <p className="font-semibold text-gray-900 text-right">22 نوفمبر 2024</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-right">الاختصاص</p>
                    <p className="font-semibold text-gray-900 text-right">{selectedCase.court}</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-green-900 text-right">محمي</span>
                  <Shield className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-xs md:text-sm text-green-700 text-right">ضمان استرداد الأموال نشط</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render current view
  return (
    <div className="font-sans" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      {currentView === 'home' && <HomeView />}
      {currentView === 'upload' && <UploadView />}
      {currentView === 'form' && <FormView />}
      {currentView === 'confirmation' && <ConfirmationView />}
      {currentView === 'dashboard' && <DashboardView />}
      {currentView === 'caseDetail' && <CaseDetailView />}
    </div>
  );
};

export default OffTheRecordArabic;
