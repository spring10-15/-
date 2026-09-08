// Test-only access to existing browser table functions; production files stay unchanged.
import fs from 'node:fs';
const sourceURL = new URL('../../../src/game.js',import.meta.url);
let source = fs.readFileSync(sourceURL,'utf8');
source = source.replace(/from "\.\/([^\"]+)"/g,(_,file)=>`from "${new URL(file,sourceURL).href}"`);
const marker='  return {\n    state,\n    dispatch,';
if(!source.includes(marker)) throw new Error('Browser test access point changed; inspect before regenerating.');
source=source.replace(marker,'  return {\n    tableTest: { createTableState, applyTableAction, advanceStreetOrResolve, buildLegalActionMap },\n    state,\n    dispatch,');
// Keep browser pacing enabled so snapshots contain one action, not synchronous AI turns.
globalThis.window = {};
const {createGame}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const {TABLES}=await import(new URL('../../../src/data.js',import.meta.url));
const clone=x=>JSON.parse(JSON.stringify(x));
function project(t) {
 return {pot:t.pot,currentBet:t.currentBet,street:t.street,community:t.community,turnCounter:t.turnCounter,raiseUsed:t.raiseUsed,firstAggressionDiscountAvailable:t.firstAggressionDiscountAvailable,toAct:t.toAct,currentActorId:t.currentActorId??'',players:t.players.map(p=>({id:p.id,stack:p.stack,currentBet:p.currentBet,handContribution:p.handContribution,folded:p.folded,holeCards:p.holeCards}))};
}
const cases=[];
for(let seed=1;seed<=12;seed++) {
 const storage=new Map();
 globalThis.localStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)};
 const game=createGame();game.dispatch('start-run');game.state.run.randomSeed=seed*177;
 const table=game.tableTest.createTableState(game.state.run,TABLES['cargo-table'],null);
 game.state.run.currentTable=table;game.state.mode='table';
 for(let i=0;i<15&&!table.pendingNextHand&&!table.pendingConclusion;i++) {
  if(!table.currentActorId){game.tableTest.advanceStreetOrResolve(table);continue;}
  const actor=table.players.find(p=>p.id===table.currentActorId),legal=game.tableTest.buildLegalActionMap(table)[actor.id];
  let kind=legal.check?'check':legal.call?'call':'all-in';
  if(seed%3===0&&legal.raise)kind='raise';
  if(seed%4===0&&i===0)kind='all-in';
  const before=clone(table);before.status='playing';before.summary={};
  const id=actor.id;
  game.tableTest.applyTableAction(table,actor,kind);
  cases.push({id,kind,before,resolved:table.pendingNextHand||table.pendingConclusion,expected:clone(project(table))});
 }
}
for (const entry of cases) {
 const funded=entry.expected.players.filter(p=>!p.folded&&p.stack>0);
 if(!entry.resolved&&funded.length===1&&funded[0].currentBet>=entry.expected.currentBet&&entry.expected.toAct.length) {
  entry.intentionalDifference='Skip unopposed action: other surviving players are all-in and no call is owed.';
 }
}
fs.writeFileSync(new URL('./table-fixtures.json',import.meta.url),JSON.stringify(cases));
console.log(`Generated ${cases.length} table action snapshots from browser rules.`);
