// Run only when intentionally refreshing the 3D migration baseline.
import fs from 'node:fs';
import {TABLES, OPPONENTS, TAVERN_SCENES, STARTING_VAULT, STANDARD_BANKROLL, ITEM_DEFS, TAVERN_SHOPS, SEARCH_ACTIONS, INVENTORY_SLOTS} from '../../../src/data.js';
fs.writeFileSync(new URL('../rules/content.json', import.meta.url), JSON.stringify({tables: TABLES, opponents: OPPONENTS, scenes: TAVERN_SCENES, startingVault: STARTING_VAULT, standardBankroll: STANDARD_BANKROLL, items: ITEM_DEFS, shops: TAVERN_SHOPS, searchActions: SEARCH_ACTIONS, inventorySlots: INVENTORY_SLOTS}, null, 2) + '\n');
console.log('Synced 4 table definitions 8 opponent profiles and run economy from browser content.');
