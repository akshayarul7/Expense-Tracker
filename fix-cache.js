const fs = require('fs');
let code = fs.readFileSync('src/lib/drive-sync.ts', 'utf8');

// Add cachedToken variable
if (!code.includes('let cachedToken')) {
  code = code.replace('export async function getGoogleDriveToken(): Promise<string> {', 
\`let cachedToken: string | null = null;
let tokenExpiry: number = 0;

export async function getGoogleDriveToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }\`);

  // Update the callback to cache the token
  code = code.replace(
    'resolve(tokenResponse.access_token);',
    \`cachedToken = tokenResponse.access_token;
          tokenExpiry = Date.now() + (tokenResponse.expires_in * 1000) - 60000; // expire 1 min early
          resolve(tokenResponse.access_token);\`
  );
  
  fs.writeFileSync('src/lib/drive-sync.ts', code);
}
