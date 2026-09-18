import { exportData, importData } from './export';

const FILE_NAME = 'expense-tracker-backup.json';

// Declare google on window
declare global {
  interface Window {
    google?: any;
  }
}

let cachedToken: string | null = null;
let tokenExpiry = 0;

/**
 * Initiates the Google OAuth flow and returns a Promise with the access token.
 */
export async function getGoogleDriveToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  return new Promise((resolve, reject) => {
    const client_id = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!client_id) {
      reject(new Error('Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env.local'));
      return;
    }

    if (!window.google) {
      reject(new Error('Google Identity Services script not loaded.'));
      return;
    }

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id,
      scope: 'https://www.googleapis.com/auth/drive.appdata',
      callback: (tokenResponse: any) => {
        if (tokenResponse.error) {
          reject(new Error(tokenResponse.error));
        } else {
          cachedToken = tokenResponse.access_token;
          tokenExpiry = Date.now() + (tokenResponse.expires_in * 1000) - 60000;
          resolve(tokenResponse.access_token);
        }
      },
      error_callback: (err: any) => {
        reject(err);
      },
    });

    client.requestAccessToken();
  });
}

/**
 * Searches for the backup file in the appDataFolder.
 * Returns the fileId if found, otherwise null.
 */
async function findBackupFileId(accessToken: string): Promise<string | null> {
  const query = `name='${FILE_NAME}'`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&spaces=appDataFolder&fields=files(id,name,modifiedTime)`;
  
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) throw new Error(`Failed to query Google Drive: ${await res.text()}`);
  
  const data = await res.json();
  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }
  return null;
}

/**
 * Exports local Dexie data and uploads to Google Drive appDataFolder.
 */
export async function backupToDrive(): Promise<void> {
  const token = await getGoogleDriveToken();
  const fileId = await findBackupFileId(token);
  const dbDataString = await exportData();
  
  const metadata: any = {
    name: FILE_NAME,
    parents: ['appDataFolder']
  };

  const form = new FormData();
  
  let url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
  let method = 'POST';

  if (fileId) {
    url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`;
    method = 'PATCH';
    delete metadata.parents;
  }

  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([dbDataString], { type: 'application/json' }));

  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  if (!res.ok) {
    throw new Error(`Failed to upload backup: ${await res.text()}`);
  }
}

/**
 * Downloads the backup file from Google Drive and imports it into Dexie.
 */
export async function restoreFromDrive(): Promise<{ expenses: number; budgets: number; ignored: number }> {
  const token = await getGoogleDriveToken();
  const fileId = await findBackupFileId(token);

  if (!fileId) {
    throw new Error('No backup found on Google Drive.');
  }

  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to download backup: ${await res.text()}`);
  }

  const jsonString = await res.text();
  return await importData(jsonString);
}

/**
 * Gets the last modified time of the backup if it exists.
 */
export async function getBackupMetadata(): Promise<string | null> {
  try {
    const token = await getGoogleDriveToken();
    const query = `name='${FILE_NAME}'`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&spaces=appDataFolder&fields=files(id,name,modifiedTime)`;
    
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return null;
    const data = await res.json();
    
    if (data.files && data.files.length > 0) {
      return data.files[0].modifiedTime;
    }
  } catch (e) {
    console.error(e);
  }
  return null;
}

/**
 * Downloads the raw backup file from Google Drive as a string for verification.
 */
export async function downloadRawBackupFromDrive(): Promise<string> {
  const token = await getGoogleDriveToken();
  const fileId = await findBackupFileId(token);

  if (!fileId) {
    throw new Error('No backup found on Google Drive.');
  }

  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to download backup: ${await res.text()}`);
  }

  return await res.text();
}
