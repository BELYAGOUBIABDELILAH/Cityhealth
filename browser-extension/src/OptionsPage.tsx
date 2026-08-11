import React, { useState, useEffect } from 'react';

export interface NotificationPreferences {
  soundEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // "HH:MM"
  quietHoursEnd: string;
  maxPerHour: number; // 0 = unlimited
  urgentOnly: boolean;
}

const DEFAULTS: NotificationPreferences = {
  soundEnabled: true,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  maxPerHour: 0,
  urgentOnly: false,
};

function PremiumLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const isSm = size === 'sm';
  return (
    <div className="flex items-center gap-2 group justify-center select-none">
      <div className={`rounded-full bg-white border border-blue-100 flex items-center justify-center shadow-sm overflow-hidden p-0.5 ${isSm ? 'w-8 h-8' : 'w-10 h-10'}`}>
        <img 
          src="/bird.png" 
          alt="CityHealth Logo" 
          className="w-full h-full object-contain rounded-full" 
        />
      </div>
      <div className="flex flex-col -space-y-0.5 text-left">
        <span className={`font-extrabold tracking-tight text-gray-800 ${isSm ? 'text-sm' : 'text-base'}`}>
          City<span className="text-blue-600">Health</span>
        </span>
        <span className="text-[8px] text-blue-600/75 tracking-[0.18em] uppercase font-black">Sidi Bel Abbès</span>
      </div>
    </div>
  );
}

function SupportSection() {
  return (
    <div className="border-t border-gray-100 bg-gray-50/90 px-4 py-4 text-center space-y-1.5 shrink-0 select-none">
      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Support & Assistance</p>
      <div className="flex justify-center items-center gap-4 text-xs">
        <a href="tel:+213672947764" className="flex items-center gap-1 text-gray-500 hover:text-blue-600 transition-colors font-semibold">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          <span>+213 672947764</span>
        </a>
        <span className="text-gray-300">|</span>
        <a href="mailto:contact@cityhealthdz.com" className="flex items-center gap-1 text-gray-500 hover:text-blue-600 transition-colors font-semibold">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
          <span>contact@cityhealthdz.com</span>
        </a>
      </div>
    </div>
  );
}

export function OptionsPage() {
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULTS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    chrome.storage.local.get(['notificationPrefs'], (result) => {
      if (result.notificationPrefs) {
        setPrefs({ ...DEFAULTS, ...result.notificationPrefs });
      }
    });
  }, []);

  function update<K extends keyof NotificationPreferences>(key: K, value: NotificationPreferences[K]) {
    setPrefs((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function handleSave() {
    chrome.storage.local.set({ notificationPrefs: prefs }, () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  }

  function handleReset() {
    setPrefs(DEFAULTS);
    chrome.storage.local.set({ notificationPrefs: DEFAULTS });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="min-h-screen bg-gray-50/50 flex items-start justify-center py-12 px-4 select-none">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-br from-white via-gray-50 to-blue-50/20 px-6 py-6 border-b border-gray-100 flex flex-col items-center gap-2 text-center shrink-0">
          <PremiumLogo />
          <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest mt-2">Options de Notification</h2>
          <p className="text-xs text-gray-500 max-w-[280px]">Personnalisez la réception de vos alertes SOS Vitales de Don de Sang</p>
        </div>

        <div className="p-6 flex flex-col gap-5.5">
          {/* Sound toggle */}
          <ToggleRow
            label="🔔 Signal sonore"
            description="Émettre un son lors de la réception d'une alerte SOS"
            checked={prefs.soundEnabled}
            onChange={(v) => update('soundEnabled', v)}
          />

          {/* Urgent only */}
          <ToggleRow
            label="🚨 Urgences critiques uniquement"
            description="Ignorer les demandes standard et ne notifier que les cas critiques"
            checked={prefs.urgentOnly}
            onChange={(v) => update('urgentOnly', v)}
          />

          {/* Quiet hours */}
          <div className={`border rounded-xl p-4 transition-all duration-300 ${prefs.quietHoursEnabled ? 'border-blue-100 bg-blue-50/10' : 'border-gray-200 bg-white'}`}>
            <ToggleRow
              label="🌙 Mode nuit (Heures calmes)"
              description="Bloquer temporairement les notifications sur une plage horaire"
              checked={prefs.quietHoursEnabled}
              onChange={(v) => update('quietHoursEnabled', v)}
            />

            {prefs.quietHoursEnabled && (
              <div className="mt-4 flex items-center gap-3.5 animate-fadeIn">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">De (Début)</label>
                  <input
                    type="time"
                    value={prefs.quietHoursStart}
                    onChange={(e) => update('quietHoursStart', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                  />
                </div>
                <span className="text-gray-300 mt-4 font-bold">→</span>
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">À (Fin)</label>
                  <input
                    type="time"
                    value={prefs.quietHoursEnd}
                    onChange={(e) => update('quietHoursEnd', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Max per hour */}
          <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-gray-700">📊 Limite d'alertes par heure</label>
              <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100/50">
                {prefs.maxPerHour === 0 ? 'Aucune limite' : `${prefs.maxPerHour} / heure`}
              </span>
            </div>
            <p className="text-[10px] text-gray-400 mb-3">Régule le volume de notifications pour éviter d'être surchargé</p>
            <input
              type="range"
              min={0}
              max={10}
              value={prefs.maxPerHour}
              onChange={(e) => update('maxPerHour', Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer h-1.5 bg-gray-200 rounded-lg appearance-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              className={`flex-1 text-white rounded-xl py-2.5 text-xs font-bold hover:shadow-md transition-all duration-300 active:scale-[0.98] ${saved ? 'bg-blue-500 hover:bg-blue-600' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {saved ? '✓ Préférences enregistrées' : 'Enregistrer les modifications'}
            </button>
            <button
              onClick={handleReset}
              className="px-4 border border-gray-200 text-gray-500 hover:text-gray-700 rounded-xl py-2.5 text-xs font-bold hover:bg-gray-50 transition-colors"
            >
              Réinitialiser
            </button>
          </div>

          {/* Privacy & Permissions Info */}
          <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/30 space-y-2.5">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">🔒 Confidentialité & Données</h3>
            <ul className="space-y-2 text-xs text-gray-500">
              <li className="flex items-start gap-2">
                <span className="shrink-0 mt-0.5">🛡️</span>
                <span>Toutes vos préférences sont stockées en local sur votre navigateur et synchronisées en arrière-plan de manière sécurisée.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="shrink-0 mt-0.5">📡</span>
                <span>Les requêtes de vérification d'urgences de don de sang ne transmettent aucune information d'identité personnelle en dehors de votre groupe sanguin.</span>
              </li>
            </ul>
          </div>
        </div>

        <SupportSection />
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer select-none group">
      <div className="pt-0.5">
        <div
          className={`w-9 h-5 rounded-full relative transition-all duration-300 ${checked ? 'bg-blue-600' : 'bg-gray-200'}`}
          onClick={() => onChange(!checked)}
        >
          <div
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${checked ? 'translate-x-4.5' : 'translate-x-0.5'}`}
          />
        </div>
      </div>
      <div className="flex-1" onClick={() => onChange(!checked)}>
        <p className="text-xs font-bold text-gray-700 group-hover:text-blue-600 transition-colors">{label}</p>
        <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">{description}</p>
      </div>
    </label>
  );
}
