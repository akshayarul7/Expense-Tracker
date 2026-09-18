const fs = require('fs');
let code = fs.readFileSync('src/app/settings/page.tsx', 'utf8');

// I'll also fix the error stringification just in case
code = code.replace("setError(JSON.stringify(e)); alert(\"Migration failed: \" + JSON.stringify(e));", "setError(e.message || JSON.stringify(e)); alert('Migration failed: ' + (e.message || JSON.stringify(e)));");

fs.writeFileSync('src/app/settings/page.tsx', code);
