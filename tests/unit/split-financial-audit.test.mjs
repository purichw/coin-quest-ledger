import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const sandbox = {};
vm.runInNewContext(fs.readFileSync(new URL('../../shared/pointy-logic.js', import.meta.url), 'utf8'), sandbox);
const L = sandbox.PointyLogic;
const plain = value => JSON.parse(JSON.stringify(value));
const cents = value => Math.round(value * 100);
const expense = (amount, paidBy, sharedBy, split, payers) => ({ id: 'bill', desc: 'Meal', amount, paidBy, sharedBy, ...(split ? { split } : {}), ...(payers ? { payers } : {}) });
const transfers = state => plain(L.pendingSettlements(state)).sort((a,b) => `${a.from}:${a.to}`.localeCompare(`${b.from}:${b.to}`));

test('one satang owed by three other people never disappears', () => {
  const e = expense(.01, 'A', ['B', 'C', 'D']);
  const shares = plain(L.splitShares(e));
  assert.equal(Object.values(shares).reduce((sum, n) => sum + cents(n), 0), 1);
  assert.deepEqual(transfers({ participants: ['A','B','C','D'], expenses: [e] }), [{ from: 'B', to: 'A', amount: .01 }]);
});

test('all five split methods allocate actual satang and preserve the bill total', () => {
  const names = ['A','B','C'];
  for (const split of [undefined, { mode:'shares', weights:{ A:1,B:1,C:1 } }, { mode:'percent', weights:{ A:33.33,B:33.33,C:33.34 } }, { mode:'exact', weights:{ A:.33,B:.33,C:.34 } }, { mode:'items', items:[{name:'snack',amount:1,claimedBy:[]}] }]) {
    const shares = plain(L.splitShares(expense(1, 'A', names, split)));
    assert.equal(Object.values(shares).reduce((sum,n) => sum+cents(n),0),100);
    for (const n of Object.values(shares)) assert.ok(Math.abs(n*100-cents(n)) < 1e-7);
  }
});

test('item claimers cannot contain the same person twice', () => {
  assert.throws(() => L.validateLedgerExpense(expense(30,'A',['A','B','C'],{mode:'items',items:[{name:'meal',amount:30,claimedBy:['B','B','C']}]}), ['A','B','C']));
});

test('Firestore payer-map ordering cannot change a cent or the recipient', () => {
  const state={participants:['A','B','C'],expenses:[expense(.07,'B',['A','B','C'],undefined,{B:.04,C:.03})]};
  const reordered={...state,expenses:[{...state.expenses[0],payers:{C:.03,B:.04}}]};
  assert.deepEqual(transfers(state),transfers(reordered));
  assert.deepEqual(plain(L.splitShares(state.expenses[0])),plain(L.splitShares(reordered.expenses[0])));
});

test('satang repair does not reopen a confirmed pair in an unchanged legacy ledger', () => {
  const state={participants:['A','B','C','D'],expenses:[expense(1,'A',['B','C','D'])]};
  state.settlementRecords=[{from:'B',to:'A',amount:.33,revision:L.settlementRevision(state),at:1}];
  assert.equal(transfers(state).some(t=>t.from==='B'),false);
});

test('profile balance reflects repayments and profile XP never rounds fronted baht first', () => {
  let board={participants:['A','B','C'],characterIds:{A:'7101'},expenses:[expense(29.97,'A',['A','B','C'])]};
  const party=L.computeParty(board);
  const before=L.buildCharacterProfile('7101',[{id:'board',data:board}],{});
  assert.equal(before.xp,party[0].xp);
  board=L.confirmSettlement(board,'B','A');
  board=L.confirmSettlement(board,'C','A');
  const after=L.buildCharacterProfile('7101',[{id:'board',data:board}],{});
  assert.equal(after.totals.balance,0);
  assert.equal(after.xp,party[0].xp+240);
});

