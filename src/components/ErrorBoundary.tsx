import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'حدث خطأ غير متوقع في الاتصال بالنظام',
    };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, info);
  }

  override render() {
    if (this.state.hasError) {
      let friendlyMsg = 'حدث خطأ غير متوقع أثناء تشغيل المتجر أو مزامنة البيانات.';
      if (
        this.state.errorMessage.includes('permission-denied') ||
        this.state.errorMessage.includes('Missing or insufficient permissions')
      ) {
        friendlyMsg =
          'تعذر إتمام العملية بسبب صلاحيات الوصول في قاعدة البيانات. يرجى تسجيل الدخول بحساب مخوّل أو إعادة المحاولة.';
      } else if (this.state.errorMessage.includes('Quota exceeded')) {
        friendlyMsg = 'تم بلوغ الحد اليومي المجاني لقراءة البيانات. يرجى المحاولة لاحقًا.';
      }

      return (
        <div
          dir="rtl"
          className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-4"
        >
          <div className="max-w-md w-full rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-50 text-[#DC2626] flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h1 className="text-lg font-bold text-slate-900">عذرًا، تعذر تحميل الصفحة</h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{friendlyMsg}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs sm:text-sm font-bold cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>إعادة تحميل الموقع</span>
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
