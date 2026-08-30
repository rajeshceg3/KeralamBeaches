import { readFileSync, statSync } from 'node:fs';
for (const file of ['index.html','src/main.js','src/styles.css']) {
  const text = readFileSync(file, 'utf8');
  if (!text.trim()) throw new Error(`${file} is empty`);
  statSync(file);
}
console.log('Static site assets validated.');
