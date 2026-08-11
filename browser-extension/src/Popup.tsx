import React, { useState, useEffect } from 'react';
import { supabase, APP_URL } from './supabaseClient';

interface EmergencyCard {
  blood_group: string | null;
  allergies: string[] | null;
  chronic_conditions: string[] | null;
  current_medications: string[] | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
}

interface AlertEntry {
  id: string;
  blood_type: string;
  provider: string;
  urgency: string;
  time: string;
}

function PremiumLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const isSm = size === 'sm';
  const imgSize = isSm ? 'w-8 h-8' : 'w-10 h-10';
  return (
    <div className="flex items-center gap-2 group select-none">
      <div className="relative">
        <div className={`relative rounded-full bg-white border border-gray-200 flex items-center justify-center p-0.5 shadow-sm transition-all duration-300 ${imgSize}`}>
          <img 
            src="/bird.png" 
            alt="CityHealth Logo" 
            className="w-full h-full object-contain rounded-full" 
          />
          {isSm && (
            <span className="absolute top-0 right-0 bg-blue-500 rounded-full border border-white w-2 h-2">
              <span className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-75" />
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-col -space-y-0.5 text-left">
        <span className={`font-extrabold tracking-tight text-gray-800 ${isSm ? 'text-xs' : 'text-sm'}`}>
          City<span className="text-blue-600">Health</span>
        </span>
        <span className="text-[8px] text-blue-500/75 tracking-[0.18em] uppercase font-black">Sidi Bel Abbès</span>
      </div>
    </div>
  );
}

function SupportSection() {
  return (
    <div className="border-t border-gray-100 bg-gray-50/90 px-4 py-3 text-center space-y-1.5 shrink-0 select-none">
      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Support & Assistance</p>
      <div className="flex justify-center items-center gap-3 text-[11px]">
        <a href="tel:+213672947764" className="flex items-center gap-1 text-gray-500 hover:text-blue-600 transition-colors font-semibold">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          <span>+213 672947764</span>
        </a>
        <span className="text-gray-300">|</span>
        <a href="mailto:contact@cityhealthdz.com" className="flex items-center gap-1 text-gray-500 hover:text-blue-600 transition-colors font-semibold">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
          <span>contact@cityhealthdz.com</span>
        </a>
      </div>
    </div>
  );
}

export function Popup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<any>(null);
  const [bloodGroup, setBloodGroup] = useState<string | null>(null);
  const [emergencyCard, setEmergencyCard] = useState<EmergencyCard | null>(null);
  const [showCard, setShowCard] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [authError, setAuthError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [alertCount, setAlertCount] = useState(0);
  const [alertHistory, setAlertHistory] = useState<AlertEntry[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchEmergencyCard(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchEmergencyCard(session.user.id);
      } else {
        setBloodGroup(null);
        setEmergencyCard(null);
      }
    });

    chrome.storage.local.get(['bloodGroup', 'sosAlertCount', 'sosAlertHistory'], (result) => {
      if (result.bloodGroup) setBloodGroup(result.bloodGroup);
      if (result.sosAlertCount) setAlertCount(result.sosAlertCount);
      if (result.sosAlertHistory) setAlertHistory(result.sosAlertHistory);
    });

    const listener = (changes: any, area: string) => {
      if (area === 'local') {
        if (changes.sosAlertCount) setAlertCount(changes.sosAlertCount.newValue || 0);
        if (changes.sosAlertHistory) setAlertHistory(changes.sosAlertHistory.newValue || []);
        if (changes.bloodGroup) setBloodGroup(changes.bloodGroup.newValue || null);
      }
    };
    chrome.storage.onChanged.addListener(listener);

    return () => {
      subscription.unsubscribe();
      chrome.storage.onChanged.removeListener(listener);
    };
  }, []);

  async function fetchEmergencyCard(userId: string) {
    try {
      const { data, error } = await supabase
        .from('emergency_health_cards')
        .select('blood_group, allergies, chronic_conditions, current_medications, emergency_contact_name, emergency_contact_phone')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('[CityHealth] Error loading emergency card:', error.message);
        return;
      }

      if (data) {
        setEmergencyCard(data as EmergencyCard);
        setBloodGroup(data.blood_group || null);
        chrome.storage.local.set({ bloodGroup: data.blood_group, userId });
      } else {
        setEmergencyCard(null);
        setBloodGroup(null);
        chrome.storage.local.remove(['bloodGroup']);
      }
    } catch (err) {
      console.error('[CityHealth] Catch error fetching card:', err);
    }
  }

  async function handleSync() {
    if (!user) return;
    setSyncing(true);
    await fetchEmergencyCard(user.id);
    setSyncing(false);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError('');
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthError(error.message);
    } else if (data?.user) {
      setUser(data.user);
      await fetchEmergencyCard(data.user.id);
    }
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    setBloodGroup(null);
    setEmergencyCard(null);
    chrome.storage.local.remove(['bloodGroup', 'userId']);
  }

  function openSearch() {
    const q = encodeURIComponent(searchQuery);
    chrome.tabs.create({ url: `${APP_URL}/search${q ? `?q=${q}` : ''}` });
  }

  function openTriage() {
    chrome.tabs.create({ url: `${APP_URL}/medical-assistant` });
  }

  function openOptions() {
    chrome.runtime.openOptionsPage();
  }

  function clearAlerts() {
    setAlertCount(0);
    setAlertHistory([]);
    chrome.storage.local.set({ sosAlertCount: 0, sosAlertHistory: [] });
  }

  function formatTime(iso: string) {
    try {
      const d = new Date(iso);
      return d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch { return iso; }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[530px] w-[360px] bg-white">
        <div className="relative flex items-center justify-center">
          <div className="animate-ping absolute inline-flex h-12 w-12 rounded-full bg-blue-400 opacity-20" />
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
        <p className="text-xs text-gray-400 mt-4 font-semibold animate-pulse">Chargement sécurisé...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="w-[360px] h-[530px] flex flex-col bg-white">
        <header className="bg-gradient-to-br from-white via-gray-50 to-blue-50/20 px-5 py-6 text-center border-b border-gray-100 flex flex-col items-center gap-2 shrink-0">
          <PremiumLogo />
          <p className="text-xs text-gray-500 max-w-[240px] mt-1">Accédez à votre espace santé et vos alertes SOS</p>
        </header>

        <form onSubmit={handleLogin} className="flex-1 flex flex-col justify-center gap-3.5 p-6 shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-800">Bienvenue</h2>
            <p className="text-xs text-gray-400">Connectez-vous avec vos identifiants CityHealth</p>
          </div>

          {authError && (
            <div className="text-xs text-red-600 bg-red-50/80 border border-red-100 rounded-lg p-2.5 flex items-start gap-1.5 animate-shake">
              <span className="shrink-0 mt-0.5">⚠️</span>
              <span>Adresse email ou mot de passe incorrect.</span>
            </div>
          )}

          <div className="space-y-3">
            <div className="relative">
              <input 
                type="email" 
                placeholder="Adresse email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                className="w-full border border-gray-200 rounded-lg pl-3 pr-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all placeholder:text-gray-400" 
              />
            </div>
            <div className="relative">
              <input 
                type="password" 
                placeholder="Mot de passe" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                className="w-full border border-gray-200 rounded-lg pl-3 pr-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all placeholder:text-gray-400" 
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 text-xs font-semibold hover:shadow-md active:scale-[0.99] transition-all"
          >
            Se connecter
          </button>

          <p className="text-[10px] text-gray-400 text-center mt-1">
            Pas de compte ?{' '}
            <a 
              href={`${APP_URL}/citizen/register`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-600 hover:underline font-bold"
            >
              Inscrivez-vous gratuitement
            </a>
          </p>
        </form>

        <SupportSection />
      </div>
    );
  }

  return (
    <div className="w-[360px] h-[530px] flex flex-col bg-gray-50/60">
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm shrink-0">
        <PremiumLogo size="sm" />
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setShowAlerts(!showAlerts)} 
            title="Alertes SOS" 
            className={`p-1.5 rounded-lg hover:bg-gray-100 transition-colors relative ${showAlerts ? 'bg-red-50 text-red-500 hover:bg-red-50' : 'text-gray-500'}`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
            {alertCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-black rounded-full w-4 h-4 flex items-center justify-center animate-pulse border border-white">
                {alertCount}
              </span>
            )}
          </button>
          
          <button 
            onClick={openOptions} 
            title="Préférences" 
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          
          <button 
            onClick={handleLogout} 
            title="Se déconnecter"
            className="text-[10px] text-gray-500 hover:text-red-600 bg-gray-50 hover:bg-red-50 border border-gray-200/80 hover:border-red-100 rounded-lg px-2 py-1 transition-colors font-bold"
          >
            Sortir
          </button>
        </div>
      </header>

      {showAlerts && (
        <div className="border-b border-gray-200/80 bg-white px-4 py-3 shadow-inner shrink-0">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-extrabold text-gray-600 uppercase tracking-wider">🔔 Alertes SOS Récentes</p>
            {alertHistory.length > 0 && (
              <button onClick={clearAlerts} className="text-[10px] text-blue-600 hover:underline font-bold">Effacer tout</button>
            )}
          </div>
          {alertHistory.length === 0 ? (
            <p className="text-xs text-gray-400 italic py-1">Aucune alerte récente reçue</p>
          ) : (
            <div className="flex flex-col gap-1.5 max-h-[130px] overflow-y-auto pr-1">
              {alertHistory.map((alert) => (
                <div key={alert.id} className="bg-red-50/30 border border-red-50 rounded-lg px-2.5 py-2 flex items-start gap-2.5">
                  <span className="text-red-500 text-sm mt-0.5 animate-pulse">🚨</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-gray-800">Sang {alert.blood_type} — Niveau {alert.urgency}</p>
                    <p className="text-[10px] text-gray-500 truncate">{alert.provider} · {formatTime(alert.time)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="bg-white rounded-xl border border-gray-100 px-3.5 py-2 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
            <span className="text-xs text-gray-500 truncate font-medium">{user.email}</span>
          </div>
          <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-extrabold uppercase tracking-wide border border-blue-100/30">Citoyen</span>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-3.5 shadow-sm space-y-3">
          <button
            onClick={openTriage}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 text-xs font-extrabold hover:shadow-md active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <span className="text-base animate-bounce">🤖</span>
            Lancer l'Assistant Triage IA
          </button>

          <div className="flex gap-1.5">
            <div className="flex-1 relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <input
                type="text"
                placeholder="Médecin, pharmacie, spécialité..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && openSearch()}
                className="w-full border border-gray-200 rounded-lg pl-8 pr-2.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 bg-gray-50 placeholder:text-gray-400 transition-all"
              />
            </div>
            <button 
              onClick={openSearch} 
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 text-xs font-semibold transition-colors shrink-0"
            >
              Rechercher
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowCard(!showCard)}
            className="flex-1 bg-white border border-gray-100 rounded-xl p-3 flex items-center justify-between hover:border-red-100 hover:bg-red-50/10 transition-colors shadow-sm"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🩸</span>
              <div className="text-left">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-bold">Groupe Sanguin</p>
                <p className="text-base font-black text-red-500">{bloodGroup || 'Non spécifié'}</p>
              </div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${showCard ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6"/></svg>
          </button>
          <button 
            onClick={handleSync} 
            disabled={syncing} 
            title="Synchroniser avec la base" 
            className="bg-white border border-gray-100 rounded-xl px-3 flex items-center justify-center hover:border-blue-200 hover:bg-blue-50/10 transition-colors shadow-sm disabled:opacity-50"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={syncing ? 'animate-spin' : ''}><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
          </button>
        </div>

        {showCard && emergencyCard && (
          <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50 text-xs shadow-sm overflow-hidden animate-fadeIn">
            <CardRow emoji="💊" label="Allergies" items={emergencyCard.allergies} />
            <CardRow emoji="🩺" label="Conditions chroniques" items={emergencyCard.chronic_conditions} />
            <CardRow emoji="💉" label="Médicaments actuels" items={emergencyCard.current_medications} />
            {(emergencyCard.emergency_contact_name || emergencyCard.emergency_contact_phone) && (
              <div className="px-3 py-2.5 bg-gray-50/40">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">📞 Contact d'urgence</p>
                <p className="text-xs font-semibold text-gray-700">
                  {emergencyCard.emergency_contact_name || '—'}
                  {emergencyCard.emergency_contact_phone && (
                    <span className="text-blue-600 block sm:inline sm:ml-2 font-bold">
                      · {emergencyCard.emergency_contact_phone}
                    </span>
                  )}
                </p>
              </div>
            )}
            <div className="px-3 py-2 text-center bg-blue-50/30">
              <a 
                href={`${APP_URL}/citizen/dashboard`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-[10px] text-blue-700 font-bold hover:underline"
              >
                Modifier ma carte santé en ligne →
              </a>
            </div>
          </div>
        )}

        {showCard && !emergencyCard && (
          <div className="bg-yellow-50/60 border border-yellow-100 rounded-xl p-3.5 text-xs text-yellow-800 text-center animate-fadeIn">
            Aucune carte d'urgence trouvée.{' '}
            <a 
              href={`${APP_URL}/citizen/dashboard`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-600 hover:underline font-bold block mt-1"
            >
              Créer ma carte sur CityHealth
            </a>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 shrink-0">
          <button 
            onClick={() => chrome.tabs.create({ url: `${APP_URL}/map/blood` })} 
            className="bg-white border border-gray-100 text-gray-600 rounded-lg py-2 text-xs font-bold hover:border-red-100 hover:bg-red-50/10 hover:text-red-500 transition-colors shadow-sm flex items-center justify-center gap-1.5"
          >
            <span>🩸</span> Don de sang
          </button>
          <button 
            onClick={() => chrome.tabs.create({ url: `${APP_URL}/map/emergency` })} 
            className="bg-white border border-gray-100 text-gray-600 rounded-lg py-2 text-xs font-bold hover:border-orange-100 hover:bg-orange-50/10 hover:text-orange-500 transition-colors shadow-sm flex items-center justify-center gap-1.5"
          >
            <span>🚨</span> Urgences
          </button>
        </div>
      </div>

      <SupportSection />
    </div>
  );
}

function CardRow({ emoji, label, items }: { emoji: string; label: string; items: string[] | null }) {
  const list = items?.filter(Boolean) || [];
  return (
    <div className="px-3.5 py-2.5">
      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">{emoji} {label}</p>
      {list.length > 0 ? (
        <div className="flex flex-wrap gap-1 mt-1">
          {list.map((item, i) => (
            <span key={i} className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded-full font-medium border border-gray-200/50">
              {item}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-300 italic">Aucun renseignement</p>
      )}
    </div>
  );
}
