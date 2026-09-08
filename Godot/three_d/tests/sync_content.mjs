// Run only when intentionally refreshing the 3D migration baseline.
import fs from 'node:fs';
import {TABLES, OPPONENTS} from '../../../src/data.js';
fs.writeFileSync(new URL('../rules/content.json', import.meta.url), JSON.stringify({tables: TABLES, opponents: OPPONENTS}, null, 2) + '\n');
console.log('Synced 4 table definitions and 8 opponent profiles from browser content.');