test('repayments remain real money after increases, decreases, deletion and restore', () => {
  let board={participants:['A','B','C'],expenses:[expense(300,'A',['A','B','C'])]};
  board=L.confirmSettlement(board,'B','A',1);
  assert.deepEqual(transfers({...board,expenses:[expense(450,'A',['A','B','C'])]}),[{from:'B',to:'A',amount:50},{from:'C',to:'A',amount:150}]);
  assert.deepEqual(transfers({...board,expenses:[expense(150,'A',['A','B','C'])]}),[{from:'A',to:'B',amount:50},{from:'C',to:'A',amount:50}]);
  assert.deepEqual(transfers({...board,expenses:[]}),[{from:'A',to:'B',amount:100}]);
  assert.deepEqual(transfers(L.normalizeTripState(plain(board))),[{from:'C',to:'A',amount:100}]);
  const xp=plain(board.settleXp);
  const increased={...board,expenses:[expense(450,'A',['A','B','C'])]};
  const toppedUp=L.confirmSettlement(increased,'B','A',2);
  assert.deepEqual(plain(toppedUp.settleXp),xp);
  assert.equal(toppedUp.settlementRecords[1].amount,50);
  const refunded=L.confirmSettlement({...toppedUp,expenses:[]},'A','B',3);
  assert.deepEqual(plain(refunded.settleXp),xp);
  assert.deepEqual(transfers(refunded),[]);
  assert.equal(L.confirmSettlement(refunded,'A','B',4),refunded);
});

test('new repayments retain their recorded money across revisions and deduplicate by id', () => {
  const board={participants:['A','B','C'],expenses:[expense(300,'A',['A','B','C'])],settleXp:{B:180,A:120},settlementRecords:[{from:'B',to:'A',amount:40,kind:'repayment',id:'paid1',revision:'older',at:1}]};
  assert.deepEqual(transfers(board),[{from:'B',to:'A',amount:60},{from:'C',to:'A',amount:100}]);
  const next=L.confirmSettlement(board,'B','A',2);
  assert.deepEqual(plain(next.settleXp),board.settleXp);
  const duplicate={...next,settlementRecords:[...next.settlementRecords,next.settlementRecords[1]]};
  assert.deepEqual(transfers(duplicate),[{from:'C',to:'A',amount:100}]);
  assert.deepEqual(transfers({...board,settlementRecords:[{from:'A',to:'A',amount:900},{from:'X',to:'A',amount:900},{from:'B',to:'A',amount:-900},{from:'B',to:'A',amount:Infinity}]}),[{from:'B',to:'A',amount:100},{from:'C',to:'A',amount:100}]);
});

test('legacy revision checkmarks migrate once without duplicate repayments or invented refunds', () => {
  const board={activeCampaignId:'camp',participants:['A','B','C'],expenses:[expense(300,'A',['A','B','C'])],settleXp:{B:360,A:240}};
  const revision=L.settlementRevision(board);
  board.settlementRecords=[{from:'B',to:'A',amount:100,revision:'old',at:1},{from:'B',to:'A',amount:100,revision,at:2}];
  board.campaigns=[{...board,id:'camp'}];
  const migrated=L.normalizeTripState(plain(board));
  assert.deepEqual(plain(migrated.settlementRecords.map(r=>r.kind)),['legacy_confirmation','repayment']);
  assert.deepEqual(transfers(migrated),[{from:'C',to:'A',amount:100}]);
  assert.deepEqual(transfers({...migrated,expenses:[]}),[{from:'A',to:'B',amount:100}]);
  assert.deepEqual(transfers({...migrated,expenses:[expense(450,'A',['A','B','C'])]}),[{from:'B',to:'A',amount:50},{from:'C',to:'A',amount:150}]);
  assert.deepEqual(plain(L.normalizeTripState(migrated).settlementRecords),plain(migrated.settlementRecords));
  assert.deepEqual(plain(migrated.campaigns[0].settlementRecords),plain(migrated.settlementRecords));
  assert.deepEqual(plain(migrated.settleXp),board.settleXp);
  board.characterIds={A:'7101'};
  board.settlementRecords.push({from:'C',to:'A',amount:100,revision,at:3});
  board.campaigns=[{...board,id:'camp'}];
  const rawProgress=L.playerProgress([{id:'board',data:board}],{id:'7101',name:'A'});
  const normalizedProgress=L.playerProgress([{id:'board',data:L.normalizeTripState(plain(board))}],{id:'7101',name:'A'});
  assert.deepEqual(plain(rawProgress),plain(normalizedProgress));
});

