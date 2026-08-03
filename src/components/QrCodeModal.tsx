import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { SupportedLanguage } from '../types';
import { t } from '../i18n/translations';
import { QrCode, X, Download, Smartphone } from 'lucide-react';

interface QrProps {
  url: string;
  currentLang: SupportedLanguage;
  onClose: () => void;
}

export function QrCodeModal({ url, currentLang, onClose }: QrProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (url) {
      QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((data) => setQrDataUrl(data))
        .catch((err) => console.error('QR code generation error:', err));
    }
  }, [url]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6 text-center space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">{t('qrCode', currentLang)}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-white w-fit mx-auto shadow-inner border border-slate-200">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="Scan QR Code" className="w-48 h-48 mx-auto" />
          ) : (
            <div className="w-48 h-48 flex items-center justify-center text-slate-400 font-mono text-xs">
              Generating QR...
            </div>
          )}
        </div>

        <div className="space-y-1">
          <div className="text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5">
            <Smartphone className="w-4 h-4 text-indigo-400" />
            <span>Scan to Download on Mobile</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {t('scanQrNotice', currentLang)}
          </p>
        </div>

        {qrDataUrl && (
          <a
            href={qrDataUrl}
            download="omnifetch_qr.png"
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-indigo-600/20"
          >
            <Download className="w-4 h-4" />
            <span>Save QR Image</span>
          </a>
        )}
      </div>
    </div>
  );
}
