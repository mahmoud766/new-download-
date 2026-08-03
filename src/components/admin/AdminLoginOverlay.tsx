import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Mail,
  Key,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  AlertCircle,
  Loader2,
  Sparkles,
  X,
  CheckCircle2,
  Globe
} from 'lucide-react';
import {
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  googleProvider,
  syncUserProfile
} from '../../lib/firebase';
import { SupportedLanguage } from '../../types';

interface Props {
  currentLang: SupportedLanguage;
  onClose: () => void;
  onAuthenticated: () => void;
  onShowToast: (msg: string) => void;
}

export const AdminLoginOverlay: React.FC<Props> = ({
  currentLang,
  onClose,
  onAuthenticated,
  onShowToast,
}) => {
  const [emailInput, setEmailInput] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Helper to format email if username alone was entered
  const formatEmail = (raw: string): string => {
    const trimmed = raw.trim();
    if (!trimmed) return '';
    if (trimmed.includes('@')) return trimmed;
    return `${trimmed.toLowerCase()}@omnifetch.com`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const formattedEmail = formatEmail(emailInput);
    if (!formattedEmail) {
      setErrorMessage('يرجى إدخال البريد الإلكتروني أو اسم المستخدم (Please enter email or username)');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل (Password must be at least 6 chars)');
      return;
    }

    setLoading(true);

    try {
      if (isRegisterMode) {
        // Register new admin in Firebase Auth
        const cred = await createUserWithEmailAndPassword(auth, formattedEmail, password);
        if (cred.user) {
          await syncUserProfile(cred.user);
          onShowToast('تم إنشاء حساب المشرف بنجاح وتأمينه عبر Firebase Auth!');
          onAuthenticated();
        }
      } else {
        // Sign in existing admin
        const cred = await signInWithEmailAndPassword(auth, formattedEmail, password);
        if (cred.user) {
          await syncUserProfile(cred.user);
          onShowToast('تم تسجيل الدخول بنجاح إلى لوحة التحكم!');
          onAuthenticated();
        }
      }
    } catch (err: any) {
      console.error('Firebase Auth Error:', err);
      let friendlyError = 'فشل تسجيل الدخول. يرجى التأكد من كلمة المرور والبريد.';
      if (err.code === 'auth/user-not-found') {
        friendlyError = 'اسم المستخدم / البريد غير موجود. يمكنك إنشاء حساب جديد عبر التبديل لخيار التسجيل.';
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        friendlyError = 'كلمة المرور غير صحيحة أو البيانات غير متطابقة.';
      } else if (err.code === 'auth/email-already-in-use') {
        friendlyError = 'هذا البريد مسجل بالفعل، يرجى اختيار تسجيل الدخول.';
      } else if (err.code === 'auth/weak-password') {
        friendlyError = 'كلمة المرور ضعيفة جداً. استخدم 6 أحرف على الأقل.';
      } else if (err.message) {
        friendlyError = `خطأ المصادقة: ${err.message}`;
      }
      setErrorMessage(friendlyError);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await syncUserProfile(result.user);
        onShowToast('تم تسجيل دخول المشرف عبر Google Auth بنجاح!');
        onAuthenticated();
      }
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      setErrorMessage('تعذر تسجيل الدخول عبر Google. يرجى استخدام اسم المستخدم وكلمة المرور.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmailInput('admin@omnifetch.com');
    setPassword('AdminSecure2026!');
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-slate-100 animate-in fade-in zoom-in duration-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          title="إغلاق والعودة للموقع"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Security Header Badge */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30 shadow-lg shadow-purple-600/20">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white flex items-center justify-center gap-2">
              <span>مصادقة المشرفين (Admin Portal)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              منطقة محمية - يتطلب تسجيل الدخول عبر Firebase Auth للوصول إلى إعدادات الموقع.
            </p>
          </div>
        </div>

        {/* SSL & Firebase Security Tag */}
        <div className="flex items-center justify-center gap-2 py-2 px-3 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Firebase Auth 256-Bit Encrypted Portal</span>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed font-semibold">{errorMessage}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 font-bold mb-1.5">
              اسم المستخدم أو البريد الإلكتروني (Username / Email)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute right-3.5 top-3.5 text-slate-500" />
              <input
                type="text"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="admin أو admin@omnifetch.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pr-10 pl-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1.5">
              كلمة المرور المشفرة (Secure Password)
            </label>
            <div className="relative">
              <Key className="w-4 h-4 absolute right-3.5 top-3.5 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pr-10 pl-10 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3.5 top-3.5 text-slate-500 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isRegisterMode ? (
              <UserPlus className="w-4 h-4" />
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            <span>
              {loading
                ? 'جاري التوثيق...'
                : isRegisterMode
                ? 'إنشاء حساب مشرف جديد'
                : 'دخول لوحة التحكم'}
            </span>
          </button>
        </form>

        {/* Secondary Actions */}
        <div className="space-y-3 pt-2 border-t border-slate-800 text-center">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setErrorMessage(null);
              }}
              className="text-purple-400 hover:text-purple-300 transition"
            >
              {isRegisterMode
                ? 'لديك حساب مشرف بالفعل؟ تسجيل الدخول'
                : 'إنشاء / تسجيل حساب مشرف جديد'}
            </button>

            <button
              type="button"
              onClick={handleFillDemo}
              className="text-slate-400 hover:text-amber-400 text-[11px] font-mono transition"
            >
              تعبئة بيانات تجريبية
            </button>
          </div>

          {/* Google Quick Sign-In Option */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-2.5 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center gap-2 transition"
          >
            <Globe className="w-4 h-4 text-purple-400" />
            <span>تسجيل الدخول عبر Google Admin</span>
          </button>
        </div>
      </div>
    </div>
  );
};
