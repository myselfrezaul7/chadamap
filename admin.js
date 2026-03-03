// ===== THEME =====
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;
function setTheme(t) { html.setAttribute('data-theme', t); themeToggle.textContent = t === 'dark' ? '🌙' : '☀️'; localStorage.setItem('chandamap-theme', t); }
setTheme(localStorage.getItem('chandamap-theme') || 'dark');
themeToggle.addEventListener('click', () => setTheme(html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'));

// ===== AUTH =====
const overlay = document.getElementById('adminAuthOverlay');
const dashLayout = document.getElementById('dashboardLayout');
const loginBtn = document.getElementById('googleLoginBtn');
const logoutBtn = document.getElementById('adminLogoutBtn');
const authError = document.getElementById('adminAuthError');
let currentUser = null, unsubReports = null;

auth.onAuthStateChanged(user => {
  if (user && isAdmin(user)) {
    currentUser = user;
    overlay.classList.add('authenticated');
    dashLayout.classList.remove('locked');
    document.getElementById('adminAvatar').src = user.photoURL || '';
    document.getElementById('adminName').textContent = user.displayName || user.email;
    loadReports();
  } else {
    currentUser = null;
    overlay.classList.remove('authenticated');
    dashLayout.classList.add('locked');
    if (unsubReports) { unsubReports(); unsubReports = null; }
    if (user && !isAdmin(user)) {
      auth.signOut();
      authError.textContent = '❌ এই অ্যাকাউন্টের অ্যাক্সেস নেই।';
      authError.style.display = 'block';
    }
  }
});

loginBtn.addEventListener('click', async () => {
  authError.style.display = 'none';
  try { await auth.signInWithPopup(googleProvider); }
  catch (err) { authError.textContent = '❌ লগইন ব্যর্থ: ' + err.message; authError.style.display = 'block'; }
});
logoutBtn.addEventListener('click', () => { auth.signOut(); showToast('🚪 লগআউট সফল!'); });

// ===== FIRESTORE =====
let allReports = [], currentFilter = 'all', currentSearch = '', currentDateFilter = 'all';
let selectedIds = new Set();
let reportsChart = null, trendChart = null;
function loadReports() {
  if (unsubReports) unsubReports();
  unsubReports = db.collection('reports').orderBy('createdAt', 'desc').onSnapshot(snap => {
    allReports = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    updateKPIs(); renderReports();
  });
}

function updateKPIs() {
  const t = allReports.length, p = allReports.filter(r => r.status === 'pending').length;
  const a = allReports.filter(r => r.status === 'approved').length, j = allReports.filter(r => r.status === 'rejected').length;

  const now = new Date().getTime() / 1000;
  const todayReports = allReports.filter(r => r.createdAt && (now - r.createdAt.seconds) <= 86400);

  const convertBnToEn = str => String(str).replace(/[০-৯]/g, d => '০১২৩৪৫৬৭৮৯'.indexOf(d));
  const highestRateToday = todayReports.reduce((max, r) => {
    let val = 0;
    if (typeof r.currentRate === 'string') {
      const matches = String(r.currentRate).match(/[০-৯\d]+/g);
      if (matches) val = Math.max(...matches.map(m => parseInt(convertBnToEn(m)) || 0));
    } else {
      val = r.currentRate || 0;
    }
    return Math.max(max, val);
  }, 0);

  document.getElementById('kpiTotal').textContent = t.toLocaleString('bn-BD');
  document.getElementById('kpiPending').textContent = p.toLocaleString('bn-BD');
  document.getElementById('kpiApproved').textContent = a.toLocaleString('bn-BD');
  document.getElementById('kpiRejected').textContent = j.toLocaleString('bn-BD');

  const totalEl = document.getElementById('kpiToday');
  if (totalEl) totalEl.textContent = todayReports.length.toLocaleString('bn-BD');

  const highestRateEl = document.getElementById('kpiHighestRate');
  if (highestRateEl) highestRateEl.textContent = '৳' + highestRateToday.toLocaleString('bn-BD');

  // Last Updated text
  const lastUpdatedEl = document.getElementById('lastUpdatedText');
  if (lastUpdatedEl) {
    const now = new Date();
    lastUpdatedEl.textContent = `সর্বশেষ আপডেট: ${now.toLocaleString('bn-BD', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
  }

  updateChart(p, a, j);
  updateTrendChart();
}

function updateChart(pending, approved, rejected) {
  const ctx = document.getElementById('reportsChart');
  if (!ctx) return;
  const data = [pending, approved, rejected];

  if (reportsChart) {
    reportsChart.data.datasets[0].data = data;
    reportsChart.update();
  } else {
    reportsChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['পেন্ডিং', 'অ্যাপ্রুভড', 'রিজেক্টেড'],
        datasets: [{
          data: data,
          backgroundColor: ['#ffc107', '#39ff14', '#ff2d2d'],
          borderColor: 'transparent',
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            titleFont: { family: 'Inter' },
            bodyFont: { family: 'Inter' }
          }
        },
        cutout: '75%'
      }
    });
  }
}

function updateTrendChart() {
  const ctx = document.getElementById('trendChart');
  if (!ctx) return;

  // Get last 7 days data
  const days = [];
  const counts = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const start = d.getTime() / 1000;
    const end = start + 86400;

    // Count reports for this day
    const count = allReports.filter(r => {
      if (!r.createdAt) return false;
      const t = r.createdAt.seconds;
      return t >= start && t < end;
    }).length;

    days.push(d.toLocaleDateString('bn-BD', { weekday: 'short' }));
    counts.push(count);
  }

  if (trendChart) {
    trendChart.data.labels = days;
    trendChart.data.datasets[0].data = counts;
    trendChart.update();
  } else {
    trendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: days,
        datasets: [{
          data: counts,
          borderColor: '#4a9b9b',
          backgroundColor: 'rgba(74, 155, 155, 0.1)',
          borderWidth: 2,
          pointBackgroundColor: '#4a9b9b',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            titleFont: { family: 'Inter' },
            bodyFont: { family: 'Inter' }
          }
        },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 } },
          x: { grid: { display: false } }
        }
      }
    });
  }
}

function getFilteredReports() {
  let filtered = currentFilter === 'all' ? allReports : allReports.filter(r => r.status === currentFilter);

  // Date Filter
  if (currentDateFilter !== 'all') {
    const now = new Date().getTime() / 1000;
    filtered = filtered.filter(r => {
      if (!r.createdAt) return false;
      const t = r.createdAt.seconds;
      if (currentDateFilter === 'today') return (now - t) <= 86400;
      if (currentDateFilter === '7days') return (now - t) <= 86400 * 7;
      if (currentDateFilter === '30days') return (now - t) <= 86400 * 30;
      return true;
    });
  }

  // Search Filter
  if (currentSearch) {
    filtered = filtered.filter(r =>
      (r.location || '').toLowerCase().includes(currentSearch) ||
      (r.description || '').toLowerCase().includes(currentSearch) ||
      (r.collectorType || '').toLowerCase().includes(currentSearch)
    );
  }
  return filtered;
}

function toggleCardSelection(e, id) {
  // Prevent taking action if clicking on buttons
  if (e.target.tagName === 'BUTTON') return;

  if (selectedIds.has(id)) {
    selectedIds.delete(id);
  } else {
    selectedIds.add(id);
  }
  updateBulkUI();
  renderReports();
}

function renderReports() {
  const tbody = document.getElementById('reportsBody');
  const cardList = document.getElementById('reportsList');
  const filtered = getFilteredReports();

  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:40px;color:var(--text-tertiary)">কোনো রিপোর্ট নেই</td></tr>';
    cardList.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-tertiary)">কোনো রিপোর্ট নেই</div>';
    return;
  }

  const moodMap = { green: { i: '🟢', c: 'green', t: 'গ্রিন' }, yellow: { i: '🟡', c: 'yellow', t: 'ইয়েলো' }, red: { i: '🔴', c: 'red', t: 'রেড' } };
  const statusMap = { pending: '⏳ পেন্ডিং', approved: '✅ অ্যাপ্রুভড', rejected: '❌ রিজেক্টেড' };

  let tableHtml = '';
  let cardsHtml = '';

  filtered.forEach(r => {
    const time = r.createdAt ? new Date(r.createdAt.seconds * 1000).toLocaleString('bn-BD', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }) : '—';
    const m = moodMap[r.mood] || moodMap.green;
    const isChecked = selectedIds.has(r.id) ? 'checked' : '';
    const rateDisplay = (typeof r.currentRate === 'string') ? r.currentRate : `৳ ${(r.currentRate || 0).toLocaleString('bn-BD')}`;

    tableHtml += `<tr>
      <td data-label="সিলেক্ট"><input type="checkbox" class="row-checkbox" value="${r.id}" ${isChecked}></td>
      <td data-label="সময়">${time}</td>
      <td data-label="লোকেশন">${r.location || '—'}</td>
      <td data-label="ধরন">${r.collectorType || '—'}</td>
      <td data-label="ডিমান্ড">${rateDisplay}</td>
      <td data-label="বিবরণ" style="max-width:150px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${r.description || '—'}">${r.description || '—'}</td>
      <td data-label="মুড"><span class="mood-badge ${m.c}">${m.i} ${m.t}</span></td>
      <td data-label="স্ট্যাটাস"><span class="status-badge status-${r.status}">${statusMap[r.status] || r.status}</span></td>
      <td data-label="অ্যাকশন" class="table-actions">${r.status === 'pending' ? `<button class="btn-verify" onclick="approveReport('${r.id}')">✅</button><button class="btn-reject" onclick="rejectReport('${r.id}')">❌</button>` : ''}<button class="btn-edit" onclick="openEdit('${r.id}')">✏️</button><button class="btn-delete" onclick="deleteReport('${r.id}')">🗑️</button></td>
    </tr>`;

    cardsHtml += `
    <div class="report-card ${isChecked ? 'selected' : ''}" onclick="toggleCardSelection(event, '${r.id}')">
      <div class="report-card-header">
        <div>
          <div class="report-card-title">📍 ${r.location || 'অজানা এলাকা'}</div>
          <div class="report-card-meta">${r.collectorType || '—'} • ${time}</div>
        </div>
        <span class="report-card-badge ${r.status}">${statusMap[r.status] || r.status}</span>
      </div>
      <div style="font-size: 14px;"><strong>${rateDisplay}</strong> • ${m.i} ${m.t}</div>
      <div style="font-size: 13px; color: var(--text-secondary);">${r.description || '—'}</div>
      ${r.status === 'pending' ? `
      <div class="report-card-actions">
        <button class="report-card-btn-approve" onclick="approveReport('${r.id}', event)">✅ অ্যাপ্রুভ</button>
        <button class="report-card-btn-reject" onclick="rejectReport('${r.id}', event)">❌ রিজেক্ট</button>
      </div>` : ''}
    </div>`;
  });

  tbody.innerHTML = tableHtml;
  cardList.innerHTML = cardsHtml;

  // Attach checkbox listeners
  document.querySelectorAll('.row-checkbox').forEach(cb => {
    cb.addEventListener('change', e => {
      if (e.target.checked) selectedIds.add(e.target.value);
      else selectedIds.delete(e.target.value);
      updateBulkUI();
      // Only re-render if we need to sync cards, wait, updating bulk UI handles it
      // but cards don't use checkboxes, so we re-render to update selected classes
      renderReports();
    });
  });

  // Sync select all checkbox state
  const selectAllCb = document.getElementById('selectAllCheckbox');
  if (selectAllCb) {
    const allCheckedBoxes = document.querySelectorAll('.row-checkbox:checked');
    const allRowBoxes = document.querySelectorAll('.row-checkbox');
    selectAllCb.checked = allRowBoxes.length > 0 && allCheckedBoxes.length === allRowBoxes.length;
  }
}

function updateBulkUI() {
  const bulkBar = document.getElementById('bulkActionBar');
  const countSpan = document.getElementById('selectedCount');

  if (selectedIds.size > 0) {
    bulkBar.style.display = 'flex';
    countSpan.textContent = selectedIds.size.toLocaleString('bn-BD');
  } else {
    bulkBar.style.display = 'none';
  }
}

// Select All Handler
const selectAllCb = document.getElementById('selectAllCheckbox');
if (selectAllCb) {
  selectAllCb.addEventListener('change', e => {
    const isChecked = e.target.checked;
    document.querySelectorAll('.row-checkbox').forEach(cb => {
      cb.checked = isChecked;
      if (isChecked) selectedIds.add(cb.value);
      else selectedIds.delete(cb.value);
    });
    updateBulkUI();
  });
}

// Bulk Actions
document.getElementById('bulkCancelBtn')?.addEventListener('click', () => {
  selectedIds.clear();
  renderReports();
  updateBulkUI();
});

document.getElementById('bulkApproveBtn')?.addEventListener('click', async () => {
  if (!selectedIds.size) return;
  const btn = document.getElementById('bulkApproveBtn');
  btn.disabled = true; btn.textContent = '⏳...';
  try {
    const promises = Array.from(selectedIds).map(id => db.collection('reports').doc(id).update({ status: 'approved' }));
    await Promise.all(promises);
    showToast(`${selectedIds.size} টি রিপোর্ট অ্যাপ্রুভ করা হয়েছে!`);
    selectedIds.clear();
    updateBulkUI();
  } catch (err) {
    showToast('❌ bulk action failed', true);
  }
  btn.disabled = false; btn.textContent = '✅ অ্যাপ্রুভ';
});

document.getElementById('bulkRejectBtn')?.addEventListener('click', async () => {
  if (!selectedIds.size) return;
  const btn = document.getElementById('bulkRejectBtn');
  btn.disabled = true; btn.textContent = '⏳...';
  try {
    const promises = Array.from(selectedIds).map(id => db.collection('reports').doc(id).update({ status: 'rejected' }));
    await Promise.all(promises);
    showToast(`${selectedIds.size} টি রিপোর্ট রিজেক্ট করা হয়েছে!`);
    selectedIds.clear();
    updateBulkUI();
  } catch (err) {
    showToast('❌ bulk action failed', true);
  }
  btn.disabled = false; btn.textContent = '❌ রিজেক্ট';
});

document.querySelectorAll('.filter-tab').forEach(tab => {
  tab.addEventListener('click', function () {
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    this.classList.add('active'); currentFilter = this.dataset.filter;
    selectedIds.clear(); updateBulkUI();
    renderReports();
  });
});

const searchInput = document.getElementById('adminSearch');
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    currentSearch = e.target.value.toLowerCase();
    renderTable();
  });
}

const dateFilter = document.getElementById('dateFilter');
if (dateFilter) {
  dateFilter.addEventListener('change', (e) => {
    currentDateFilter = e.target.value;
    renderTable();
  });
}

// CRUD
window.approveReport = async function (id, e) {
  if (e) e.stopPropagation();
  if (!confirm('অ্যাপ্রুভ করতে চান?')) return;
  try { await db.collection('reports').doc(id).update({ status: 'approved' }); showToast('✅ অ্যাপ্রুভড!'); } catch (e) { showToast('❌ ' + e.message, true); }
  renderReports();
}
window.rejectReport = async function (id, e) {
  if (e) e.stopPropagation();
  if (!confirm('রিজেক্ট করতে চান?')) return;
  try { await db.collection('reports').doc(id).update({ status: 'rejected' }); showToast('❌ রিজেক্টেড!'); } catch (e) { showToast('❌ ' + e.message, true); }
  renderReports();
}
window.deleteReport = async function (id, e) {
  if (e) e.stopPropagation();
  if (!confirm('ডিলিট করতে চান?')) return;
  try { await db.collection('reports').doc(id).delete(); showToast('🗑️ ডিলিটেড!'); } catch (e) { showToast('❌ ' + e.message, true); }
  renderReports();
}

// Edit modal
const editModal = document.getElementById('editModal'), editForm = document.getElementById('editForm');
function openEdit(id) {
  const r = allReports.find(x => x.id === id); if (!r) return;
  document.getElementById('editId').value = id;
  document.getElementById('editLocation').value = r.location || '';
  document.getElementById('editType').value = r.collectorType || '';

  // Rate could be a string or a number
  let cleanRate = r.currentRate || 0;
  if (typeof r.currentRate === 'string') {
    cleanRate = String(r.currentRate).replace(/[^\d০-৯–-]/g, '');
  }
  document.getElementById('editRate').value = cleanRate;

  document.getElementById('editDescription').value = r.description || '';
  document.getElementById('editMood').value = r.mood || 'green';
  document.getElementById('editStatus').value = r.status || 'pending';
  editModal.classList.add('open');
}
function closeEdit() { editModal.classList.remove('open'); }
document.getElementById('editModalClose').addEventListener('click', closeEdit);
document.getElementById('editCancelBtn').addEventListener('click', closeEdit);
editModal.addEventListener('click', e => { if (e.target === editModal) closeEdit(); });
editForm.addEventListener('submit', async e => {
  e.preventDefault();
  try {
    const newRateStr = document.getElementById('editRate').value.trim();
    const newRate = isNaN(parseInt(newRateStr)) ? newRateStr : parseInt(newRateStr);

    await db.collection('reports').doc(document.getElementById('editId').value).update({
      location: document.getElementById('editLocation').value.trim(),
      collectorType: document.getElementById('editType').value,
      currentRate: newRate,
      description: document.getElementById('editDescription').value.trim(),
      mood: document.getElementById('editMood').value,
      status: document.getElementById('editStatus').value
    }); showToast('💾 আপডেটেড!'); closeEdit();
  } catch (e) { showToast('❌ ' + e.message, true); }
});

// Toast
function showToast(msg, err = false) {
  const t = document.getElementById('toast'); document.getElementById('toastMsg').textContent = msg;
  t.style.borderColor = err ? 'var(--danger-red)' : 'var(--accent)';
  t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 4000);
}
