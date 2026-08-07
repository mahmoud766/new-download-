import React, { useState, useEffect } from 'react';
import {
  Mail,
  Server,
  ShieldCheck,
  Zap,
  AlertTriangle,
  Send,
  Save,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Sliders,
  Bell,
  Clock,
  Key,
  Globe,
  Database,
  Activity,
  Check,
  Terminal,
  HelpCircle,
} from 'lucide-react';
import { SmtpConfig, EmailAlertSettings, SmtpTestResult, SupportedLanguage } from '../../types';
import {
  getSmtpConfig,
  saveSmtpConfig,
  fetchSmtpConfigFromDb,
  getEmailAlertSettings,
  saveEmailAlertSettings,
  fetchEmailAlertsFromDb,
} from '../../lib/adminStorage';

interface Props {
  currentLang: SupportedLanguage;
  onShowToast: (msg: string) => void;
}

interface AlertLogEntry {
  id: string;
  eventType: 'High Error Rate' | 'DB Disconnect' | 'Proxy Downtime' | 'Test Dispatch' | 'Rate Limit Spike';
  recipient: string;
  status: 'SENT' | 'FAILED' | 'PENDING';
  message: string;
  timestamp: string;
  latencyMs: number;
}

export const EmailNotificationsTab: React.FC<Props> = ({ currentLang, onShowToast }) => {
  const [smtp, setSmtp] = useState<SmtpConfig>(getSmtpConfig());
  const [alerts, setAlerts] = useState<EmailAlertSettings>(getEmailAlertSettings());

  useEffect(() => {
    fetchSmtpConfigFromDb().then((s) => setSmtp(s));
    fetchEmailAlertsFromDb().then((a) => setAlerts(a));
  }, []);

  const [testRecipient, setTestRecipient] = useState<string>('admin@omnifetch.com');
  const [testType, setTestType] = useState<'Connection Test' | 'High Error Rate Alert' | 'DB Connection Failure Alert'>('Connection Test');
  const [sendingTest, setSendingTest] = useState<boolean>(false);
  const [lastTestResult, setLastTestResult] = useState<SmtpTestResult | null>(null);

  const [newRecipientInput, setNewRecipientInput] = useState<string>('');

  const [logs, setLogs] = useState<AlertLogEntry[]>([
    {
      id: 'log_1',
      eventType: 'Test Dispatch',
      recipient: 'admin@omnifetch.com',
      status: 'SENT',
      message: 'SMTP handshake and TLS handshake successful',
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toLocaleTimeString(),
      latencyMs: 142,
    },
    {
      id: 'log_2',
      eventType: 'High Error Rate',
      recipient: 'devops@omnifetch.com',
      status: 'SENT',
      message: 'TikTok Scraper API error rate reached 5.2% (Threshold: 5.0%)',
      timestamp: new Date(Date.now() - 1000 * 60 * 120).toLocaleTimeString(),
      latencyMs: 185,
    },
    {
      id: 'log_3',
      eventType: 'DB Disconnect',
      recipient: 'admin@omnifetch.com',
      status: 'SENT',
      message: 'Firestore db connection health check verified',
      timestamp: new Date(Date.now() - 1000 * 3600 * 6).toLocaleTimeString(),
      latencyMs: 98,
    },
  ]);

  // SMTP Presets
  const handleApplyPreset = (preset: 'mailgun' | 'sendgrid' | 'ses' | 'gmail' | 'postmark') => {
    if (preset === 'mailgun') {
      setSmtp((prev) => ({
        ...prev,
        host: 'smtp.mailgun.org',
        port: 587,
        secure: true,
        user: 'postmaster@mg.omnifetch.com',
      }));
    } else if (preset === 'sendgrid') {
      setSmtp((prev) => ({
        ...prev,
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: true,
        user: 'apikey',
      }));
    } else if (preset === 'ses') {
      setSmtp((prev) => ({
        ...prev,
        host: 'email-smtp.us-east-1.amazonaws.com',
        port: 587,
        secure: true,
      }));
    } else if (preset === 'gmail') {
      setSmtp((prev) => ({
        ...prev,
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
      }));
    } else if (preset === 'postmark') {
      setSmtp((prev) => ({
        ...prev,
        host: 'smtp.postmarkapp.com',
        port: 2525,
        secure: true,
      }));
    }
    onShowToast(`تم تطبيق إعدادات خادم ${preset.toUpperCase()} الفورية!`);
  };

  const handleSaveAll = () => {
    saveSmtpConfig(smtp);
    saveEmailAlertSettings(alerts);
    onShowToast('تم حفظ إعدادات SMTP وقواعد التنبيهات الإلكترونية بنجاح!');
  };

  const handleAddRecipient = () => {
    if (!newRecipientInput.trim() || !newRecipientInput.includes('@')) {
      onShowToast('يرجى كتابة عنوان بريد إلكتروني صحيح.');
      return;
    }
    if (alerts.recipientEmails.includes(newRecipientInput.trim())) {
      onShowToast('البريد موجود بالفعل في قائمة المستلمين.');
      return;
    }
    const updated = [...alerts.recipientEmails, newRecipientInput.trim()];
    setAlerts({ ...alerts, recipientEmails: updated });
    setNewRecipientInput('');
    onShowToast('تمت إضافة البريد المستلم بنجاح.');
  };

  const handleRemoveRecipient = (emailToRemove: string) => {
    const updated = alerts.recipientEmails.filter((e) => e !== emailToRemove);
    setAlerts({ ...alerts, recipientEmails: updated });
    onShowToast('تم حذف البريد المستلم من القائمة.');
  };

  const handleDispatchTestEmail = async () => {
    if (!testRecipient) {
      onShowToast('يرجى تحديد بريد المستلم لاختبار الإرسال.');
      return;
    }

    setSendingTest(true);
    setLastTestResult(null);

    try {
      const res = await fetch('/api/admin/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: smtp.host,
          port: smtp.port,
          recipient: testRecipient,
          testType,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setLastTestResult({
          success: true,
          message: data.message,
          timestamp: data.timestamp,
          latencyMs: data.latencyMs,
        });

        // Add to log
        const newLog: AlertLogEntry = {
          id: 'log_' + Date.now(),
          eventType: 'Test Dispatch',
          recipient: testRecipient,
          status: 'SENT',
          message: data.message,
          timestamp: new Date().toLocaleTimeString(),
          latencyMs: data.latencyMs || 120,
        };
        setLogs((prev) => [newLog, ...prev]);

        onShowToast('تم إرسال بريد التنبيه التجريبي واختبار خادم SMTP بنجاح!');
      } else {
        setLastTestResult({
          success: false,
          message: data.message || 'فشل الاتصال بخادم SMTP',
          timestamp: new Date().toISOString(),
        });
        onShowToast('فشل اختبار إرسال البريد الإلكتروني.');
      }
    } catch (err: any) {
      setLastTestResult({
        success: false,
        message: err.message || 'خطأ في شبكة الاتصال بالسيرفر',
        timestamp: new Date().toISOString(),
      });
      onShowToast('فشل في إجراء اختبار بريد SMTP.');
    } finally {
      setSendingTest(false);
    }
  };

  const handleSimulateAlert = (eventType: AlertLogEntry['eventType']) => {
    const newLog: AlertLogEntry = {
      id: 'log_' + Date.now(),
      eventType,
      recipient: alerts.recipientEmails[0] || 'admin@omnifetch.com',
      status: 'SENT',
      message: `[SIMULATED ALERT] Real-time threshold rule triggered for ${eventType}`,
      timestamp: new Date().toLocaleTimeString(),
      latencyMs: Math.floor(Math.random() * 50) + 110,
    };
    setLogs((prev) => [newLog, ...prev]);
    onShowToast(`تم محاكاة تنبيه إلكتروني مباشر لـ (${eventType})!`);
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between bg-slate-900 p-5 rounded-2xl border border-slate-800 gap-4">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <span>تنبيهات البريد الإلكتروني و إعدادات SMTP (Email Alerts & System Health Monitoring)</span>
            <span className="px-2.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[10px] font-mono border border-purple-500/30 font-bold flex items-center gap-1">
              <Mail className="w-3 h-3 text-purple-400" /> SMTP Dispatcher 2.0
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            إعداد خادم SMTP للتنبيهات التلقائية عند ارتفاع معدل الأخطاء، انقطاع اتصال قاعدة البيانات، أو توقف خادم جلب مقاطع الفيديو (Blob Proxy).
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-lg shadow-purple-600/30 transition shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>حفظ التغييرات</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: SMTP Configuration Form */}
        <div className="lg:col-span-6 bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
              <Server className="w-4 h-4" />
              <span>إعدادات خادم SMTP (Server Connection Details)</span>
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">TLS / SSL Secured</span>
          </div>

          {/* Quick Presets */}
          <div className="space-y-2">
            <label className="text-xs text-slate-400 font-bold block">نماذج سريعة لمزودي الخدمة (Presets):</label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { key: 'mailgun', name: 'Mailgun' },
                { key: 'sendgrid', name: 'SendGrid' },
                { key: 'ses', name: 'Amazon SES' },
                { key: 'gmail', name: 'Gmail SMTP' },
                { key: 'postmark', name: 'Postmark' },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => handleApplyPreset(item.key as any)}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-purple-500/50 text-[11px] font-mono text-slate-300 hover:text-white transition"
                >
                  + {item.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Host */}
            <div className="space-y-1">
              <label className="text-slate-300 font-bold block">عنوان خادم الـ SMTP (Host)</label>
              <input
                type="text"
                value={smtp.host}
                onChange={(e) => setSmtp({ ...smtp, host: e.target.value })}
                placeholder="smtp.mailgun.org"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-purple-300 font-mono focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Port */}
            <div className="space-y-1">
              <label className="text-slate-300 font-bold block">منفذ الاتصال (Port)</label>
              <input
                type="number"
                value={smtp.port}
                onChange={(e) => setSmtp({ ...smtp, port: parseInt(e.target.value) || 587 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Username */}
            <div className="space-y-1">
              <label className="text-slate-300 font-bold block">اسم المستخدم / API Username</label>
              <input
                type="text"
                value={smtp.user}
                onChange={(e) => setSmtp({ ...smtp, user: e.target.value })}
                placeholder="postmaster@mg.domain.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-slate-300 font-bold block">كلمة المرور / Secret Token</label>
              <input
                type="password"
                value={smtp.pass}
                onChange={(e) => setSmtp({ ...smtp, pass: e.target.value })}
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Sender Email */}
            <div className="space-y-1">
              <label className="text-slate-300 font-bold block">بريد المرسل (From Email)</label>
              <input
                type="email"
                value={smtp.senderEmail}
                onChange={(e) => setSmtp({ ...smtp, senderEmail: e.target.value })}
                placeholder="alerts@omnifetch.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Sender Name */}
            <div className="space-y-1">
              <label className="text-slate-300 font-bold block">اسم المرسل (From Name)</label>
              <input
                type="text"
                value={smtp.senderName}
                onChange={(e) => setSmtp({ ...smtp, senderName: e.target.value })}
                placeholder="OmniFetch Monitoring Bot"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Secure SSL/TLS Toggle */}
          <div className="flex items-center justify-between bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="text-xs font-bold text-white block">تشفير SSL / STARTTLS الأمني</span>
                <span className="text-[10px] text-slate-500 block">تفعيل التشفير أثناء إرسال وتداول البيانات</span>
              </div>
            </div>
            <button
              onClick={() => setSmtp({ ...smtp, secure: !smtp.secure })}
              className={`w-11 h-6 rounded-full transition-colors p-0.5 ${
                smtp.secure ? 'bg-emerald-500' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  smtp.secure ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Right Column: Real-time Alert Rules & Thresholds */}
        <div className="lg:col-span-6 bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <span>قواعد وقنوات التنبيه الفوري (Critical Alert Triggers)</span>
            </h3>
            <button
              onClick={() => setAlerts({ ...alerts, enabled: !alerts.enabled })}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition ${
                alerts.enabled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-500'
              }`}
            >
              {alerts.enabled ? '● نظام التنبيهات مفعّل' : '○ التنبيهات معطلة'}
            </button>
          </div>

          {/* Recipient Emails Manager */}
          <div className="space-y-2">
            <label className="text-xs text-slate-300 font-bold block">قائمة مستلمي التنبيهات الطارئة:</label>
            <div className="flex gap-2">
              <input
                type="email"
                value={newRecipientInput}
                onChange={(e) => setNewRecipientInput(e.target.value)}
                placeholder="devops@omnifetch.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
              <button
                onClick={handleAddRecipient}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shrink-0 transition"
              >
                + إضافة بريد
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {alerts.recipientEmails.map((email) => (
                <span
                  key={email}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-amber-300 font-mono flex items-center gap-2"
                >
                  <span>{email}</span>
                  <button
                    onClick={() => handleRemoveRecipient(email)}
                    className="text-slate-500 hover:text-red-400 transition"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Alert Trigger Rules */}
          <div className="space-y-2.5">
            {/* Rule 1: High Error Rate */}
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white">تنبيه عند ارتفاع نسبة الأخطاء (High Error Rate)</span>
                </div>
                <button
                  onClick={() => setAlerts({ ...alerts, alertOnHighErrorRate: !alerts.alertOnHighErrorRate })}
                  className={`w-9 h-5 rounded-full transition-colors p-0.5 ${
                    alerts.alertOnHighErrorRate ? 'bg-amber-500' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      alerts.alertOnHighErrorRate ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {alerts.alertOnHighErrorRate && (
                <div className="space-y-1 pt-1 border-t border-slate-900">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>حد إرسال التنبيه عند خطأ API:</span>
                    <span className="text-amber-400 font-bold font-mono">{alerts.errorRateThresholdPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="0.5"
                    value={alerts.errorRateThresholdPercent}
                    onChange={(e) => setAlerts({ ...alerts, errorRateThresholdPercent: parseFloat(e.target.value) })}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              )}
            </div>

            {/* Rule 2: DB Connection Failure */}
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-red-400" />
                <div>
                  <span className="text-xs font-bold text-white block">انقطاع قاعدة البيانات (Database Failure)</span>
                  <span className="text-[10px] text-slate-500 block">إرسال بريد طارئ فوراً عند تعذر الوصول لـ Firestore / SQL</span>
                </div>
              </div>
              <button
                onClick={() => setAlerts({ ...alerts, alertOnDbConnectionFailure: !alerts.alertOnDbConnectionFailure })}
                className={`w-9 h-5 rounded-full transition-colors p-0.5 ${
                  alerts.alertOnDbConnectionFailure ? 'bg-red-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    alerts.alertOnDbConnectionFailure ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Rule 3: Proxy Downtime */}
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-sky-400" />
                <div>
                  <span className="text-xs font-bold text-white block">توقف خادم محول الفيديو (Proxy Downtime)</span>
                  <span className="text-[10px] text-slate-500 block">تنبيه عند فشل استجابة /api/proxy/health أو ارتفاع البطء</span>
                </div>
              </div>
              <button
                onClick={() => setAlerts({ ...alerts, alertOnProxyDowntime: !alerts.alertOnProxyDowntime })}
                className={`w-9 h-5 rounded-full transition-colors p-0.5 ${
                  alerts.alertOnProxyDowntime ? 'bg-sky-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    alerts.alertOnProxyDowntime ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Rule 4: Rate Limit Spike */}
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-400" />
                <div>
                  <span className="text-xs font-bold text-white block">قفزات معدل الطلبات (Rate Limit Spike)</span>
                  <span className="text-[10px] text-slate-500 block">تنبيه عند رصد محاولات هجمات DDoS أو ضغط مكثف</span>
                </div>
              </div>
              <button
                onClick={() => setAlerts({ ...alerts, alertOnRateLimitSpike: !alerts.alertOnRateLimitSpike })}
                className={`w-9 h-5 rounded-full transition-colors p-0.5 ${
                  alerts.alertOnRateLimitSpike ? 'bg-purple-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    alerts.alertOnRateLimitSpike ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Live SMTP Tester & Test Email Dispatcher Section */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-3">
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>اختبار اتصال SMTP وإرسال رسالة تجريبية (Live SMTP Test Dispatcher)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              قم بتحديد عنوان بريد لاختبار سلامة الاتصال مع سيرفر الـ SMTP وتأكيد وصول التنبيهات.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleSimulateAlert('High Error Rate')}
              className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-bold border border-amber-500/30 transition"
            >
              محاكاة تنبيه نسبة الأخطاء
            </button>
            <button
              onClick={() => handleSimulateAlert('DB Disconnect')}
              className="px-3 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 text-xs font-bold border border-red-500/30 transition"
            >
              محاكاة تنبيه فصل قاعدة البيانات
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-6 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">البريد التجريبي المستهدف:</label>
                <input
                  type="email"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  placeholder="admin@omnifetch.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">نوع التنبيه للتجربة:</label>
                <select
                  value={testType}
                  onChange={(e) => setTestType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                >
                  <option value="Connection Test">اختبار ربط عادي (Connection Check)</option>
                  <option value="High Error Rate Alert">تنبيه خطأ النظام (High Error Rate Alert)</option>
                  <option value="DB Connection Failure Alert">تنبيه انقطاع الـ DB (DB Failure Alert)</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleDispatchTestEmail}
              disabled={sendingTest}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2 transition"
            >
              <Send className={`w-4 h-4 ${sendingTest ? 'animate-bounce' : ''}`} />
              <span>{sendingTest ? 'جاري إجراء المصافحة والإرسال...' : 'إرسال بريد تجريبي الآن (Dispatch Test Email)'}</span>
            </button>
          </div>

          {/* Test Response Console Window */}
          <div className="lg:col-span-6 bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 pb-2 border-b border-slate-900 text-[11px]">
              <span className="flex items-center gap-1.5 text-purple-400 font-bold">
                <Terminal className="w-3.5 h-3.5" />
                <span>سجل استجابة خادم الـ SMTP (Console Log)</span>
              </span>
              <span>{lastTestResult?.timestamp || 'Ready'}</span>
            </div>

            {sendingTest ? (
              <div className="py-6 text-center text-purple-400 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto" />
                <p className="text-xs">Connecting to {smtp.host}:{smtp.port}...</p>
              </div>
            ) : lastTestResult ? (
              <div className="space-y-1.5 text-[11px]">
                <div className={`flex items-center gap-2 font-bold ${lastTestResult.success ? 'text-emerald-400' : 'text-red-400'}`}>
                  {lastTestResult.success ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  <span>{lastTestResult.message}</span>
                </div>
                {lastTestResult.latencyMs && (
                  <div className="text-slate-400 text-[10px]">
                    Handshake Latency: <span className="text-purple-300 font-bold">{lastTestResult.latencyMs} ms</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-6 text-center text-slate-600 text-xs">
                اضغط على إرسال لتفحص كود الاستجابة وزمن الوصول الحقيقي.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dispatch History Table */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-black text-white flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400" />
            <span>سجل التنبيهات والإرسال الأخير (Notification Dispatch Log)</span>
          </span>
          <span className="text-xs text-slate-400 font-normal">إجمالي {logs.length} سجلات</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-bold bg-slate-950/50">
                <th className="p-3">نوع الحدث</th>
                <th className="p-3">المستلم</th>
                <th className="p-3">الحالة</th>
                <th className="p-3">التفاصيل / الرسالة</th>
                <th className="p-3">التوقيت</th>
                <th className="p-3">السرعة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition">
                  <td className="p-3 font-bold text-white">
                    <span className="px-2 py-0.5 rounded bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[11px]">
                      {log.eventType}
                    </span>
                  </td>
                  <td className="p-3 text-amber-300">{log.recipient}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                      ● {log.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-300 max-w-xs truncate font-sans">{log.message}</td>
                  <td className="p-3 text-slate-400">{log.timestamp}</td>
                  <td className="p-3 text-purple-300 font-bold">{log.latencyMs} ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
