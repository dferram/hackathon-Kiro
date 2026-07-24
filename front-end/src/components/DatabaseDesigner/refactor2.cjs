const fs = require('fs');
const content = fs.readFileSync('DatabaseDesigner.tsx', 'utf8');
const lines = content.split('\n');

const startIndexDocify = lines.findIndex(l => l.includes('// Docify state variables'));
const endIndexDocify = lines.findIndex(l => l.includes('const [isPropertiesCollapsed, setIsPropertiesCollapsed]'));

console.log('Docify Logic:', startIndexDocify, endIndexDocify);

let newLines = [];
for (let i = 0; i < lines.length; i++) {
  if (startIndexDocify !== -1 && endIndexDocify !== -1 && i >= startIndexDocify && i < endIndexDocify) {
    continue;
  }
  newLines.push(lines[i]);
}

fs.writeFileSync('DatabaseDesigner.tsx', newLines.join('\n'));
console.log('Fixed state removal!');
