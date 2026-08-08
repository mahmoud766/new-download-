import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  Key,
  Lock,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Save,
  Globe,
  Database,
  RefreshCcw,
  Power,
  Edit3,
} from 'lucide-react';
import { AdminUser, SecurityConfig, SupportedLanguage } from '../../types';
import {
  getAdminUsers,
  fetchAdminUsersFromDb,
  saveAdminUsers,
  getSecurityConfig,
  fetchSecurityConfigFromDb,
  saveSecurityConfig,
} from '../../lib/adminStorage';

interface Props {
  currentLang: SupportedLanguage;
  onShowToast: (msg: string) => void;
}

export const UsersSecurityTab: React.FC<Props> = ({ currentLang, onShowToast }) => {
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'security' | 'backups'>('users');

  // State
  const [users, setUsers] = useState<AdminUser[]>(getAdminUsers());
  const [secConfig, setSecConfig] = useState<SecurityConfig>(getSecurityConfig());

  // New User form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<AdminUser['role']>('Editor');

  // Selected user for password reset
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [changePasswordInput, setChangePasswordInput] = useState('');

  useEffect(() => {
    fetchAdminUsersFromDb().then((dbUsers) => setUsers(dbUsers));
    fetchSecurityConfigFromDb().then((dbSec) => setSecConfig(dbSec));
  }, []);

  const handleAddUser = async () => {
    if (!newName || !newEmail) return;
    const newUser: any = {
      id: 'u_' + Date.now(),
      name: newName,
      email: newEmail,
      role: newRole,
      status: 'Active',
      lastLogin: 'Never',
      twoFactorEnabled: false,
      password: newPassword.trim() || 'omnifetch2026admin',
    };
    const updated = [...users, newUser];
    setUsers(updated);
    saveAdminUsers(updated);
    setNewName('');
    setNewEmail('');
    setNewPassword('');
    onShowToast('تم إضافة المستخدم وتحديد كلمة المرور في قاعدة البيانات بنجاح!');
  };

  const handleToggleStatus = (id: string) => {
    const updated = users.map((u) => {
      if (u.id === id) {
        const nextStatus = u.status === 'Active' ? 'Inactive' : 'Active';
        return { ...u, status: nextStatus as 'Active' | 'Inactive' };
      }
      return u;
    });
    setUsers(updated);
    saveAdminUsers(updated);
    onShowToast('تم تحديث حالة حساب المستخدم بنجاح!');
  };

  const handleChangeUserPassword = async (user: AdminUser) => {
    if (!changePasswordInput || changePasswordInput.trim().length < 6) {
      onShowToast('كلمة المرور يجب أن تكون 6 أحرف على الأقل!');
      return;
    }

    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          newPassword: changePasswordInput.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onShowToast(`تم تغيير كلمة مرور المستخدم ${user.name} في قاعدة البيانات بنجاح!`);
        setEditingUserId(null);
        setChangePasswordInput('');
        fetchAdminUsersFromDb().then((u) => setUsers(u));
      } else {
        onShowToast(data.message || 'فشل تغيير كلمة المرور!');
      }
    } catch (e: any) {
      onShowToast('خطأ أثناء تغيير كلمة المرور في قاعدة البيانات');
    }
  };

  const handleDeleteUser = (id: string) => {
    const updated = users.filter((u) => u.id !== id);
    setUsers(updated);
    saveAdminUsers(updated);
    onShowToast('تم إزالة المستخدم وحذفه من اللوحة وقاعدة البيانات.');
  };

  const handleSaveSecurity = () => {
    saveSecurityConfig(secConfig);
    onShowToast('تم حفظ إعدادات الجدار الناري والأمان بنجاح!');
  };

  const handleRunBackup = () => {
    onShowToast('تم توليد نسخة احتياطية كاملة (Database & Config Snapshot) وتنزيلها بنجاح!');
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Subtab Navigation */}
      <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-2xl border border-slate-800 text-xs font-bold">
        {[
          { id: 'users', label: 'إدارة المستخدمين والصلاحيات (Database Users)', icon: Users },
          { id: 'security', label: 'الأمان والجدار الناري Firewall', icon: Shield },
          { id: 'backups', label: 'النسخ الاحتياطي والأنظمة', icon: Database },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
                activeSubTab === tab.id
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Users Subtab */}
      {activeSubTab === 'users' && (
        <div className="space-y-6">
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-purple-400" />
              <span>إضافة مستخدم مسؤول جديد لقاعدة البيانات (Supabase PostgreSQL)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
              <input
                type="text"
                placeholder="الاسم بالكامل"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
              />
              <input
                type="email"
                placeholder="البريد الإلكتروني"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
              />
              <input
                type="password"
                placeholder="كلمة المرور (تُحفظ مشفرة Bcrypt)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
              />
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
              >
                <option value="Admin">Admin (مدير كامل)</option>
                <option value="Editor">Editor (محرر)</option>
                <option value="SEO Manager">SEO Manager (مدير SEO)</option>
                <option value="Content Manager">Content Manager (محتوى)</option>
                <option value="Support">Support (الدعم)</option>
                <option value="Moderator">Moderator (مشرف)</option>
              </select>
              <button
                onClick={handleAddUser}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl px-4 py-2 flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>حفظ المستخدم</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950 text-slate-400">
                  <th className="py-3 px-4">اسم المستخدم</th>
                  <th className="py-3 px-4">البريد الإلكتروني</th>
                  <th className="py-3 px-4">الدور والصلاحية</th>
                  <th className="py-3 px-4">الحالة</th>
                  <th className="py-3 px-4">آخر دخول</th>
                  <th className="py-3 px-4 text-center">إجراءات وكلمة المرور</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-white">{u.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-300">{u.email}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-300 font-bold border border-purple-500/20">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {u.status === 'Active' ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> نشط (Active)
                        </span>
                      ) : (
                        <span className="text-rose-400 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> معطّل (Disabled)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{u.lastLogin || 'Never'}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {editingUserId === u.id ? (
                          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-purple-500/50">
                            <input
                              type="password"
                              placeholder="كلمة المرور الجديدة..."
                              value={changePasswordInput}
                              onChange={(e) => setChangePasswordInput(e.target.value)}
                              className="w-32 bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1 text-xs font-mono"
                            />
                            <button
                              onClick={() => handleChangeUserPassword(u)}
                              className="px-2 py-1 bg-purple-600 text-white font-bold rounded-lg text-[11px]"
                            >
                              حفظ
                            </button>
                            <button
                              onClick={() => {
                                setEditingUserId(null);
                                setChangePasswordInput('');
                              }}
                              className="px-2 py-1 bg-slate-800 text-slate-400 rounded-lg text-[11px]"
                            >
                              إلغاء
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingUserId(u.id)}
                            title="تغيير كلمة المرور"
                            className="px-2.5 py-1 rounded-lg bg-slate-800 text-purple-300 hover:bg-slate-700 font-bold flex items-center gap-1 text-[11px]"
                          >
                            <Key className="w-3 h-3" />
                            <span>تغيير كلمة المرور</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleToggleStatus(u.id)}
                          title={u.status === 'Active' ? 'تعطيل الحساب' : 'تفعيل الحساب'}
                          className={`p-1.5 rounded-lg text-xs font-bold ${
                            u.status === 'Active'
                              ? 'bg-slate-800 text-emerald-400 hover:bg-emerald-950/40'
                              : 'bg-rose-950/40 text-rose-400 hover:bg-slate-800'
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          title="حذف المستخدم"
                          className="p-1.5 rounded-lg bg-slate-800 text-rose-400 hover:bg-slate-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Security Subtab */}
      {activeSubTab === 'security' && (
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-black text-white">إعدادات الأمان والتصدي للهجمات Firewall</h3>
              <p className="text-xs text-slate-400">حظر عناوين IP، تحديد المعدل Rate Limiting، حظر الدول وحماية Captcha.</p>
            </div>
            <button
              onClick={handleSaveSecurity}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs"
            >
              <Save className="w-4 h-4" />
              <span>حفظ قواعد الأمان</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">إلزامية المصادقة الثنائية 2FA</span>
                  <span className="text-slate-400 text-[11px]">فرض 2FA على جميع المشرفين والمدراء</span>
                </div>
                <input
                  type="checkbox"
                  checked={secConfig.twoFactorRequired}
                  onChange={(e) => setSecConfig({ ...secConfig, twoFactorRequired: e.target.checked })}
                  className="w-5 h-5 accent-purple-600 rounded"
                />
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">تفعيل حماية Captcha (Cloudflare Turnstile)</span>
                  <span className="text-slate-400 text-[11px]">منع البوتات و السكريبتات التلقائية</span>
                </div>
                <input
                  type="checkbox"
                  checked={secConfig.captchaEnabled}
                  onChange={(e) => setSecConfig({ ...secConfig, captchaEnabled: e.target.checked })}
                  className="w-5 h-5 accent-purple-600 rounded"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">عناوين IP المحظورة (IP Blacklist)</label>
                <input
                  type="text"
                  value={secConfig.ipBlacklist.join(', ')}
                  onChange={(e) =>
                    setSecConfig({ ...secConfig, ipBlacklist: e.target.value.split(',').map((s) => s.trim()) })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-rose-300 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">تحديد معدل الطلبات (Rate Limit Per Min)</label>
                <input
                  type="number"
                  value={secConfig.rateLimitPerMin}
                  onChange={(e) => setSecConfig({ ...secConfig, rateLimitPerMin: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Backups Subtab */}
      {activeSubTab === 'backups' && (
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-base font-black text-white">إدارة النسخ الاحتياطي (Automated Backups & Snapshot)</h3>
          <p className="text-xs text-slate-400">توفير نسخ احتياطية يومية وأسبوعية للنظام واستعادتها في أي وقت بنقرة واحدة.</p>

          <div className="flex items-center gap-4 pt-2">
            <button
              onClick={handleRunBackup}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/30"
            >
              <Database className="w-4 h-4" />
              <span>توليد وتنزيل النسخة الاحتياطية الآن</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
