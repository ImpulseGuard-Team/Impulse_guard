async function loadInsightData() {
  const res = await fetch('/api/spending/all');
  const data = await res.json();
  if (!data.success) return;

  const transactions = data.spendings;

  renderStats(transactions);
  renderCategoryPulse(transactions);
  renderChart(transactions);
}

/* ── STATS ── */
function renderStats(transactions) {
  const totalEl = document.getElementById('totalSpent');
  const maxEl   = document.getElementById('maxSpent');
  const avgEl   = document.getElementById('avgSpent');

  if (transactions.length === 0) {
    totalEl.innerText = '—';
    maxEl.innerText   = '—';
    avgEl.innerText   = '—';
    return;
  }

  const total = transactions.reduce((s, t) => s + t.amount, 0);
  const max   = transactions.reduce((m, t) => Math.max(m, t.amount), 0);
  const avg   = total / transactions.length;

  totalEl.innerText = '₹' + total.toFixed(2);
  maxEl.innerText   = '₹' + max.toFixed(2);
  avgEl.innerText   = '₹' + avg.toFixed(2);
}

/* ── CATEGORY PULSE ── */
function renderCategoryPulse(transactions) {
  const catDiv = document.getElementById('categoryList');
  catDiv.innerHTML = '';

  if (transactions.length === 0) {
    catDiv.innerHTML = '<p style="color:#475569; font-size:13px;">No data yet.</p>';
    return;
  }

  const cats = {};
  const total = transactions.reduce((s, t) => {
    const c = t.category || 'Other';
    cats[c] = (cats[c] || 0) + t.amount;
    return s + t.amount;
  }, 0);

  const sorted = Object.entries(cats).sort((a, b) => b[1] - a[1]);
  const colors = ['#818cf8', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#38bdf8'];

  sorted.forEach(([cat, amount], i) => {
    const pct = total ? ((amount / total) * 100).toFixed(1) : 0;
    const color = colors[i % colors.length];

    catDiv.innerHTML += `
      <div style="margin-bottom:16px;">
        <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
          <span style="font-size:13px; color:#cbd5e1;">${cat}</span>
          <span style="font-size:12px; color:#64748b;">₹${amount.toFixed(0)} (${pct}%)</span>
        </div>
        <div style="height:6px; background:rgba(15,23,42,0.8); border-radius:8px; overflow:hidden;">
          <div style="height:100%; width:${pct}%; background:${color}; border-radius:8px; transition: width 1s ease-out;"></div>
        </div>
      </div>
    `;
  });
}

/* ── CHART ── */
function renderChart(transactions) {
  if (transactions.length === 0) {
    const c = document.getElementById('insightChart');
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#475569';
    ctx.font = '14px Inter';
    ctx.fillText('No transactions yet', c.width / 2 - 70, c.height / 2);
    return;
  }

  // Group by date
  const byDate = {};
  transactions.forEach(t => {
    const d = new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    byDate[d] = (byDate[d] || 0) + t.amount;
  });

  // Sort by date (chronological)
  const sortedDates = Object.keys(byDate).slice(-7); // last 7 unique days
  const amounts = sortedDates.map(d => byDate[d]);

  // Trend label
  if (amounts.length >= 2) {
    const diff = amounts[amounts.length - 1] - amounts[amounts.length - 2];
    const pct  = Math.abs(((diff / amounts[amounts.length - 2]) * 100)).toFixed(1);
    const el   = document.getElementById('trendLabel');
    if (diff <= 0) {
      el.style.color = '#34d399';
      el.innerText = `↘ ${pct}% from previous`;
    } else {
      el.style.color = '#f87171';
      el.innerText = `↗ ${pct}% from previous`;
    }
  }

  // Chart labels
  const labelsDiv = document.getElementById('chartLabels');
  labelsDiv.innerHTML = '';
  sortedDates.forEach(d => {
    const span = document.createElement('span');
    span.innerText = d;
    labelsDiv.appendChild(span);
  });

  // Draw canvas
  const c   = document.getElementById('insightChart');
  const W   = c.width;
  const H   = c.height;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  const maxVal = Math.max(...amounts, 1);
  const pad    = 20;
  const step   = (W - pad * 2) / Math.max(amounts.length - 1, 1);

  const pts = amounts.map((v, i) => ({
    x: pad + i * step,
    y: pad + (1 - v / maxVal) * (H - pad * 2)
  }));

  // Grid lines
  ctx.lineWidth = 1;
  [0.25, 0.5, 0.75].forEach(frac => {
    const y = pad + frac * (H - pad * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.beginPath();
    ctx.moveTo(pad, y);
    ctx.lineTo(W - pad, y);
    ctx.stroke();
  });

  // Gradient fill
  const grad = ctx.createLinearGradient(0, pad, 0, H);
  grad.addColorStop(0, 'rgba(129,140,248,0.3)');
  grad.addColorStop(1, 'rgba(129,140,248,0)');
  ctx.beginPath();
  pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.lineTo(pts[pts.length - 1].x, H);
  ctx.lineTo(pts[0].x, H);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.strokeStyle = '#818cf8';
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.stroke();

  // Dots
  pts.forEach((p, i) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, i === pts.length - 1 ? 5 : 3, 0, Math.PI * 2);
    ctx.fillStyle = i === pts.length - 1 ? '#34d399' : '#a5b4fc';
    ctx.fill();
  });
}

loadInsightData();
