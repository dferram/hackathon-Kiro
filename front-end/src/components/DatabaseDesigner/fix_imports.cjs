const fs = require('fs');

let db = fs.readFileSync('DatabaseDesigner.tsx', 'utf8');
db = db.replace("import { Table, Column, DatabaseDesignerProps } from './types';", "import type { Table, Column, DatabaseDesignerProps } from './types';");
fs.writeFileSync('DatabaseDesigner.tsx', db);

let docify = fs.readFileSync('DocifyView.tsx', 'utf8');
docify = docify.replace("import { Table } from './types';", "import type { Table } from './types';");
fs.writeFileSync('DocifyView.tsx', docify);

let utils = fs.readFileSync('utils.ts', 'utf8');
utils = utils.replace("import { Table } from './types'", "import type { Table } from './types'");
fs.writeFileSync('utils.ts', utils);

console.log('Fixed imports!');
