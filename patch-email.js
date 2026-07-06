const fs = require('fs');

let content = fs.readFileSync('src/lib/email.ts', 'utf-8');

// Insert import at the top
content = content.replace("import path from 'path';", "import path from 'path';\nimport { loadEmailTemplate } from './email-helper';");

const oldMailOptionsStart = content.indexOf("    const mailOptions = {");
const endOfMailOptions = content.indexOf("    };", oldMailOptionsStart) + 6;

if (oldMailOptionsStart > -1 && endOfMailOptions > -1) {
  const newMailOptions = `    const templateData = await loadEmailTemplate();
    const processTemplate = (tmpl) => {
      return tmpl
        .replace(/{{candidateName}}/g, params.candidateName)
        .replace(/{{position}}/g, params.position || 'Kandidat')
        .replace(/{{link}}/g, params.link)
        .replace(/{{token}}/g, params.token)
        .replace(/{{expiresAt}}/g, formattedDate);
    };

    const mailOptions = {
      from: \`"\${fromName}" <\${fromEmail}>\`,
      to: params.candidateEmail,
      subject: processTemplate(templateData.subject || 'Undangan Asesmen - EasyCorp'),
      text: processTemplate(templateData.textTemplate),
      html: processTemplate(templateData.htmlTemplate),
      attachments: [
        {
          filename: 'logo-ec.png',
          path: path.join(process.cwd(), 'public', 'logo-ec.png'),
          cid: 'logo-ec',
        },
      ],
    };`;
    
  content = content.substring(0, oldMailOptionsStart) + newMailOptions + content.substring(endOfMailOptions);
} else {
  console.log("Could not find mailOptions");
}

fs.writeFileSync('src/lib/email.ts', content);
console.log('Patched email.ts');
