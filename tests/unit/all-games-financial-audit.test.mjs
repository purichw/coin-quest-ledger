import test from 'node:test';
import assert from 'node:assert/strict';
import '../../shared/pointy-logic.js';
const L = globalThis.PointyLogic;
const start = L.dateOnlyMs('2026-01-01');
const debt = overrides => ({ id:'debt', original:1000, balance:1000, apr:36.5, payment:100,
  interestMode:'simple', payMode:'monthly', createdAt:start, interestAccruedAt:start, log:[], ...overrides });
const near = (actual, expected) => assert.ok(Math.abs(actual-expected)<1e-7, `${actual} != ${expected}`);

test('Debt: interest already accrued is paid before principal, including partial interest payments', () => {
  const accrued=L.accrueDebtToDate(debt(), '2026-01-11').debt;
  const first=L.applyDebtPayment(accrued,5,'2026-01-11');
  near(first.interestPaid,5); near(first.principalPaid,0); near(first.debt.balance,1005);
  const second=L.applyDebtPayment(first.debt,10,'2026-01-11');
  near(second.interestPaid,5); near(second.principalPaid,5); near(second.debt.balance,995);
});

test('Debt: zero-interest payments still advance the recorded financial date', () => {
  const result=L.applyDebtPayment(debt({apr:0}),100,'2026-01-11');
  assert.equal(result.debt.interestAccruedAt,L.dateOnlyMs('2026-01-11'));
});

test('Debt: scheduled budget left over on the last installment pays the next debt in the same month', () => {
  const result=L.simulateLair([debt({id:'a',balance:50,apr:0}),debt({id:'b',balance:150,apr:0})], 'snowball',0);
  assert.equal(result.months,1); assert.equal(result.interest,0);
});

test('Debt: simulation explicitly reports debts without a monthly schedule', () => {
  const result=L.simulateLair([debt({payMode:'adhoc',payment:0})], 'avalanche',0);
  assert.equal(result.excluded,1);
});

test('Treasury: last-day daily allowance still reserves unpaid bills', () => {
  const result=L.treasuryProjection({month:'2026-01',income:1000,expenses:[{amount:100}],bills:[{id:'b',amount:500}]},new Date(2026,0,31));
  assert.equal(result.dailyLeft,400);
});

test('Treasury: cent-exact spending cannot turn an exactly balanced month into a loss', () => {
  const result=L.treasuryClose({month:'2026-01',income:.3,expenses:[{amount:.1},{amount:.2}],history:[],stats:{}});
  assert.equal(result.history[0].spent,.3); assert.equal(result.history[0].won,true);
});

test('Treasury: module and profile use the same 500/80/10 reputation canon and unique logging days', () => {
  const state={month:'2026-01',income:1000,expenses:[{date:'2026-01-02',amount:10},{date:'2026-01-02',amount:20},{date:'2026-01-03',amount:30}],history:[{month:'2025-12',won:true}],stats:{monthsWon:1,onTime:1,logged:3}};
  assert.equal(L.treasuryXp(state),600);
  assert.equal(L.playerProgress([],{}, {treasury:state}).treasuryReputation,600);
});

test('Treasury: limiting detailed history to 12 months does not erase an older earned month', () => {
  const history=Array.from({length:12},(_,i)=>({month:`2025-${String(i+1).padStart(2,'0')}`,won:true}));
  const state={month:'2026-01',income:100,expenses:[{amount:10,date:'2026-01-01'}],history,stats:{monthsWon:12}};
  const closed=L.treasuryClose(state);
  assert.equal(closed.stats.monthsWon,13);
  assert.equal(L.treasuryClose(closed).stats.monthsWon,13);
});

test('Compare: incompatible units do not inflate valid offers to 100 percent saving', () => {
  const ranked=L.rankOffers([{price:10,qty:1,unit:'kg'},{price:20,qty:1,unit:'kg'},{price:100,qty:1,unit:'l'}],{baseUnit:'g'});
  assert.equal(ranked.find(o=>o.price===10).savePct,50);
});

test('Compare: a single offer cannot be a winning comparison or borrow reward from another product', () => {
  assert.equal(L.rankOffers([{price:10,qty:1,unit:'g'}],{baseUnit:'g'})[0].isBest,false);
  const comparisons=[{baseUnit:'g',offers:[{price:10,qty:1,unit:'g'},{price:20,qty:1,unit:'g'}]},
    {baseUnit:'g',offers:Array.from({length:8},()=>({price:10,qty:1,unit:'l'}))}];
  assert.equal(L.playerProgress([],{}, {comparisons}).compareReputation,100);
});

