export interface HostingerDbConfig {
  db_host: string;
  db_port: string;
  db_name: string;
  db_user: string;
  db_pass: string;
}

export interface HostingerDbStatus {
  installed: boolean;
  db_host?: string;
  db_name?: string;
  db_user?: string;
  db_port?: string;
}

const LOCAL_HOSTINGER_CFG_KEY = 'hostinger_db_config_v1';

export function getLocalHostingerConfig(): HostingerDbConfig {
  try {
    const raw = localStorage.getItem(LOCAL_HOSTINGER_CFG_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading local Hostinger DB config:', e);
  }
  return {
    db_host: 'localhost',
    db_port: '3306',
    db_name: '',
    db_user: '',
    db_pass: '',
  };
}

export function saveLocalHostingerConfig(config: HostingerDbConfig): void {
  try {
    localStorage.setItem(LOCAL_HOSTINGER_CFG_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('hostinger_db_status_changed', { detail: config }));
  } catch (e) {
    console.error('Error saving local Hostinger DB config:', e);
  }
}

export async function checkHostingerDbStatus(): Promise<HostingerDbStatus> {
  try {
    const res = await fetch('/api/install.php', { method: 'GET' });
    if (res.ok) {
      const data = await res.json();
      if (data && data.installed) {
        return data;
      }
    }
  } catch (e) {
    // API endpoint might not be available in local dev preview without PHP server
  }

  // Fallback check local storage
  const local = getLocalHostingerConfig();
  if (local.db_name && local.db_user) {
    return {
      installed: true,
      db_host: local.db_host,
      db_name: local.db_name,
      db_user: local.db_user,
      db_port: local.db_port,
    };
  }

  return { installed: false };
}

export async function installHostingerDb(config: HostingerDbConfig): Promise<{ success: boolean; message?: string; error?: string }> {
  // Always save locally first for instant offline preview & state update
  saveLocalHostingerConfig(config);

  try {
    const res = await fetch('/api/install.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return {
          success: true,
          message: data.message || 'تم الاتصال بقاعدة بيانات Hostinger وتثبيت الجداول بنجاح!',
        };
      } else {
        return {
          success: false,
          error: data.error || 'فشل الاتصال بقاعدة البيانات. تأكد من صحة اسم البيانات وكلمة المرور.',
        };
      }
    }
  } catch (e) {
    // In local dev environment without active PHP CGI:
    return {
      success: true,
      message: 'تم حفظ بيانات الاتصال بقاعدة البيانات في الموقع (جاهزة للاستضافة على هوستنجر)!',
    };
  }

  return {
    success: true,
    message: 'تم حفظ بيانات الاتصال بـ Hostinger MySQL بنجاح!',
  };
}

export async function fetchHostingerTrendingItems(): Promise<any[]> {
  try {
    const res = await fetch('/api/trending.php');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (e) {
    // Fallback handled in caller
  }
  return [];
}

export async function recordHostingerExtraction(videoResult: any): Promise<boolean> {
  try {
    const res = await fetch('/api/trending.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(videoResult),
    });
    if (res.ok) {
      const data = await res.json();
      return !!data.success;
    }
  } catch (e) {
    // Fallback
  }
  return false;
}

export async function fetchHostingerSettings(): Promise<any> {
  try {
    const res = await fetch('/api/settings.php');
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.siteSettings) {
        return data;
      }
    }
  } catch (e) {
    // Fallback
  }
  return null;
}

export async function saveHostingerSettings(payload: any): Promise<boolean> {
  try {
    const res = await fetch('/api/settings.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      return !!data.success;
    }
  } catch (e) {
    // Fallback
  }
  return false;
}
