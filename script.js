// ===== THEME TOGGLE =====
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;
function setTheme(theme) {
    html.setAttribute('data-theme', theme);
    themeToggle.textContent = theme === 'dark' ? '🌙' : '☀️';
    localStorage.setItem('chandamap-theme', theme);
}
setTheme(localStorage.getItem('chandamap-theme') || 'dark');
themeToggle.addEventListener('click', () => {
    setTheme(html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
});

// ===== NAVBAR =====
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => navbar.classList.toggle('scrolled', window.scrollY > 50));
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
hamburger.addEventListener('click', () => { hamburger.classList.toggle('active'); navLinks.classList.toggle('open'); });
navLinks.querySelectorAll('a').forEach(link => link.addEventListener('click', () => { hamburger.classList.remove('active'); navLinks.classList.remove('open'); }));

// ===== FIREBASE AUTH =====
const overlay = document.getElementById('adminAuthOverlay');
const dashLayout = document.getElementById('dashboardLayout');
const loginBtn = document.getElementById('googleLoginBtn');
const logoutBtn = document.getElementById('adminLogoutBtn');
const authError = document.getElementById('adminAuthError');

let currentUser = null;
let unsubReports = null;

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
            authError.textContent = '❌ এই অ্যাকাউন্টের অ্যাডমিন অ্যাক্সেস নেই। শুধুমাত্র chadamap7@gmail.com ব্যবহার করুন।';
            authError.style.display = 'block';
        }
    }
});

loginBtn.addEventListener('click', async () => {
    authError.style.display = 'none';
    try {
        await auth.signInWithPopup(googleProvider);
    } catch (err) {
        authError.textContent = '❌ লগইন ব্যর্থ: ' + err.message;
        authError.style.display = 'block';
    }
});

logoutBtn.addEventListener('click', () => {
    auth.signOut();
    showToast('🚪 লগআউট সফল!');
});

// ===== FIRESTORE: FORM SUBMISSION =====
const reportForm = document.getElementById('reportForm');
reportForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const location = document.getElementById('location').value.trim();
    const collectorType = document.getElementById('collectorType').value;
    const currentRate = parseInt(document.getElementById('currentRate').value);
    const mood = document.querySelector('input[name="mood"]:checked');
    const vipCode = document.getElementById('vipCode').value.trim();

    if (!location || !collectorType || !currentRate || !mood) {
        showToast('⚠️ সব ফিল্ড পূরণ করুন!', true);
        return;
    }

    const btn = document.getElementById('submitBtn');
    btn.textContent = '⏳ পাঠানো হচ্ছে...';
    btn.disabled = true;

    try {
        await db.collection('reports').add({
            location,
            collectorType,
            currentRate,
            mood: mood.value,
            vipCode: vipCode || '',
            status: 'pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        showToast('✅ রিপোর্ট সফলভাবে জমা হয়েছে! অ্যাডমিন রিভিউ করবেন।');
        reportForm.reset();
    } catch (err) {
        showToast('❌ রিপোর্ট জমা ব্যর্থ: ' + err.message, true);
    }
    btn.textContent = '📤 রিপোর্ট জমা দিন';
    btn.disabled = false;
});

// ===== FIRESTORE: LOAD REPORTS (REAL-TIME) =====
let allReports = [];
let currentFilter = 'all';

function loadReports() {
    if (unsubReports) unsubReports();
    unsubReports = db.collection('reports')
        .orderBy('createdAt', 'desc')
        .onSnapshot(snapshot => {
            allReports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            updateKPIs();
            renderTable();
        }, err => {
            console.error('Firestore error:', err);
        });
}

function updateKPIs() {
    const total = allReports.length;
    const pending = allReports.filter(r => r.status === 'pending').length;
    const approved = allReports.filter(r => r.status === 'approved').length;
    const rejected = allReports.filter(r => r.status === 'rejected').length;
    document.getElementById('kpiTotal').textContent = total.toLocaleString('bn-BD');
    document.getElementById('kpiPending').textContent = pending.toLocaleString('bn-BD');
    document.getElementById('kpiApproved').textContent = approved.toLocaleString('bn-BD');
    document.getElementById('kpiRejected').textContent = rejected.toLocaleString('bn-BD');
}

