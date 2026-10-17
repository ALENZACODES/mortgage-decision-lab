(function () {
  const $ = (s) => document.querySelector(s),
    C = window.Calc;
  const money = (v) => "$" + Math.round(v).toLocaleString("en-CA"),
    pct = (v) => v.toFixed(1) + "%";
  const M = {
    stress: {
      name: "Stress test",
      fields: [
        ["price", "Purchase price", 750000, 10000],
        ["down", "Down payment", 150000, 5000],
        ["rate", "Contract rate %", 4.29, 0.05],
        ["amort", "Amortization (yrs)", 25, 1],
        ["income", "Household income / yr", 165000, 1000],
        ["tax", "Property tax / yr", 5200, 100],
        ["heat", "Heating / mo", 120, 10],
        ["condo", "Condo fees / mo", 0, 25],
        ["debts", "Other debt payments / mo", 650, 25],
      ],
      run(v) {
        const r = C.stressTest(v),
          mx = C.maxPurchase(v);
        kpis([
          ["Qualifying rate", pct(r.qr), "greater of 5.25% or contract + 2%"],
          ["GDS", pct(r.gds), r.passGDS ? "within 39%" : "over 39%", r.passGDS],
          ["TDS", pct(r.tds), r.passTDS ? "within 44%" : "over 44%", r.passTDS],
          ["Max price at these inputs", money(mx), "binding ratio decides"],
        ]);
        const rates = [3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5];
        chartT("TDS at the qualifying rate, by contract rate");
        Charts.bar($("#chart"), {
          labels: rates.map((x) => x + "%"),
          values: rates.map((x) => C.stressTest({ ...v, rate: x }).tds),
          colors: rates.map((x) => (C.stressTest({ ...v, rate: x }).passTDS ? "#1b6b3a" : "#b3261e")),
          refLine: 44,
          fmt: (x) => x.toFixed(0) + "%",
        });
        notes(
          `Payment at your contract rate is ${money(r.contractPmt)} a month, but lenders test you at ${pct(r.qr)}, which is ${money(r.qualPmt)}. Loan-to-value is ${pct(r.ltv)}. Half of condo fees count toward GDS. The dashed line marks the 44% TDS limit.`,
        );
      },
    },
    renewal: {
      name: "Renewal shock",
      fields: [
        ["balance", "Original balance", 520000, 5000],
        ["origRate", "Original rate %", 1.99, 0.05],
        ["amortLeft", "Original amortization (yrs)", 25, 1],
        ["term", "Term (yrs)", 5, 1],
        ["newRate", "Renewal rate %", 4.29, 0.05],
      ],
      run(v) {
        const r = C.renewalShock(v);
        kpis([
          ["Payment before", money(r.oldPmt), "per month"],
          ["Payment at renewal", money(r.newPmt), "same remaining amortization"],
          ["Change", (r.change >= 0 ? "+" : "") + money(r.change), pct(r.changePct), r.change <= 0],
          [
            "Years to extend to hold payment",
            r.yearsToExtend == null ? "over 10" : r.yearsToExtend,
            "if lender allows",
          ],
        ]);
        const rates = [];
        for (let x = 1.5; x <= 6.01; x += 0.5) rates.push(+x.toFixed(1));
        chartT("Payment change at renewal, by renewal rate");
        Charts.bar($("#chart"), {
          labels: rates.map((x) => x + "%"),
          values: rates.map((x) => C.renewalShock({ ...v, newRate: x }).changePct),
          colors: rates.map((x) => (C.renewalShock({ ...v, newRate: x }).changePct > 15 ? "#b3261e" : "#011f5b")),
          fmt: (x) => x.toFixed(0) + "%",
        });
        notes(
          `Balance at renewal is ${money(r.balAtRenewal)}. The Bank of Canada estimated that five-year fixed holders renewing in 2026 face an average payment rise of about 20% (<a href="https://www.bankofcanada.ca/2025/07/staff-analytical-note-2025-21/">Staff Analytical Note 2025-21</a>). Bars in red are rises above 15%.`,
        );
      },
    },
    rvb: {
      name: "Rent vs buy",
      fields: [
        ["price", "Home price", 700000, 10000],
        ["down", "Down payment", 140000, 5000],
        ["rate", "Mortgage rate %", 4.29, 0.05],
        ["amort", "Amortization (yrs)", 25, 1],
        ["years", "Horizon (yrs)", 10, 1],
        ["rent", "Rent / mo", 2900, 50],
        ["rentGrowth", "Rent growth %/yr", 3, 0.25],
        ["appreciation", "Home price growth %/yr", 2.5, 0.25],
        ["investReturn", "Investment return %/yr", 5, 0.25],
        ["taxPct", "Property tax % of value", 0.7, 0.05],
        ["maintPct", "Maintenance % of value", 1, 0.1],
        ["closingPct", "Closing costs % (buy)", 1.5, 0.1],
        ["sellPct", "Selling costs % (sell)", 5, 0.25],
      ],
      run(v) {
        const r = C.rentVsBuy(v),
          last = r[r.length - 1],
          d = last.buyNW - last.rentNW;
        kpis([
          ["Net worth if you buy", money(last.buyNW), "after selling costs"],
          ["Net worth if you rent", money(last.rentNW), "down payment invested"],
          ["Difference", money(Math.abs(d)), d >= 0 ? "buying ahead" : "renting ahead", d >= 0],
        ]);
        chartT("Net worth over time");
        Charts.line($("#chart"), {
          xLabels: r.map((x) => "Y" + x.y),
          series: [
            { name: "Buy", color: "#011f5b", data: r.map((x) => x.buyNW), fill: 1 },
            { name: "Rent and invest", color: "#990000", data: r.map((x) => x.rentNW) },
          ],
        });
        notes(
          "The renter invests the down payment, closing costs and any monthly gap between owning and renting costs. If renting costs more in a month, the gap comes out of the renter's portfolio. Tax treatment is ignored.",
        );
      },
    },
    prepay: {
      name: "Prepayment",
      fields: [
        ["balance", "Mortgage balance", 450000, 5000],
        ["rate", "Rate %", 4.29, 0.05],
        ["amort", "Amortization (yrs)", 25, 1],
        ["extra", "Extra each month", 300, 25],
        ["lump", "Lump sum each year", 5000, 500],
      ],
      run(v) {
        const r = C.prepay(v);
        kpis([
          ["Regular payment", money(r.pmt), "per month"],
          ["Interest saved", money(r.interestSaved), "over the life", true],
          ["Time saved", (r.monthsSaved / 12).toFixed(1) + " yrs", r.months + " payments instead of " + r.baseMonths],
        ]);
        const i = C.caMonthly(v.rate),
          base = C.schedule(v.balance, i, r.pmt, v.amort * 12);
        let b = v.balance;
        const fast = [];
        for (let m = 1; m <= base.length; m++) {
          if (b > 0) {
            b = b * (1 + i) - (r.pmt + v.extra);
            if (m % 12 === 0 && b > 0) b -= Math.min(b, v.lump);
          }
          fast.push(Math.max(0, b));
        }
        const yr = base.filter((x) => x.m % 12 === 0);
        chartT("Balance remaining");
        Charts.line($("#chart"), {
          xLabels: yr.map((x) => "Y" + x.m / 12),
          series: [
            { name: "Regular", color: "#4a5570", data: yr.map((x) => x.bal) },
            { name: "With prepayments", color: "#990000", data: yr.map((x) => fast[x.m - 1]), fill: 1 },
          ],
        });
        notes(
          "Most lenders cap prepayments each year, often between 10% and 20% of the original balance. Check your own mortgage terms before planning on a number.",
        );
      },
    },
    penalty: {
      name: "Penalty / IRD",
      fields: [
        ["balance", "Balance", 420000, 5000],
        ["contractRate", "Your contract rate %", 5.19, 0.05],
        ["comparisonRate", "Lender comparison rate %", 4.09, 0.05],
        ["monthsLeft", "Months left in term", 30, 1],
      ],
      run(v) {
        const r = C.penalty(v);
        kpis([
          ["Three months interest", money(r.threeMonths), "typical variable penalty"],
          ["Interest rate differential", money(r.ird), "IRD"],
          ["Likely fixed-rate penalty", money(r.fixed), "higher of the two", false],
        ]);
        const ms = [6, 12, 18, 24, 30, 36, 42, 48, 54, 60];
        chartT("Fixed-rate penalty by months left in term");
        Charts.bar($("#chart"), {
          labels: ms.map((x) => x + "m"),
          values: ms.map((x) => C.penalty({ ...v, monthsLeft: x }).fixed),
          colors: ms.map((x) => {
            const q = C.penalty({ ...v, monthsLeft: x });
            return q.ird > q.threeMonths ? "#b3261e" : "#011f5b";
          }),
        });
        notes(
          "Red bars mean the IRD is larger than three months' interest. Lenders differ on which comparison rate they use, and some apply posted rates minus your original discount, which can raise the IRD a lot. Ask for the lender's written calculation.",
        );
      },
    },
    cvu: {
      name: "Canada vs US",
      fields: [
        ["loan", "Loan amount", 500000, 5000],
        ["caRate", "Canada rate % (5-yr fixed)", 4.29, 0.05],
        ["usRate", "US rate % (30-yr fixed)", 6.3, 0.05],
      ],
      run(v) {
        const r = C.canadaVsUS(v);
        kpis([
          ["Canada payment", money(r.caPmt), "25-yr amortization, semi-annual"],
          ["US payment", money(r.usPmt), "30-yr fixed, monthly"],
          ["Canada balance after 5 yrs", money(r.caBal5), "renews at a new rate"],
          ["US balance after 5 yrs", money(r.usBal5), "rate locked 30 yrs"],
        ]);
        chartT("First five years: interest vs principal");
        Charts.bar($("#chart"), {
          labels: ["CA interest", "CA principal", "US interest", "US principal"],
          values: [r.caInt5, v.loan - r.caBal5, r.usInt5, v.loan - r.usBal5],
          colors: ["#b3261e", "#1b6b3a", "#b3261e", "#1b6b3a"],
        });
        notes(
          "The big structural gap: most Canadian mortgages renew every few years, so the rate risk sits with the borrower. A US 30-year fixed locks the rate for the full loan and can usually be refinanced without a large penalty. Enter your own rates; the defaults are examples.",
        );
      },
    },
  };
  let cur = "stress",
    state = {};
  function chartT(t) {
    $("#chartTitle").textContent = t;
  }
  function kpis(a) {
    $("#kpis").innerHTML = a
      .map(
        ([l, v, s, ok]) =>
          `<div class="kpi"><div class="l">${l}</div><div class="v ${ok === true ? "good" : ok === false ? "bad" : ""}">${v}</div><div class="s">${s || ""}</div></div>`,
      )
      .join("");
  }
  function notes(h) {
    $("#notes").innerHTML = "<h2>What this means</h2><p>" + h + "</p>";
  }
  function vals() {
    const m = M[cur],
      o = {};
    m.fields.forEach(([k, , d]) => {
      const e = document.getElementById("f_" + k);
      o[k] = e ? +e.value : d;
    });
    return o;
  }
  function renderInputs() {
    const m = M[cur],
      s = state[cur] || {};
    $("#inTitle").textContent = m.name + " inputs";
    $("#inputs").innerHTML = m.fields
      .map(
        ([k, l, d, st]) =>
          `<label for="f_${k}">${l}</label><input type="number" id="f_${k}" step="${st}" value="${s[k] ?? d}">`,
      )
      .join("");
    $("#inputs")
      .querySelectorAll("input")
      .forEach((e) => e.addEventListener("input", update));
  }
  function update() {
    state[cur] = vals();
    M[cur].run(state[cur]);
    history.replaceState(null, "", "#" + encode());
  }
  function encode() {
    const p = new URLSearchParams({ t: cur });
    Object.entries(state[cur] || {}).forEach(([k, v]) => p.set(k, v));
    return p.toString();
  }
  function decode() {
    const p = new URLSearchParams(location.hash.slice(1));
    const t = p.get("t");
    if (t && M[t]) {
      cur = t;
      const o = {};
      M[t].fields.forEach(([k]) => {
        if (p.has(k)) o[k] = +p.get(k);
      });
      state[t] = o;
    }
  }
  function tabs() {
    $("#tabs").innerHTML = Object.entries(M)
      .map(([k, m]) => `<button role="tab" aria-selected="${k === cur}" data-k="${k}">${m.name}</button>`)
      .join("");
    $("#tabs")
      .querySelectorAll("button")
      .forEach(
        (b) =>
          (b.onclick = () => {
            cur = b.dataset.k;
            tabs();
            renderInputs();
            update();
          }),
      );
  }
  $("#share").onclick = () => {
    navigator.clipboard && navigator.clipboard.writeText(location.href);
    $("#share").textContent = "Link copied";
    setTimeout(() => ($("#share").textContent = "Copy share link"), 1500);
  };
  $("#pdf").onclick = () => window.print();
  decode();
  tabs();
  renderInputs();
  update();
})();
