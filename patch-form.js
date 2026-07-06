const fs = require('fs');

let content = fs.readFileSync('src/app/dashboard/settings/email/form.tsx', 'utf-8');

// We will rewrite the whole file for the split screen layout since it's extensive.