function renderTable() {
    const tbody = document.getElementById('reportsBody');
    const filtered = currentFilter === 'all' ? allReports : allReports.filter(r => r.status === currentFilter);

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-tertiary)">কোনো রিপোর্ট নেই</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(r => {
        const time = r.createdAt ? new Date(r.createdAt.seconds * 1000).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }) : '—';
        const moodMap = { green: { icon: '🟢', cls: 'green', text: 'গ্রিন' }, yellow: { icon: '🟡', cls: 'yellow', text: 'ইয়েলো' }, red: { icon: '🔴', cls: 'red', text: 'রেড' } };
        const m = moodMap[r.mood] || moodMap.green;
        const statusMap = { pending: '⏳ পেন্ডিং', approved: '✅ অ্যাপ্রুভড', rejected: '❌ রিজেক্টেড' };

        return `<tr>
      <td>${time}</td>
      <td>${r.location || '—'}</td>
      <td>${r.collectorType || '—'}</td>
      <td>৳ ${(r.currentRate || 0).toLocaleString('bn-BD')}</td>
      <td><span class="mood-badge ${m.cls}">${m.icon} ${m.text}</span></td>
      <td><span class="status-badge status-${r.status}">${statusMap[r.status] || r.status}</span></td>
      <td class="table-actions">
        ${r.status === 'pending' ? `<button class="btn-verify" onclick="approveReport('${r.id}')">✅</button><button class="btn-reject" onclick="rejectReport('${r.id}')">❌</button>` : ''}
        <button class="btn-edit" onclick="openEdit('${r.id}')">✏️</button>
        <button class="btn-delete" onclick="deleteReport('${r.id}')">🗑️</button>
      </td>
    </tr>`;
    }).join('');
}

// Filter tabs
document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', function () {
        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        currentFilter = this.dataset.filter;
        renderTable();
    });
});

// ===== CRUD OPERATIONS =====
async function approveReport(id) {
    try {
        await db.collection('reports').doc(id).update({ status: 'approved' });
        showToast('✅ রিপোর্ট অ্যাপ্রুভ হয়েছে!');
    } catch (err) { showToast('❌ ত্রুটি: ' + err.message, true); }
}

async function rejectReport(id) {
    try {
        await db.collection('reports').doc(id).update({ status: 'rejected' });
        showToast('❌ রিপোর্ট রিজেক্ট হয়েছে!');
    } catch (err) { showToast('❌ ত্রুটি: ' + err.message, true); }
}

async function deleteReport(id) {
    if (!confirm('এই রিপোর্ট ডিলিট করতে চান?')) return;
    try {
        await db.collection('reports').doc(id).delete();
        showToast('🗑️ রিপোর্ট ডিলিট হয়েছে!');
    } catch (err) { showToast('❌ ত্রুটি: ' + err.message, true); }
}

// ===== EDIT MODAL =====
const editModal = document.getElementById('editModal');
const editForm = document.getElementById('editForm');

function openEdit(id) {
    const report = allReports.find(r => r.id === id);
    if (!report) return;
    document.getElementById('editId').value = id;
    document.getElementById('editLocation').value = report.location || '';
    document.getElementById('editType').value = report.collectorType || '';
    document.getElementById('editRate').value = report.currentRate || 0;
    document.getElementById('editMood').value = report.mood || 'green';
    document.getElementById('editStatus').value = report.status || 'pending';
    editModal.classList.add('open');
}

function closeEdit() { editModal.classList.remove('open'); }
document.getElementById('editModalClose').addEventListener('click', closeEdit);
document.getElementById('editCancelBtn').addEventListener('click', closeEdit);
editModal.addEventListener('click', (e) => { if (e.target === editModal) closeEdit(); });

editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('editId').value;
    try {
        await db.collection('reports').doc(id).update({
            location: document.getElementById('editLocation').value.trim(),
            collectorType: document.getElementById('editType').value,
            currentRate: parseInt(document.getElementById('editRate').value),
            mood: document.getElementById('editMood').value,
            status: document.getElementById('editStatus').value
        });
        showToast('💾 রিপোর্ট আপডেট হয়েছে!');
        closeEdit();
    } catch (err) { showToast('❌ ত্রুটি: ' + err.message, true); }
});

// ===== LEAFLET MAP =====
const map = L.map('liveMap').setView([23.7644, 90.3893], 12);
let currentTileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap © CARTO', maxZoom: 19
}).addTo(map);

const observer = new MutationObserver(() => {
    const theme = html.getAttribute('data-theme');
    const tileUrl = theme === 'light'
        ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    if (currentTileLayer) map.removeLayer(currentTileLayer);
    currentTileLayer = L.tileLayer(tileUrl, { attribution: '© OpenStreetMap © CARTO', maxZoom: 19 }).addTo(map);
});
observer.observe(html, { attributes: true, attributeFilter: ['data-theme'] });

function makeIcon(color) {
    return L.divIcon({
        className: 'custom-marker',
        html: `<div style="width:18px;height:18px;background:${color};border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>`,
        iconSize: [18, 18], iconAnchor: [9, 9]
    });
}

