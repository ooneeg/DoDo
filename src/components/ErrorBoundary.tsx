import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'حدث خطأ غير متوقع في التطبيق.',
    };
  }

  componentDidCatch(error: Error) {
    console.error('App ErrorBoundary caught error:', error);
  }

  render() {
    if (this.state.hasError) {
      let friendly = this.state.message;
      if (friendly.includes('Missing or insufficient permissions')) {
        friendly =
          'تعذر الوصول لبعض بيانات السحابة بسبب صلاحيات Firestore أو انتهاء الجلسة. يمكنك إعادة التحميل أو المتابعة محلياً.';
      }
      return (
        <div
          dir="rtl"
          className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-slate-900"
        >
          <div className="max-w-lg w-full rounded-2xl border border-amber-300 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 text-amber-800">
              <AlertTriangle className="h-6 w-6 shrink-0" />
              <h1 className="text-base font-bold">حدث خطأ غير متوقع</h1>
            </div>
            <p className="text-xs leading-relaxed text-slate-700 break-words">{friendly}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800"
            >
              <RotateCcw className="h-4 w-4" />
              <span>إعادة تحميل التطبيق</span>
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
