import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, Bug, ShieldAlert, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  tabTitle?: string;
  onResetTab?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class AdminErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error inside Admin Component:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onResetTab) {
      this.props.onResetTab();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full bg-slate-900 border border-rose-500/30 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 text-right dir-rtl">
          {/* Header Warning */}
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6 text-rose-400" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span>تم اصطياد خطأ برمجي في هذا القسم ({this.props.tabTitle || 'لوحة التحكم'})</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                قام نظام الاصطياد الآلي (Error Boundary) بحظر انهيار الشاشة (Black Screen Protection) والحفاظ على باقي أجزاء الموقع تعمل بأمان.
              </p>
            </div>
          </div>

          {/* Error Details Accordion */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs space-y-2 overflow-x-auto text-left dir-ltr">
            <div className="text-rose-400 font-bold flex items-center gap-1.5 dir-rtl text-right">
              <Bug className="w-4 h-4" />
              <span>تفاصيل الخطأ التشخيصي (Diagnostic Log):</span>
            </div>
            <div className="text-slate-300 font-semibold selection:bg-rose-900">
              {this.state.error?.toString() || 'Unknown React Rendering Error'}
            </div>
            {this.state.errorInfo?.componentStack && (
              <pre className="text-[11px] text-slate-500 whitespace-pre-wrap max-h-40 overflow-y-auto leading-relaxed pt-2 border-t border-slate-900">
                {this.state.errorInfo.componentStack}
              </pre>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <button
              onClick={this.handleReset}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/30 transition hover:scale-105"
            >
              <RefreshCw className="w-4 h-4" />
              <span>إعادة تحميل التبويب (Reload Component)</span>
            </button>

            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              <span>تحديث الصفحة بالكامل (Hard Refresh)</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
