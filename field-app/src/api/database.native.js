import * as SQLite from 'expo-sqlite';

let db;

export const initDb = () => {
  try {
    db = SQLite.openDatabaseSync('nammahealth.db');
    db.execSync(`
      CREATE TABLE IF NOT EXISTS offline_patients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        payload TEXT,
        created_at TEXT
      );
    `);
  } catch (error) {
    console.error('Failed to initialize SQLite database', error);
  }
};

export const saveOfflinePatient = (payload) => {
  const record = {
    payload: JSON.stringify(payload),
    created_at: new Date().toISOString()
  };

  if (!db) return;
  try {
    db.runSync(
      'INSERT INTO offline_patients (payload, created_at) VALUES (?, ?)',
      [record.payload, record.created_at]
    );
  } catch (error) {
    console.error('Error saving offline patient', error);
  }
};

export const getOfflinePatients = () => {
  if (!db) return [];
  try {
    return db.getAllSync('SELECT * FROM offline_patients ORDER BY created_at ASC');
  } catch (error) {
    console.error('Error getting offline patients', error);
    return [];
  }
};

export const deleteOfflinePatient = (id) => {
  if (!db) return;
  try {
    db.runSync('DELETE FROM offline_patients WHERE id = ?', [id]);
  } catch (error) {
    console.error('Error deleting offline patient', error);
  }
};