const moodColors = { red: '#ff2d2d', yellow: '#ffc107', green: '#39ff14' };
const chandaSpots = [
    { lat: 23.7245, lng: 90.4135, name: 'গুলিস্তান', type: 'লোকাল সিন্ডিকেট', rate: '৳ ১,৫০০', mood: 'red', note: 'শিশু পার্ক এলাকায় সক্রিয়' },
    { lat: 23.7381, lng: 90.3958, name: 'শাহবাগ', type: 'পলিটিক্যাল ক্যাডার', rate: '৳ ৮০০', mood: 'red', note: 'মোড়ে স্থায়ী চেকপোস্ট' },
    { lat: 23.7330, lng: 90.4187, name: 'মতিঝিল', type: 'পাতি মাস্তান', rate: '৳ ১০০', mood: 'green', note: 'শাপলা চত্বরে, কম রেট' },
    { lat: 23.8067, lng: 90.3686, name: 'মিরপুর ১০', type: 'পলিটিক্যাল ক্যাডার', rate: '৳ ৫০০', mood: 'red', note: '🔥 সবচেয়ে হট ডেঞ্জার জোন' },
    { lat: 23.7572, lng: 90.3880, name: 'ফার্মগেট', type: 'ট্রাফিক পুলিশ', rate: '৳ ২০০', mood: 'yellow', note: '"লাইসেন্স দেখান" গেম' },
    { lat: 23.8759, lng: 90.3795, name: 'উত্তরা', type: 'পলিটিক্যাল ক্যাডার', rate: '৳ ৮০০', mood: 'red', note: 'সেক্টর ৭ এ নতুন চেকপোস্ট' },
    { lat: 23.7507, lng: 90.3916, name: 'কারওয়ান বাজার', type: 'লোকাল সিন্ডিকেট', rate: '৳ ৩০০', mood: 'yellow', note: 'মিডিয়া অফিস এলাকা' },
    { lat: 23.7509, lng: 90.4009, name: 'তেজগাঁও', type: 'পাতি মাস্তান', rate: '৳ ১৫০', mood: 'green', note: 'ইন্ডাস্ট্রিয়াল এলাকা' }
];

chandaSpots.forEach(spot => {
    const marker = L.marker([spot.lat, spot.lng], { icon: makeIcon(moodColors[spot.mood]) }).addTo(map);
    const moodLabel = { red: '🔴 রেড', yellow: '🟡 ইয়েলো', green: '🟢 গ্রিন' };
    marker.bindPopup(`
    <div style="font-family:Inter,sans-serif;line-height:1.5;min-width:180px">
      <strong style="font-size:14px">📍 ${spot.name}</strong>
      <div style="font-size:12px;color:#666;margin:4px 0">${spot.type}</div>
      <div style="display:flex;align-items:center;gap:8px;margin:6px 0">
        <span style="font-size:16px;font-weight:700;color:#333">${spot.rate}</span>
        <span style="font-size:11px;padding:2px 8px;border-radius:10px;background:${moodColors[spot.mood]}20;color:${moodColors[spot.mood]}">${moodLabel[spot.mood]}</span>
      </div>
      <div style="font-size:11px;color:#888;font-style:italic">${spot.note}</div>
    </div>
  `);
});

// Fix map size when section scrolled into view
const mapObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => { if (entry.isIntersecting) map.invalidateSize(); });
}, { threshold: 0.1 });
mapObserver.observe(document.getElementById('map'));

// ===== ANIMATED COUNTERS =====
function animateCounter(el, target, prefix) {
    const duration = 2000;
    const start = performance.now();
    const update = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = (prefix || '') + Math.floor(eased * target).toLocaleString('bn-BD');
        if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
}
const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.dataset.animated) {
            entry.target.dataset.animated = 'true';
            const target = parseInt(entry.target.dataset.count);
            if (!isNaN(target)) animateCounter(entry.target, target, entry.target.textContent.startsWith('৳') ? '৳ ' : '');
        }
    });
}, { threshold: 0.5 });
document.querySelectorAll('[data-count]').forEach(el => counterObserver.observe(el));

// ===== TOAST =====
function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    document.getElementById('toastMsg').textContent = message;
    toast.style.borderColor = isError ? 'var(--danger-red)' : 'var(--accent)';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4000);
}

// ===== MISC =====
document.getElementById('downloadBtn').addEventListener('click', () => showToast('📲 শীঘ্রই আসছে! স্টে টিউনড।'));
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
        const t = document.querySelector(a.getAttribute('href'));
        if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth' }); }
    });
});
