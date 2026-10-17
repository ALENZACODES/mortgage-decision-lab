// Lightweight SVG charts: line, bar, tornado.
(function (g) {
  const NS = "http://www.w3.org/2000/svg";
  function el(t, a, txt) {
    const e = document.createElementNS(NS, t);
    for (const k in a) e.setAttribute(k, a[k]);
    if (txt != null) e.textContent = txt;
    return e;
  }
  function nice(v) {
    return Math.abs(v) >= 1e6
      ? (v / 1e6).toFixed(1) + "M"
      : Math.abs(v) >= 1e3
        ? (v / 1e3).toFixed(0) + "k"
        : (+v.toFixed(2)).toString();
  }
  function line(node, { series, xLabels, w = 760, h = 300, fmt = nice, title }) {
    node.innerHTML = "";
    const s = el("svg", { viewBox: `0 0 ${w} ${h}`, role: "img", "aria-label": title || "chart" });
    const p = { l: 56, r: 16, t: 14, b: 30 };
    const all = series.flatMap((x) => x.data);
    let mn = Math.min(0, ...all),
      mx = Math.max(...all);
    if (mx === mn) mx = mn + 1;
    const X = (i) => p.l + ((w - p.l - p.r) * i) / Math.max(1, xLabels.length - 1),
      Y = (v) => h - p.b - ((h - p.t - p.b) * (v - mn)) / (mx - mn);
    for (let k = 0; k <= 4; k++) {
      const v = mn + ((mx - mn) * k) / 4;
      s.append(el("line", { x1: p.l, x2: w - p.r, y1: Y(v), y2: Y(v), stroke: "#24304f" }));
      s.append(el("text", { x: p.l - 6, y: Y(v) + 4, "text-anchor": "end", fill: "#9aa7c2", "font-size": 11 }, fmt(v)));
    }
    const step = Math.ceil(xLabels.length / 10);
    xLabels.forEach((l, i) => {
      if (i % step === 0 || i === xLabels.length - 1)
        s.append(el("text", { x: X(i), y: h - 10, "text-anchor": "middle", fill: "#9aa7c2", "font-size": 11 }, l));
    });
    series.forEach((se) => {
      const d = se.data.map((v, i) => (i ? "L" : "M") + X(i).toFixed(1) + "," + Y(v).toFixed(1)).join("");
      if (se.fill)
        s.append(
          el("path", {
            d: d + `L${X(se.data.length - 1)},${Y(Math.max(mn, 0))}L${X(0)},${Y(Math.max(mn, 0))}Z`,
            fill: se.color,
            opacity: 0.12,
          }),
        );
      s.append(
        el("path", { d, fill: "none", stroke: se.color, "stroke-width": 2.5, "stroke-dasharray": se.dash || "" }),
      );
    });
    node.append(s);
    node.append(legend(series));
  }
  function bar(node, { labels, values, colors, w = 760, h = 300, fmt = nice, title, refLine }) {
    node.innerHTML = "";
    const s = el("svg", { viewBox: `0 0 ${w} ${h}`, role: "img", "aria-label": title || "chart" });
    const p = { l: 56, r: 16, t: 18, b: 42 };
    let mn = Math.min(0, ...values),
      mx = Math.max(0, ...values, refLine || 0);
    if (mx === mn) mx = 1;
    const Y = (v) => h - p.b - ((h - p.t - p.b) * (v - mn)) / (mx - mn);
    const bw = (w - p.l - p.r) / labels.length;
    for (let k = 0; k <= 4; k++) {
      const v = mn + ((mx - mn) * k) / 4;
      s.append(el("line", { x1: p.l, x2: w - p.r, y1: Y(v), y2: Y(v), stroke: "#24304f" }));
      s.append(el("text", { x: p.l - 6, y: Y(v) + 4, "text-anchor": "end", fill: "#9aa7c2", "font-size": 11 }, fmt(v)));
    }
    values.forEach((v, i) => {
      const x = p.l + i * bw + bw * 0.18,
        y = Math.min(Y(v), Y(0));
      s.append(
        el("rect", {
          x,
          y,
          width: bw * 0.64,
          height: Math.abs(Y(v) - Y(0)),
          rx: 5,
          fill: (colors && colors[i]) || "#4f8cff",
        }),
      );
      s.append(
        el("text", { x: x + bw * 0.32, y: y - 5, "text-anchor": "middle", fill: "#e8edf7", "font-size": 11 }, fmt(v)),
      );
      s.append(
        el(
          "text",
          { x: x + bw * 0.32, y: h - 24, "text-anchor": "middle", fill: "#9aa7c2", "font-size": 11 },
          labels[i],
        ),
      );
    });
    if (refLine != null)
      s.append(
        el("line", {
          x1: p.l,
          x2: w - p.r,
          y1: Y(refLine),
          y2: Y(refLine),
          stroke: "#f5b041",
          "stroke-dasharray": "5 4",
        }),
      );
    node.append(s);
  }
  function tornado(node, { rows, base, w = 760, h, fmt = nice, title }) {
    h = h || 40 + rows.length * 34;
    node.innerHTML = "";
    const s = el("svg", { viewBox: `0 0 ${w} ${h}`, role: "img", "aria-label": title || "tornado chart" });
    const p = { l: 170, r: 60, t: 16 };
    const vals = rows.flatMap((r) => [r.low, r.high, base]);
    const mn = Math.min(...vals),
      mx = Math.max(...vals);
    const X = (v) => p.l + ((w - p.l - p.r) * (v - mn)) / (mx - mn || 1);
    rows.forEach((r, i) => {
      const y = p.t + i * 34;
      s.append(el("text", { x: p.l - 10, y: y + 17, "text-anchor": "end", fill: "#cfd8ee", "font-size": 12 }, r.label));
      const a = Math.min(r.low, base),
        b = Math.max(r.low, base);
      s.append(el("rect", { x: X(a), y: y + 4, width: Math.max(1, X(b) - X(a)), height: 20, fill: "#ef5b6b", rx: 4 }));
      const c = Math.min(r.high, base),
        d = Math.max(r.high, base);
      s.append(el("rect", { x: X(c), y: y + 4, width: Math.max(1, X(d) - X(c)), height: 20, fill: "#2ecc8f", rx: 4 }));
      s.append(
        el(
          "text",
          { x: X(Math.max(r.low, r.high, base)) + 6, y: y + 18, fill: "#9aa7c2", "font-size": 11 },
          fmt(Math.min(r.low, r.high)) + " to " + fmt(Math.max(r.low, r.high)),
        ),
      );
    });
    s.append(el("line", { x1: X(base), x2: X(base), y1: 4, y2: h - 6, stroke: "#e8edf7", "stroke-dasharray": "4 3" }));
    node.append(s);
  }
  function legend(series) {
    const d = document.createElement("div");
    d.className = "legend";
    series.forEach((s) => {
      const sp = document.createElement("span");
      sp.innerHTML = `<i style="background:${s.color}"></i>`;
      sp.append(s.name);
      d.append(sp);
    });
    return d;
  }
  g.Charts = { line, bar, tornado };
})(window);
