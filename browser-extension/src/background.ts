import { supabase, APP_URL } from './supabaseClient';

interface NotificationPreferences {
  soundEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  maxPerHour: number;
  urgentOnly: boolean;
}

const defaultPrefs: NotificationPreferences = {
  soundEnabled: true,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  maxPerHour: 0,
  urgentOnly: false,
};

async function checkForNewEmergencies() {
  chrome.storage.local.get(
    ['bloodGroup', 'notificationPrefs', 'notifiedEmergencyIds', 'notificationsThisHour', 'lastHourReset'],
    async (result) => {
      const bloodGroup = result.bloodGroup || null;
      if (!bloodGroup) {
        console.log('[CityHealth Companion] No blood group set. Skipping active emergency check.');
        return;
      }

      const prefs = { ...defaultPrefs, ...(result.notificationPrefs || {}) };
      const notifiedIds = new Set<string>(result.notifiedEmergencyIds || []);
      let hourCount = result.notificationsThisHour || 0;
      let hourReset = result.lastHourReset || Date.now();

      // Reset hourly counter if 1 hour has passed
      if (Date.now() - hourReset > 3600000) {
        hourCount = 0;
        hourReset = Date.now();
        chrome.storage.local.set({ notificationsThisHour: 0, lastHourReset: hourReset });
      }

      // Check limits
      if (prefs.maxPerHour > 0 && hourCount >= prefs.maxPerHour) {
        console.log('[CityHealth Companion] Notification limit per hour reached.');
        return;
      }

      // Check quiet hours
      if (prefs.quietHoursEnabled) {
        const now = new Date();
        const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const { quietHoursStart: start, quietHoursEnd: end } = prefs;
        let inQuiet = false;
        if (start <= end) {
          inQuiet = hhmm >= start && hhmm < end;
        } else {
          inQuiet = hhmm >= start || hhmm < end;
        }
        if (inQuiet) {
          console.log('[CityHealth Companion] Quiet hours active. Skipping notifications.');
          return;
        }
      }

      console.log('[CityHealth Companion] Querying active emergencies for blood type:', bloodGroup);

      // Fetch active emergencies matching user's blood group
      const { data, error } = await supabase
        .from('blood_emergencies')
        .select('*')
        .eq('status', 'active')
        .eq('blood_type_needed', bloodGroup);

      if (error) {
        console.error('[CityHealth Companion] Error querying blood emergencies:', error.message);
        return;
      }

      if (!data || data.length === 0) {
        console.log('[CityHealth Companion] No active emergencies found matching blood type.');
        return;
      }

      let newAlertsCount = 0;
      const updatedNotifiedIds = [...notifiedIds];
      const newHistoryEntries: any[] = [];

      for (const emergency of data) {
        // Skip if already notified
        if (notifiedIds.has(emergency.id)) continue;

        // Skip if user only wants critical and urgency is not critical
        if (prefs.urgentOnly && emergency.urgency_level !== 'critical') continue;

        // Check if limit is hit in the loop
        if (prefs.maxPerHour > 0 && hourCount + newAlertsCount >= prefs.maxPerHour) {
          break;
        }

        newAlertsCount++;
        updatedNotifiedIds.push(emergency.id);

        newHistoryEntries.push({
          id: emergency.id,
          blood_type: emergency.blood_type_needed,
          provider: emergency.provider_name || 'Établissement de santé',
          urgency: emergency.urgency_level,
          time: new Date().toISOString(),
        });

        // Trigger native chrome notification
        chrome.notifications.create(`blood-emergency-${emergency.id}`, {
          type: 'basic',
          iconUrl: 'icons/icon-128.png',
          title: `🚨 Urgence Sang ${emergency.blood_type_needed}`,
          message: `Besoin vital détecté chez ${emergency.provider_name || 'Établissement'}. Cliquez pour agir.`,
          priority: 2,
          requireInteraction: true,
          silent: !prefs.soundEnabled,
        });
      }

      if (newAlertsCount > 0) {
        chrome.storage.local.get(['sosAlertCount', 'sosAlertHistory'], (res) => {
          const count = (res.sosAlertCount || 0) + newAlertsCount;
          const history = [...newHistoryEntries, ...(res.sosAlertHistory || [])];

          chrome.storage.local.set({
            sosAlertCount: count,
            sosAlertHistory: history.slice(0, 5),
            notifiedEmergencyIds: updatedNotifiedIds,
            notificationsThisHour: hourCount + newAlertsCount,
            lastHourReset: hourReset,
          });
        });
      }
    }
  );
}

// Alarm listener
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'fetch-emergencies') {
    checkForNewEmergencies();
  }
});

// Storage changes listener
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local') {
    if (changes.bloodGroup || changes.notificationPrefs) {
      checkForNewEmergencies();
    }
  }
});

// Click listener for notifications
chrome.notifications.onClicked.addListener((notificationId) => {
  if (notificationId.startsWith('blood-emergency-')) {
    chrome.tabs.create({ url: `${APP_URL}/map/blood` });
    chrome.notifications.clear(notificationId);
  }
});

// Initialize alarms and run check
function init() {
  chrome.alarms.get('fetch-emergencies', (alarm) => {
    if (!alarm) {
      chrome.alarms.create('fetch-emergencies', { periodInMinutes: 5 });
    }
  });
  checkForNewEmergencies();
}

chrome.runtime.onInstalled.addListener(() => {
  init();
});

chrome.runtime.onStartup.addListener(() => {
  init();
});

// Direct initialization when the worker is loaded
init();
