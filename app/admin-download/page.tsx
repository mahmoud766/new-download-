'use client';

import React, { useState } from 'react';
import { AdminDashboard } from '@/src/components/AdminDashboard';

export default function AdminPage() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleShowToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleClose = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-indigo-600 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-bold animate-bounce border border-indigo-400">
          {toastMessage}
        </div>
      )}
      <AdminDashboard
        currentLang="ar"
        onClose={handleClose}
        onShowToast={handleShowToast}
      />
    </div>
  );
}
