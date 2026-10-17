const C = require("../calc.js"),
  assert = require("assert");
let n = 0;
const near = (a, b, t = 0.01, m) => {
  assert.ok(Math.abs(a - b) <= t, `${m}: ${a} vs ${b}`);
  n++;
};
// Semi-annual compounding: 5% nominal -> monthly 0.4123915%
near(C.caMonthly(5), 0.004123915, 1e-8, "ca monthly");
// $500k, 5% semi-annual, 25y: known payment 2908.02
near(C.payment(500000, C.caMonthly(5), 300), 2908.02, 0.05, "ca pmt");
// US $400k, 6.5%, 30y: 2528.27
near(C.payment(400000, C.usMonthly(6.5), 360), 2528.27, 0.02, "us pmt");
near(C.payment(1200, 0, 12), 100, 1e-9, "zero rate");
// Balance after full term is zero
const i = C.caMonthly(4);
const p = C.payment(300000, i, 300);
near(C.balanceAfter(300000, i, p, 300), 0, 0.01, "bal zero");
// Schedule interest equals total paid minus principal
const s = C.schedule(300000, i, p, 300);
near(s[s.length - 1].int, p * 300 - 300000, 0.5, "sched int");
// MQR
near(C.qualifyingRate(3), 5.25, 0, "mqr floor");
near(C.qualifyingRate(4.5), 6.5, 1e-9, "mqr +2");
// Stress test GDS hand check
const st = C.stressTest({
  price: 600000,
  down: 120000,
  rate: 4,
  amort: 25,
  income: 150000,
  tax: 4800,
  heat: 120,
  condo: 400,
  debts: 500,
});
const qp = C.payment(480000, C.caMonthly(6), 300);
near(st.qualPmt, qp, 1e-6, "qual pmt");
near(st.gds, ((qp + 400 + 120 + 200) / 12500) * 100, 1e-6, "gds");
near(st.tds, ((qp + 400 + 120 + 200 + 500) / 12500) * 100, 1e-6, "tds");
// maxPurchase lands on the binding constraint
const mp = C.maxPurchase({
  down: 100000,
  rate: 4,
  amort: 25,
  income: 120000,
  tax: 4000,
  heat: 100,
  condo: 0,
  debts: 300,
});
const r = C.stressTest({
  down: 100000,
  rate: 4,
  amort: 25,
  income: 120000,
  tax: 4000,
  heat: 100,
  condo: 0,
  debts: 300,
  price: mp,
});
assert.ok(r.passGDS && r.passTDS && (Math.abs(r.gds - 39) < 0.01 || Math.abs(r.tds - 44) < 0.01));
n++;
// Renewal shock: same rate gives zero change
near(C.renewalShock({ balance: 500000, origRate: 5, amortLeft: 25, term: 5, newRate: 5 }).change, 0, 0.01, "no shock");
const rs = C.renewalShock({ balance: 500000, origRate: 2, amortLeft: 25, term: 5, newRate: 4.5 });
assert.ok(rs.changePct > 20 && rs.changePct < 30);
n++;
// Prepay with zero extra saves nothing
near(C.prepay({ balance: 400000, rate: 5, amort: 25, extra: 0, lump: 0 }).interestSaved, 0, 1, "no prepay");
const pp = C.prepay({ balance: 400000, rate: 5, amort: 25, extra: 300, lump: 0 });
assert.ok(pp.monthsSaved > 0 && pp.interestSaved > 0);
n++;
// Penalty
const pe = C.penalty({ balance: 400000, contractRate: 5, comparisonRate: 3, monthsLeft: 36 });
near(pe.threeMonths, 5000, 1e-6, "3mo");
near(pe.ird, 24000, 1e-6, "ird");
near(pe.fixed, 24000, 0, "fixed");
near(C.penalty({ balance: 400000, contractRate: 3, comparisonRate: 5, monthsLeft: 36 }).ird, 0, 0, "ird floor");
// Rent vs buy returns one row per year
assert.equal(
  C.rentVsBuy({
    price: 700000,
    down: 140000,
    rate: 4.5,
    amort: 25,
    years: 10,
    rent: 2800,
    rentGrowth: 3,
    appreciation: 3,
    investReturn: 5,
    taxPct: 0.7,
    maintPct: 1,
    closingPct: 1.5,
    sellPct: 5,
  }).length,
  10,
);
n++;
const cu = C.canadaVsUS({ loan: 400000, caRate: 6.5, usRate: 6.5 });
assert.ok(cu.caPmt > cu.usPmt);
n++;
console.log(`decision-lab: ${n} assertions passed`);
