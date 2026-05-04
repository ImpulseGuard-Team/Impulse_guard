const modal    = document.getElementById('modal');
const addBtn   = document.getElementById('addBtn');
const closeBtn = document.querySelector('.close-btn');
const form     = document.getElementById('spendingForm');
const list     = document.getElementById('list');

const modalTitle     = document.getElementById('modalTitle');
const spendingIdInput = document.getElementById('spendingId');
const titleInput     = document.getElementById('title');
const categoryInput  = document.getElementById('category');
const amountInput    = document.getElementById('amount');

let transactions = [];
let currentBudget = 5000; // fallback, overwritten by API

/* ── LOAD ── */
async function loadSpendings() {
  const [todayRes, allRes] = await Promise.all([
    fetch('/api/spending'),
    fetch('/api/spending/all')
  ]);
  const todayData = await todayRes.json();
  const allData   = await allRes.json();

  if (todayData.success) {
    transactions  = todayData.spendings;
    currentBudget = todayData.budget || 5000;
    const bv = document.getElementById('budgetValue');
    if (bv) bv.innerText = currentBudget;
  }

  // Monthly total: sum all spending in the current calendar month
  let monthTotal = 0;
  if (allData.success) {
    const now = new Date();
    allData.spendings.forEach(t => {
      const d = new Date(t.date);
      if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) {
        monthTotal += t.amount;
      }
    });
  }

  updateUI(monthTotal);
}

loadSpendings();

/* ── MODAL OPEN / CLOSE ── */
addBtn.onclick = () => {
  modalTitle.innerText  = 'Add Spending';
  form.reset();
  spendingIdInput.value = '';
  modal.style.display   = 'block';
};

closeBtn.onclick = () => (modal.style.display = 'none');
window.onclick   = (e) => { if (e.target === modal) modal.style.display = 'none'; };

/* ── SUBMIT ── */
form.onsubmit = async (e) => {
  e.preventDefault();
  const id       = spendingIdInput.value;
  const title    = titleInput.value.trim();
  const amount   = parseFloat(amountInput.value);
  const category = categoryInput.value;

  if (!title || isNaN(amount) || amount <= 0) return;

  const url    = id ? `/api/spending/${id}` : '/api/spending';
  const method = id ? 'PUT' : 'POST';

  const res  = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, amount, category })
  });
  const data = await res.json();
  if (data.success) {
    modal.style.display = 'none';
    loadSpendings();
  }
};

/* ── EDIT ── */
window.editSp = (id, title, amount, category) => {
  modalTitle.innerText  = 'Edit Spending';
  spendingIdInput.value = id;
  titleInput.value      = title;
  amountInput.value     = amount;
  categoryInput.value   = category || 'Other';
  modal.style.display   = 'block';
};

/* ── DELETE ── */
window.deleteSp = async (id) => {
  const res  = await fetch(`/api/spending/${id}`, { method: 'DELETE' });
  const data = await res.json();
  if (data.success) {
    loadSpendings();
  } else {
    alert('Delete failed: ' + (data.error || 'Unknown error'));
  }
};

/* ── EDIT BUDGET ── */
window.editBudget = async () => {
  const newBudget = prompt('Enter your monthly budget (₹):', currentBudget);
  if (newBudget === null) return; // cancelled
  const parsed = parseFloat(newBudget);
  if (isNaN(parsed) || parsed <= 0) {
    alert('Please enter a valid positive number.');
    return;
  }

  const res  = await fetch('/api/spending/budget', {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ budget: parsed })
  });
  const data = await res.json();
  if (data.success) {
    currentBudget = parsed;
    document.getElementById('budgetValue').innerText = parsed;
    updateUI();
  }
};