test('four-person receipts stay pairwise after changing payer and removing a participant share', () => {
  let board={participants:['A','B','C','D'],expenses:[expense(400,'A',['A','B','C','D'])]};
  for(const name of ['B','C','D']) board=L.confirmSettlement(board,name,'A');
  board={...board,expenses:[expense(300,'B',['B','C','D'])]};
  assert.deepEqual(transfers(board),[{from:'A',to:'B',amount:100},{from:'A',to:'C',amount:100},{from:'A',to:'D',amount:100},{from:'C',to:'B',amount:100},{from:'D',to:'B',amount:100}]);
  // No global rerouting: A must refund each person who actually repaid A.
  while(transfers(board).length) {const t=transfers(board)[0]; board=L.confirmSettlement(board,t.from,t.to);}
  assert.deepEqual(transfers(plain(board)),[]);
  assert.deepEqual(plain(board.settleXp),{A:360,B:420,C:360,D:360});
});

test('normalization preserves orphaned repayment audit history without assigning it to current members', () => {
  const old={from:'B',to:'A',amount:100,revision:'old',at:1};
  const durable={...old,id:'real',kind:'repayment',amount:25};
  const state=L.normalizeTripState({participants:['A','C'],expenses:[expense(200,'A',['A','C'])],settlementRecords:[old,durable]});
  assert.equal(state.settlementRecords.length,2);
  assert.equal(state.settlementRecords[0].kind,'legacy_confirmation');
  assert.deepEqual(plain(state.settlementRecords[1]),durable);
  assert.deepEqual(transfers(state),[{from:'C',to:'A',amount:100}]);
  assert.deepEqual(transfers({...state,participants:['A','B','C']}),[{from:'A',to:'B',amount:25},{from:'C',to:'A',amount:100}]);
  const broken={participants:['A','C'],expenses:[expense(200,'A',['A','C'])]};
  broken.settlementRecords=[null,'bad',{from:'C',to:'A',amount:-100,revision:L.settlementRevision(broken),at:1}];
  const normalized=L.normalizeTripState(broken);
  assert.equal(normalized.settlementRecords.length,1);
  assert.equal(normalized.settlementRecords[0].kind,'legacy_confirmation');
  assert.deepEqual(transfers(normalized),[{from:'C',to:'A',amount:100}]);
});

test('3–6 people, multiple payers and small amounts conserve every persons balance', () => {
  let seed = 481;
  const random = max => { seed = (Math.imul(seed,1664525)+1013904223) >>> 0; return seed % max; };
  for (let run=0;run<600;run++) {
    const names = ['A','B','C','D','E','F'].slice(0,3+random(4));
    const expenses = Array.from({length:1+random(5)},(_,i) => {
      const amount = 1+random(100000);
      const paid = {}; let remaining=amount;
      names.forEach((n,j) => { const value=j===names.length-1?remaining:random(remaining+1); paid[n]=value/100; remaining-=value; });
      const shared = names.filter(() => random(3)!==0); if (!shared.length) shared.push(names[0]);
      return {...expense(amount/100,names[0],shared,undefined,paid),id:String(i)};
    });
    const state={participants:names,expenses};
    const party=L.computeParty(state), pending=transfers(state);
    for (const p of party) {
      const net=pending.reduce((sum,t) => sum+(t.to===p.name?cents(t.amount):0)-(t.from===p.name?cents(t.amount):0),0);
      assert.equal(net,cents(p.paid)-cents(p.share),`case ${run}, ${p.name}: transfer balance must equal paid minus used`);
    }
    for (const t of pending) { assert.notEqual(t.from,t.to); assert.ok(t.amount>=.01); }
  }
});
