// Mortgage math. Canadian fixed-rate mortgages compound semi-annually; US mortgages compound monthly.
(function (root) {
  const caMonthly = (r) => Math.pow(1 + r / 200, 1 / 6) - 1;
  const usMonthly = (r) => r / 1200;
  function payment(P, i, n) {
    if (n <= 0) return 0;
    if (i === 0) return P / n;
    return (P * i) / (1 - Math.pow(1 + i, -n));
  }
  function balanceAfter(P, i, pmt, k) {
    if (i === 0) return Math.max(0, P - pmt * k);
    return Math.max(0, P * Math.pow(1 + i, k) - (pmt * (Math.pow(1 + i, k) - 1)) / i);
  }
  function schedule(P, i, pmt, months) {
    const rows = [];
    let b = P,
      int = 0,
      prin = 0;
    for (let m = 1; m <= months && b > 0.005; m++) {
      const ii = b * i,
        pp = Math.min(b, pmt - ii);
      b -= pp;
      int += ii;
      prin += pp;
      rows.push({ m, bal: b, int, prin });
    }
    return rows;
  }
  const qualifyingRate = (c) => Math.max(5.25, c + 2);
  function stressTest(o) {
    // o: price, down, rate, amort, income (annual), tax (annual), heat (monthly), condo (monthly), debts (monthly)
    const P = o.price - o.down,
      qr = qualifyingRate(o.rate),
      i = caMonthly(qr),
      pmt = payment(P, i, o.amort * 12),
      inc = o.income / 12;
    const housing = pmt + o.tax / 12 + o.heat + 0.5 * o.condo;
    const gds = (housing / inc) * 100,
      tds = ((housing + o.debts) / inc) * 100;
    return {
      loan: P,
      qr,
      qualPmt: pmt,
      contractPmt: payment(P, caMonthly(o.rate), o.amort * 12),
      gds,
      tds,
      passGDS: gds <= 39,
      passTDS: tds <= 44,
      ltv: (P / o.price) * 100,
    };
  }
  function maxPurchase(o) {
    let lo = 0,
      hi = 1e8;
    for (let k = 0; k < 80; k++) {
      const m = (lo + hi) / 2;
      const r = stressTest({ ...o, price: m, down: Math.max(o.down, 0) });
      if (r.passGDS && r.passTDS) lo = m;
      else hi = m;
    }
    return lo;
  }
  function renewalShock(o) {
    // balance, origRate, amortLeft (yrs at origination), term (yrs), newRate
    const i0 = caMonthly(o.origRate),
      n = o.amortLeft * 12,
      p0 = payment(o.balance, i0, n),
      b = balanceAfter(o.balance, i0, p0, o.term * 12);
    const p1 = payment(b, caMonthly(o.newRate), n - o.term * 12);
    let extend = null;
    for (let y = 0; y <= 10; y++) {
      const p = payment(b, caMonthly(o.newRate), n - o.term * 12 + y * 12);
      if (p <= p0 + 0.005) {
        extend = y;
        break;
      }
    }
    return {
      oldPmt: p0,
      balAtRenewal: b,
      newPmt: p1,
      change: p1 - p0,
      changePct: (p1 / p0 - 1) * 100,
      yearsToExtend: extend,
    };
  }
  function prepay(o) {
    // balance, rate, amort, extra (monthly), lump (annual)
    const i = caMonthly(o.rate),
      p = payment(o.balance, i, o.amort * 12);
    const base = schedule(o.balance, i, p, o.amort * 12);
    let b = o.balance,
      int = 0,
      m = 0;
    while (b > 0.005 && m < o.amort * 12) {
      m++;
      const ii = b * i;
      int += ii;
      b = b + ii - (p + o.extra);
      if (m % 12 === 0 && b > 0) b -= Math.min(b, o.lump);
    }
    const baseInt = base[base.length - 1].int;
    return {
      pmt: p,
      baseMonths: base.length,
      months: m,
      monthsSaved: base.length - m,
      interestBase: baseInt,
      interestNew: int,
      interestSaved: baseInt - int,
    };
  }
  function penalty(o) {
    // balance, contractRate, comparisonRate, monthsLeft
    const three = (((o.balance * o.contractRate) / 100) * 3) / 12;
    const ird = Math.max(0, (((o.balance * (o.contractRate - o.comparisonRate)) / 100) * o.monthsLeft) / 12);
    return { threeMonths: three, ird, fixed: Math.max(three, ird), variable: three };
  }
  function rentVsBuy(o) {
    // price, down, rate, amort, years, rent, rentGrowth, appreciation, investReturn, taxRate(prop % of value), maintPct, closingPct, sellPct
    const i = caMonthly(o.rate),
      L = o.price - o.down,
      p = payment(L, i, o.amort * 12);
    let val = o.price,
      rent = o.rent,
      port = o.down + (o.price * o.closingPct) / 100;
    const out = [];
    for (let y = 1; y <= o.years; y++) {
      const own = p * 12 + (val * (o.taxPct + o.maintPct)) / 100,
        rentCost = rent * 12;
      port = port * (1 + o.investReturn / 100) + (own - rentCost);
      val *= 1 + o.appreciation / 100;
      rent *= 1 + o.rentGrowth / 100;
      const bal = balanceAfter(L, i, p, y * 12);
      out.push({ y, buyNW: val * (1 - o.sellPct / 100) - bal, rentNW: port });
    }
    return out;
  }
  function canadaVsUS(o) {
    // loan, caRate, usRate
    const ca = payment(o.loan, caMonthly(o.caRate), 300),
      us = payment(o.loan, usMonthly(o.usRate), 360);
    const ca5 = balanceAfter(o.loan, caMonthly(o.caRate), ca, 60),
      us5 = balanceAfter(o.loan, usMonthly(o.usRate), us, 60);
    return {
      caPmt: ca,
      usPmt: us,
      caBal5: ca5,
      usBal5: us5,
      caInt5: ca * 60 - (o.loan - ca5),
      usInt5: us * 60 - (o.loan - us5),
    };
  }
  const api = {
    caMonthly,
    usMonthly,
    payment,
    balanceAfter,
    schedule,
    qualifyingRate,
    stressTest,
    maxPurchase,
    renewalShock,
    prepay,
    penalty,
    rentVsBuy,
    canadaVsUS,
  };
  if (typeof module !== "undefined") module.exports = api;
  else root.Calc = api;
})(this);