/* ── UPDATE UI ── */
function updateUI(monthTotal) {
  // monthTotal defaults to today's sum if not supplied (backward compat)
  if (monthTotal === undefined) {
    monthTotal = transactions.reduce((s, t) => s + t.amount, 0);
  }

  list.innerHTML = '';
  let totalToday = 0;

  if (transactions.length === 0) {
    list.innerHTML = "<p style='color:#475569; text-align:center; padding:20px 0;'>No spending recorded today. Add one!</p>";
  } else {
    transactions.forEach(t => {
      totalToday += t.amount;

      // Status based on amount relative to daily budget
      const dailyLimit = currentBudget / 30;
      let statusText, statusClass;
      if (t.amount > dailyLimit * 0.5)       { statusText = 'IMPULSIVE'; statusClass = 'status-impulsive'; }
      else if (t.amount > dailyLimit * 0.2)  { statusText = 'RISKY';     statusClass = 'status-risky'; }
      else                                    { statusText = 'SAFE';      statusClass = 'status-safe'; }

      list.innerHTML += `
        <div class="transaction-item">
          <div>
            <h4 style="margin:0;">${t.title}</h4>
            <p style="margin:4px 0 0; color:#94a3b8; font-size:12px;">${t.category || 'Other'}</p>
          </div>
          <div style="text-align:right;">
            <p style="margin:0 0 4px; font-weight:bold;">₹${t.amount.toFixed(2)}</p>
            <span class="${statusClass}">${statusText}</span>
            <div style="margin-top:8px;">
              <button class="btn-secondary" style="font-size:10px; padding:4px 8px; margin-right:4px;"
                onclick="editSp('${t._id}', '${t.title}', ${t.amount}, '${t.category || 'Other'}')">Edit</button>
              <button style="background:rgba(248,113,113,0.1); color:#f87171; border:none; border-radius:4px; font-size:10px; padding:4px 8px; cursor:pointer;"
                onclick="deleteSp('${t._id}')">Delete</button>
            </div>
          </div>
        </div>`;
    });
  }

  /* ── GUARD SCORE (Monthly Budget) ── */
  // Score = what % of monthly budget is still remaining, 0-100
  const remaining     = currentBudget - monthTotal;
  const score         = Math.max(0, Math.min(100, Math.round((remaining / currentBudget) * 100)));

  document.getElementById('score').innerText   = score;
  document.getElementById('blocked').innerText = transactions.length;

  let msg, barColor;
  if (score >= 70)      { msg = 'Excellent control. Monthly budget well managed.';   barColor = '#34d399'; }
  else if (score >= 40) { msg = 'Moderate risk. Over 60% of monthly budget spent.';  barColor = '#fbbf24'; }
  else                  { msg = 'High risk! Monthly budget is nearly exhausted.';     barColor = '#f87171'; }

  document.getElementById('msg').innerText     = msg;
  document.getElementById('bar').style.width   = score + '%';
  document.getElementById('bar').style.background = barColor;

  /* ── REMAINING AMOUNT (of monthly budget) ── */
  const savedEl    = document.getElementById('saved');
  const savedLabel = document.getElementById('savedLabel');

  if (remaining >= 0) {
    savedEl.innerText   = '₹' + remaining.toFixed(2);
    savedEl.style.color = '#34d399';
    if (savedLabel) savedLabel.innerText = 'Remaining Amount';
  } else {
    savedEl.innerText   = '−₹' + Math.abs(remaining).toFixed(2);
    savedEl.style.color = '#f87171';
    if (savedLabel) savedLabel.innerText = 'Over Budget';
  }

  drawChart();
}

/* ── CHART ── */
function drawChart() {
  const c = document.getElementById('chart');
  if (!c) return;
  const W   = c.width;
  const H   = c.height;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  const amounts = transactions.map(t => t.amount);
  if (amounts.length === 0) {
    ctx.fillStyle = '#475569';
    ctx.font      = '13px Inter, sans-serif';
    ctx.fillText('Add transactions to see chart', W / 2 - 110, H / 2);
    return;
  }

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

  // Daily budget line
  const dailyBudget = currentBudget / 30;
  const budgetY = pad + (1 - Math.min(dailyBudget, maxVal) / maxVal) * (H - pad * 2);
  ctx.strokeStyle    = 'rgba(251,191,36,0.4)';
  ctx.lineWidth      = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(pad, budgetY);
  ctx.lineTo(W - pad, budgetY);
  ctx.stroke();
  ctx.setLineDash([]);

  // Gradient fill
  const grad = ctx.createLinearGradient(0, pad, 0, H);
  grad.addColorStop(0, 'rgba(129,140,248,0.3)');
  grad.addColorStop(1, 'rgba(129,140,248,0)');
  ctx.beginPath();
  pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.lineTo(pts[pts.length - 1].x, H);
  ctx.lineTo(pts[0].x, H);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.strokeStyle = '#818cf8';
  ctx.lineWidth   = 2.5;
  ctx.lineJoin    = 'round';
  ctx.beginPath();
  pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.stroke();

  // Dots
  pts.forEach((p, i) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, i === pts.length - 1 ? 5 : 3, 0, Math.PI * 2);
    ctx.fillStyle = i === pts.length - 1 ? '#34d399' : '#a5b4fc';
    ctx.fill();
  });
}
