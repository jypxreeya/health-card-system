// Fallback for web since expo-sqlite is not available/stable without SharedArrayBuffer
const webOfflineKey = 'namma_health_offline_patients';

export const initDb = () => {
  console.log('Running on Web: Using localStorage fallback for offline data.');
};

export const saveOfflinePatient = (payload) => {
  const record = {
    payload: JSON.stringify(payload),
    created_at: new Date().toISOString(),
    id: Date.now()
  };
  const existing = JSON.parse(localStorage.getItem(webOfflineKey) || '[]');
  existing.push(record);
  localStorage.setItem(webOfflineKey, JSON.stringify(existing));
};

export const getOfflinePatients = () => {
  return JSON.parse(localStorage.getItem(webOfflineKey) || '[]');
};

export const deleteOfflinePatient = (id) => {
  const existing = JSON.parse(localStorage.getItem(webOfflineKey) || '[]');
  const filtered = existing.filter(item => item.id !== id);
  localStorage.setItem(webOfflineKey, JSON.stringify(filtered));
};
