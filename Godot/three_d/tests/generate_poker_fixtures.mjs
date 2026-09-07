// Expected results come from the existing browser rules, not the GDScript port.
import fs from 'node:fs';
import { createDeck, shuffleDeck, makeDeterministicRng, evaluateBestHand, compareHands } from '../../../src/poker.js';
const fixtures = {hands: [], comparisons: [], random: [], decks: []};
const parse = line => line.split(' ').map(code => ({rank: ({T:10,J:11,Q:12,K:13,A:14})[code[0]] ?? Number(code.slice(0,-1)), suit:code.at(-1)}));
for (const line of ['AS KS QS JS TS 2H 3D','AS 2S 3S 4S 5S KH QD','AS AH AD AC KS 2H 3D','AS AH AD KS KH 2S 3S','AS JS 8S 5S 2S KH QD','AS 2H 3D 4C 5S KH QD','AS AH AD KS QC 2H 3D','AS AH KS KH QS 2H 3D','AS AH KD QC 9S 2H 3D','AS KH QD JC 9S 2H 3D','AS AH AD KS KH KD QS','AS AH KS KH QS QH 2D']) {
  const cards = parse(line);
  fixtures.hands.push({cards, expected:evaluateBestHand(cards)});
}
const rng = makeDeterministicRng(20260907);
for(let i=0;i<1000;i++) {
  const cards=shuffleDeck(createDeck(),rng).slice(0,5+i%3);
  fixtures.hands.push({cards,expected:evaluateBestHand(cards)});
}
fixtures.hands.push({cards:[],expected:evaluateBestHand([])});
for(let i=0;i<200;i++) {
  const a=fixtures.hands[i].expected,b=fixtures.hands[i+100].expected;
  fixtures.comparisons.push({a,b,expected:Math.sign(compareHands(a,b))});
}
for(const seed of [0,1,-1,20260907,4294967295]) {
  const generator=makeDeterministicRng(seed);
  fixtures.random.push({seed,expected:Array.from({length:20},()=>generator())});
  fixtures.decks.push({seed,expected:shuffleDeck(createDeck(),makeDeterministicRng(seed))});
}
const file=new URL('./poker-fixtures.json',import.meta.url);
fs.writeFileSync(file,JSON.stringify(fixtures));
console.log(`Generated ${fixtures.hands.length} hand cases, ${fixtures.comparisons.length} comparisons, 100 RNG outputs and 5 decks.`);
