const fs = require('fs');
const PizZip = require('pizzip');

const templateBuffer = fs.readFileSync('FR-HRGA-001.02 _ Form Hasil Tes Seleksi (1).docx');
const zip = new PizZip(templateBuffer);
const xml = zip.file('word/document.xml').asText();

// let's find all text inside <w:t> elements
const regex = /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g;
let match;
let index = 1;
const texts = [];
while ((match = regex.exec(xml)) !== null) {
  texts.push({ index, text: match[1] });
  index++;
}

console.log('Total text elements:', texts.length);
fs.writeFileSync('scratch/docx_texts.json', JSON.stringify(texts, null, 2));

// Let's also print matching ones for "Psikotes", "DISC", "WPT", "IQ"
texts.forEach(t => {
  if (/psikotes|disc|wpt|iq/i.test(t.text)) {
    console.log(`[${t.index}]: ${t.text}`);
  }
});
