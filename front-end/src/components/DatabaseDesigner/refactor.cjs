const fs = require('fs');
const content = fs.readFileSync('DatabaseDesigner.tsx', 'utf8');
const lines = content.split('\n');

const startIndexTypes = lines.findIndex(l => l.includes('interface DatabaseDesignerProps'));
const endIndexTypes = lines.findIndex(l => l.includes('export default function DatabaseDesigner({'));

const startIndexState = lines.findIndex(l => l.includes('// Docify state variables'));
const endIndexState = lines.findIndex(l => l.includes('// Split View Editor state'));

const startIndexLogic = lines.findIndex(l => l.includes('const getRepoDocInfo = ('));
const endIndexLogic = lines.findIndex(l => l.includes('const [isPropertiesCollapsed, setIsPropertiesCollapsed]'));

const startIndexJsx = lines.findIndex(l => l.includes("{activeMasterTab === 'docify' && ("));
const endIndexJsx = lines.findIndex(l => l.includes("{activeMasterTab === 'profile' && ("));

console.log('Types:', startIndexTypes, endIndexTypes);
console.log('State:', startIndexState, endIndexState);
console.log('Logic:', startIndexLogic, endIndexLogic);
console.log('JSX:', startIndexJsx, endIndexJsx);

let newLines = [];
for (let i = 0; i < lines.length; i++) {
  if (i === startIndexTypes) {
    newLines.push("import { Table, Column, DatabaseDesignerProps } from './types';");
    newLines.push("import { DocifyView } from './DocifyView';");
    newLines.push("import { escapeHtml, highlightShorthand, serializeTablesToShorthand } from './utils';");
    i = endIndexTypes - 1;
    continue;
  }
  
  if (i >= startIndexState && i < endIndexState) {
    continue;
  }
  
  if (i >= startIndexLogic && i < endIndexLogic) {
    continue;
  }
  
  if (i === startIndexJsx) {
    newLines.push("          {activeMasterTab === 'docify' && (");
    newLines.push("            <DocifyView tables={tables} showNotification={showNotification} />");
    newLines.push("          )}");
    newLines.push("");
    i = endIndexJsx - 1;
    continue;
  }
  
  newLines.push(lines[i]);
}

fs.writeFileSync('DatabaseDesigner.tsx', newLines.join('\n'));
console.log('Refactored successfully!');
