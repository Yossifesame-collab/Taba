import React, { useState } from 'react';
import { ArrowRight, Lock, ShieldCheck } from 'lucide-react';
import { useTaba } from '../../context/TabaContext';

export const AdminLogin: React.FC = () => {
  const {
    settings,
    authReady,
    authError,
    loginWithGoogle,
    setCurrentView,
  } = useTaba();

  const [localError, setLocalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const logoSrc = settings.brandLogoUrl || '/assets/aistudio/IMG_0035_58f5bab1.jpeg';
  const displayedError = localError || authError;

  const handleGoogleLogin = async () => {
    setLocalError(null);
    setLoading(true);
    const res = await loginWithGoogle();
    setLoading(false);
    if (!res.ok && res.error) {
      setLocalError(res.error);
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-center justify-between">
          <img
            src={logoSrc}
            alt="شعار معرض طابا"
            className="h-12 w-auto object-contain"
          />
          <button
            type="button"
            onClick={() => setCurrentView('store')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#1D4ED8] cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة للمتجر</span>
          </button>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-slate-900">
            <Lock className="w-5 h-5 text-[#1D4ED8]" />
            <h1 className="text-xl font-bold">بوابة إدارة معرض طابا</h1>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            دخول محمي وسحابي خاص بمالك المعرض والمديرين والموظفين المصرح لهم فقط عبر حساب Google.
          </p>
        </div>

        {!authReady ? (
          <div className="py-8 flex flex-col items-center justify-center gap-3 text-xs text-slate-600">
            <div className="w-7 h-7 rounded-full border-2 border-[#1D4ED8] border-t-transparent animate-spin" />
            <span>جاري التحقق من جلسة الإدارة...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedError && (
              <div className="text-xs font-medium text-[#DC2626] bg-red-50 border border-red-200 rounded-lg p-3 leading-relaxed">
                {displayedError}
              </div>
            )}

            <button
              type="button"
              disabled={loading}
              onClick={() => void handleGoogleLogin()}
              className="w-full py-3 px-4 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:opacity-60 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2.5 cursor-pointer shadow-sm"
            >
              <ShieldCheck className="w-5 h-5" />
              <span>{loading ? 'جاري فتح نافذة تسجيل الدخول...' : 'تسجيل الدخول بحساب Google'}</span>
            </button>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-[11px] text-slate-600 space-y-1 leading-relaxed">
              <div className="font-bold text-slate-800">ملاحظة الصلاحيات والأمان:</div>
              <div>
                • يمتلك حساب المالك الرئيسي صلاحية الدخول الكاملة وإضافة حسابات الفريق.
              </div>
              <div>
                • يجب على المالك إضافة بريد الموظف (Gmail) من قسم «الموظفون والسجل» ليتمكن من الدخول.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