test('Treasury: forecast preserves a one-satang overspend and includes today in the daily allowance', () => {
  const state={month:'2026-01',income:100,expenses:[{amount:100.01}],bills:[]};
  const projection=L.treasuryProjection(state,new Date(2026,0,31));
  assert.equal(projection.projected,100.01); assert.equal(projection.surplus,-.01); assert.equal(projection.onTrack,false);
  assert.equal(L.treasuryProjection({...state,income:3100,expenses:[]},new Date(2026,0,1)).dailyLeft,100);
  assert.equal(L.treasuryProjection({...state,income:2900,expenses:[]},new Date(2024,1,1)).dailyLeft,100);
});

test('Treasury: 25 rollovers retain earned days and wins without duplicating a day or close', () => {
  let state={month:'2024-01',income:100,expenses:[],history:[],stats:{}};
  for(let i=0;i<25;i++) {
    state.month=`${2024+Math.floor(i/12)}-${String(i%12+1).padStart(2,'0')}`;
    state.expenses=[{amount:10,date:`${state.month}-01`},{amount:20,date:`${state.month}-01`}];
    state=L.treasuryClose(L.treasuryClose(state));
  }
  assert.equal(state.history.length,12); assert.equal(state.stats.monthsWon,25); assert.equal(L.treasuryXp(state),12750);
  const revised=L.treasuryClose({...state,expenses:[{amount:200,date:`${state.month}-02`}]});
  assert.equal(revised.stats.monthsWon,24); assert.equal(L.treasuryXp(revised),12250);
});

test('Debt: partial monthly payments keep the reminder until the installment is fully paid', () => {
  const d=debt({balance:950,apr:0,dueDay:10,log:[{amount:50,ts:L.dateOnlyMs('2026-01-09')}]});
  assert.equal(L.debtDueStatus(d,new Date(2026,0,11)).overdue,true);
  d.log.push({amount:50,ts:L.dateOnlyMs('2026-01-11')}); d.balance=900;
  assert.deepEqual(L.debtDueStatus(d,new Date(2026,0,11)),{overdue:false,days:30});
  assert.equal(L.debtDueStatus({...d,log:[{amount:100,ts:0,date:''}]},new Date(2026,0,11)).overdue,true);
});

test('Debt: daily compounding is partition-invariant; all payment parts reconcile to the same balance', () => {
  for(const apr of [0,3.5,18,36.5]) for(const mode of ['simple','compound']) {
    const d=debt({apr,interestMode:mode});
    const whole=L.accrueDebtToDate(d,'2026-02-01');
    const pieces=L.accrueDebtToDate(L.accrueDebtToDate(d,'2026-01-16').debt,'2026-02-01');
    near(whole.debt.balance,pieces.debt.balance);
    const expected=mode==='simple'?1000+1000*apr/100/365*31:1000*Math.pow(1+apr/100/365,31);
    near(whole.debt.balance,expected);
    for(const amount of [0.01,5,100,expected]) {
      const paid=L.applyDebtPayment(whole.debt,amount,'2026-02-01');
      near(paid.interestPaid+paid.principalPaid,paid.applied);
      near(paid.debt.balance+paid.applied,expected);
      assert.ok(paid.debt.unpaidInterest>=0 && paid.debt.unpaidInterest<=paid.debt.balance+1e-7);
    }
  }
});

test('Debt: an installment no larger than interest cannot produce a fictitious payoff date', () => {
  const d=debt({balance:1000,original:1000,apr:12,payment:10});
  assert.equal(L.payoffMonths(d),Infinity); assert.equal(L.simulateLair([d]).never,true);
  const accelerated=L.simulateLair([d],'avalanche',100);
  assert.equal(accelerated.months,10); assert.equal(accelerated.interest,100);
});

test('Compare: pack promotions use the actual paid quantity, ties have no invented saving', () => {
  const promo=L.normalizedOffer({price:60,qty:1,unit:'แพ็ค/กล่อง',perPack:6,buy:2,free:1},{baseUnit:'ชิ้น'});
  near(promo.pu,120/18);
  const ranked=L.rankOffers([{price:10,qty:100,unit:'g'},{price:100,qty:1,unit:'kg'}],{baseUnit:'g'});
  assert.ok(ranked.every(o=>o.isEqual && o.savePct===0));
  const malformed=L.normalizeComparison({baseUnit:'ชิ้น',offers:[{price:60,qty:1,unit:'ชิ้น',buy:2.5,free:1}]});
  assert.equal(malformed.offers[0].buy,2.5); assert.equal(L.normalizedOffer(malformed.offers[0],malformed).valid,false);
  assert.equal(L.normalizedOffer({price:60,qty:1,unit:'แพ็ค/กล่อง',perPack:2.5},{baseUnit:'ชิ้น'}).valid,false);
});
