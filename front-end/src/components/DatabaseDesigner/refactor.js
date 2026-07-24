const fs = require('fs');
const content = fs.readFileSync('DatabaseDesigner.tsx', 'utf8');

let newContent = content.replace(/interface DatabaseDesignerProps[\s\S]*?const serializeTablesToShorthand[\s\S]*?\n\}\n/m, "import { Table, Column, DatabaseDesignerProps } from './types';\nimport { DocifyView } from './DocifyView';\nimport { escapeHtml, highlightShorthand, serializeTablesToShorthand } from './utils';\n");

// Replace Docify state
newContent = newContent.replace(/\/\/ Docify state variables[\s\S]*?(?=\/\/ Export \/ Script Generator state)/m, "");

// Replace Docify logic
newContent = newContent.replace(/const getRepoDocInfo =[\s\S]*?showNotification\('Documentación descargada correctamente!'\);\n  };\n/m, "");

// Replace Docify JSX
newContent = newContent.replace(/\{activeMasterTab === 'docify' && \([\s\S]*?<!-- End Docify -->\n?[\s\S]*?(?=\{activeMasterTab === 'profile')/m, "{activeMasterTab === 'docify' && (\n            <DocifyView tables={tables} showNotification={showNotification} />\n          )}\n\n          ");

fs.writeFileSync('DatabaseDesigner.tsx', newContent);
