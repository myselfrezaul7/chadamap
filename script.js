// ===== SCROLL REVEAL =====
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('revealed'); revealObserver.unobserve(entry.target); }
    });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ===== THEME =====
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;
function setTheme(t) { html.setAttribute('data-theme', t); themeToggle.textContent = t === 'dark' ? '🌙' : '☀️'; localStorage.setItem('chandamap-theme', t); }
setTheme(localStorage.getItem('chandamap-theme') || 'dark');
themeToggle.addEventListener('click', () => setTheme(html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'));

// ===== NAVBAR =====
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => navbar.classList.toggle('scrolled', window.scrollY > 50), { passive: true });
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
hamburger.addEventListener('click', () => { hamburger.classList.toggle('active'); navLinks.classList.toggle('open'); });
navLinks.querySelectorAll('a').forEach(l => l.addEventListener('click', () => { hamburger.classList.remove('active'); navLinks.classList.remove('open'); }));

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => { const t = document.querySelector(a.getAttribute('href')); if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth' }); } });
});

// ===== LEAFLET MAP =====
const map = L.map('liveMap', { scrollWheelZoom: true, tap: true, touchZoom: true }).setView([23.7644, 90.3893], 12);
let currentTileLayer = null;
function setMapTiles() {
    const theme = html.getAttribute('data-theme');
    const url = theme === 'light' ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png' : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    if (currentTileLayer) map.removeLayer(currentTileLayer);
    currentTileLayer = L.tileLayer(url, { attribution: '© OSM © CARTO', maxZoom: 19 }).addTo(map);
}
setMapTiles();
new MutationObserver(setMapTiles).observe(html, { attributes: true, attributeFilter: ['data-theme'] });

// Map markers
const moodColors = { red: '#ff2d2d', yellow: '#ffc107', green: '#39ff14' };
const moodLabels = { red: '🔴 রেড', yellow: '🟡 ইয়েলো', green: '🟢 গ্রিন' };
function makeIcon(color, size = 16) {
    return L.divIcon({
        className: 'map-marker',
        html: `<div style="width:${size}px;height:${size}px;background:${color};border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>`,
        iconSize: [size, size], iconAnchor: [size / 2, size / 2]
    });
}

// Static hardcoded spots
const chandaSpots = [
    { lat: 23.7245, lng: 90.4135, name: 'গুলিস্তান', nameEn: 'gulistan', type: 'লোকাল সিন্ডিকেট', rate: '৳ ১,৫০০', mood: 'red', note: 'শিশু পার্ক এলাকায় সক্রিয়' },
    { lat: 23.7381, lng: 90.3958, name: 'শাহবাগ', nameEn: 'shahbag', type: 'পলিটিক্যাল ক্যাডার', rate: '৳ ৮০০', mood: 'red', note: 'মোড়ে স্থায়ী চেকপোস্ট' },
    { lat: 23.7330, lng: 90.4187, name: 'মতিঝিল', nameEn: 'motijheel', type: 'পাতি মাস্তান', rate: '৳ ১০০', mood: 'green', note: 'শাপলা চত্বরে, কম রেট' },
    { lat: 23.8067, lng: 90.3686, name: 'মিরপুর ১০', nameEn: 'mirpur 10', type: 'পলিটিক্যাল ক্যাডার', rate: '৳ ৫০০', mood: 'red', note: '🔥 সবচেয়ে হট ডেঞ্জার জোন' },
    { lat: 23.7572, lng: 90.3880, name: 'ফার্মগেট', nameEn: 'farmgate', type: 'ট্রাফিক পুলিশ', rate: '৳ ২০০', mood: 'yellow', note: '"লাইসেন্স দেখান" গেম' },
    { lat: 23.8759, lng: 90.3795, name: 'উত্তরা', nameEn: 'uttara', type: 'পলিটিক্যাল ক্যাডার', rate: '৳ ৮০০', mood: 'red', note: 'সেক্টর ৭ এ নতুন চেকপোস্ট' },
    { lat: 23.7507, lng: 90.3916, name: 'কারওয়ান বাজার', nameEn: 'karwan bazar', type: 'লোকাল সিন্ডিকেট', rate: '৳ ৩০০', mood: 'yellow', note: 'মিডিয়া অফিস এলাকা' },
    { lat: 23.7509, lng: 90.4009, name: 'তেজগাঁও', nameEn: 'tejgaon', type: 'পাতি মাস্তান', rate: '৳ ১৫০', mood: 'green', note: 'ইন্ডাস্ট্রিয়াল এলাকা' }
];

// All spots for search (static + dynamic)
let allMapSpots = [...chandaSpots];
let dynamicMarkers = [];
let heatLayer = null;

function convertBnToEn(str) {
    return String(str).replace(/[০-৯]/g, d => '০১২৩৪৫৬৭৮৯'.indexOf(d));
}

function updateHeatmap() {
    if (heatLayer) map.removeLayer(heatLayer);
    const heatData = allMapSpots.map(s => {
        const rateStr = String(s.rate).replace(/[^\d০-৯]/g, '');
        const rateNum = parseInt(convertBnToEn(rateStr)) || 500;
        const intensity = Math.min(rateNum / 1500, 1.0);
        return [s.lat, s.lng, intensity];
    });
    heatLayer = L.heatLayer(heatData, {
        radius: 35,
        blur: 25,
        maxZoom: 14,
        gradient: { 0.4: '#ffd000', 0.65: '#ff7b00', 1.0: '#ff0000' }
    }).addTo(map);
}

function createPopup(s) {
    return `<div style="font-family:Inter,sans-serif;line-height:1.6;min-width:170px"><strong style="font-size:14px">📍 ${s.name}</strong><div style="font-size:12px;color:#666;margin:3px 0">${s.type}</div><div style="display:flex;align-items:center;gap:8px;margin:5px 0"><span style="font-size:16px;font-weight:700;color:#333">${s.rate}</span><span style="font-size:11px;padding:2px 8px;border-radius:10px;background:${moodColors[s.mood]}20;color:${moodColors[s.mood]}">${moodLabels[s.mood]}</span></div>${s.note ? `<div style="font-size:11px;color:#888;font-style:italic">${s.note}</div>` : ''}${s.source === 'firestore' ? '<div style="margin-top:4px;font-size:10px;color:#4a9b9b">✅ ভেরিফাইড রিপোর্ট</div>' : ''}</div>`;
}

// Add static markers
chandaSpots.forEach(s => {
    const marker = L.marker([s.lat, s.lng], { icon: makeIcon(moodColors[s.mood]) }).addTo(map).bindPopup(createPopup(s));
    marker.on('mouseover', function (e) { this.openPopup(); });
});
updateHeatmap();

// ===== DYNAMIC FIRESTORE MARKERS (approved reports) =====
// Dhaka area coordinates for placing user reports
const dhakaAreaCoords = {
    'গুলিস্তান': { lat: 23.7245, lng: 90.4135 }, 'gulistan': { lat: 23.7245, lng: 90.4135 },
    'শাহবাগ': { lat: 23.7381, lng: 90.3958 }, 'shahbag': { lat: 23.7381, lng: 90.3958 },
    'মতিঝিল': { lat: 23.7330, lng: 90.4187 }, 'motijheel': { lat: 23.7330, lng: 90.4187 },
    'মিরপুর': { lat: 23.8067, lng: 90.3686 }, 'mirpur': { lat: 23.8067, lng: 90.3686 },
    'ফার্মগেট': { lat: 23.7572, lng: 90.3880 }, 'farmgate': { lat: 23.7572, lng: 90.3880 },
    'উত্তরা': { lat: 23.8759, lng: 90.3795 }, 'uttara': { lat: 23.8759, lng: 90.3795 },
    'কারওয়ান বাজার': { lat: 23.7507, lng: 90.3916 }, 'karwan bazar': { lat: 23.7507, lng: 90.3916 }, 'kawran bazar': { lat: 23.7507, lng: 90.3916 },
    'তেজগাঁও': { lat: 23.7509, lng: 90.4009 }, 'tejgaon': { lat: 23.7509, lng: 90.4009 },
    'ধানমন্ডি': { lat: 23.7461, lng: 90.3742 }, 'dhanmondi': { lat: 23.7461, lng: 90.3742 },
    'মোহাম্মদপুর': { lat: 23.7662, lng: 90.3587 }, 'mohammadpur': { lat: 23.7662, lng: 90.3587 },
    'বনানী': { lat: 23.7937, lng: 90.4066 }, 'banani': { lat: 23.7937, lng: 90.4066 },
    'গুলশান': { lat: 23.7925, lng: 90.4135 }, 'gulshan': { lat: 23.7925, lng: 90.4135 },
    'মালিবাগ': { lat: 23.7478, lng: 90.4128 }, 'malibagh': { lat: 23.7478, lng: 90.4128 },
    'যাত্রাবাড়ী': { lat: 23.7106, lng: 90.4347 }, 'jatrabari': { lat: 23.7106, lng: 90.4347 },
    'সদরঘাট': { lat: 23.7063, lng: 90.4075 }, 'sadarghat': { lat: 23.7063, lng: 90.4075 },
    'মিরপুর ১০': { lat: 23.8067, lng: 90.3686 }, 'mirpur 10': { lat: 23.8067, lng: 90.3686 },
    'বাড্ডা': { lat: 23.7836, lng: 90.4273 }, 'badda': { lat: 23.7836, lng: 90.4273 },
    'রামপুরা': { lat: 23.7637, lng: 90.4236 }, 'rampura': { lat: 23.7637, lng: 90.4236 },
    'খিলগাঁও': { lat: 23.7532, lng: 90.4342 }, 'khilgaon': { lat: 23.7532, lng: 90.4342 },
    'শ্যামলী': { lat: 23.7730, lng: 90.3636 }, 'shyamoli': { lat: 23.7730, lng: 90.3636 },
    'নিউমার্কেট': { lat: 23.7337, lng: 90.3846 }, 'new market': { lat: 23.7337, lng: 90.3846 }, 'newmarket': { lat: 23.7337, lng: 90.3846 },
    'পুরান ঢাকা': { lat: 23.7104, lng: 90.4074 }, 'old dhaka': { lat: 23.7104, lng: 90.4074 }, 'puran dhaka': { lat: 23.7104, lng: 90.4074 },
    'টঙ্গী': { lat: 23.8932, lng: 90.3989 }, 'tongi': { lat: 23.8932, lng: 90.3989 },
    'কাঁচপুর': { lat: 23.7032, lng: 90.5218 }, 'kanchpur': { lat: 23.7032, lng: 90.5218 },
    'নারায়ণগঞ্জ': { lat: 23.7032, lng: 90.5218 }, 'narayanganj': { lat: 23.7032, lng: 90.5218 },
    'কক্সবাজার': { lat: 21.9497, lng: 92.1466 }, 'coxs bazar': { lat: 21.9497, lng: 92.1466 }, "cox's bazar": { lat: 21.9497, lng: 92.1466 }
};

function findCoords(location) {
    const loc = location.toLowerCase();
    for (const [key, coords] of Object.entries(dhakaAreaCoords)) {
        if (loc.includes(key.toLowerCase()) || key.toLowerCase().includes(loc)) return coords;
    }
    // Random offset near Dhaka center
    return { lat: 23.7644 + (Math.random() - 0.5) * 0.06, lng: 90.3893 + (Math.random() - 0.5) * 0.06 };
}

// Listen for approved reports in real-time
db.collection('reports').where('status', '==', 'approved').onSnapshot(snapshot => {
    // Clear old dynamic markers
    dynamicMarkers.forEach(m => map.removeLayer(m));
    dynamicMarkers = [];
    // Remove old dynamic spots from allMapSpots
    allMapSpots = [...chandaSpots];

    snapshot.docs.forEach(doc => {
        const r = doc.data();
        const coords = findCoords(r.location || '');
        const spot = {
            lat: coords.lat,
            lng: coords.lng,
            name: r.location || 'অজানা',
            type: r.collectorType || '—',
            rate: '৳ ' + (r.currentRate || 0).toLocaleString('bn-BD'),
            mood: r.mood || 'green',
            note: r.vipCode || '',
            source: 'firestore'
        };
        allMapSpots.push(spot);
        const marker = L.marker([spot.lat, spot.lng], { icon: makeIcon(moodColors[spot.mood], 14) }).addTo(map).bindPopup(createPopup(spot));
        marker.on('mouseover', function (e) { this.openPopup(); });
        dynamicMarkers.push(marker);
    });
    updateHeatmap();
});

// Fix map size on scroll into view
new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) map.invalidateSize(); });
}, { threshold: 0.1 }).observe(document.getElementById('map'));

// ===== SEARCH =====
const searchInput = document.getElementById('mapSearchInput');
const searchResults = document.getElementById('searchResults');

searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim().toLowerCase();
    if (q.length < 2) { searchResults.classList.remove('show'); searchResults.innerHTML = ''; return; }

    const matches = allMapSpots.filter(s =>
        s.name.toLowerCase().includes(q) || s.type.toLowerCase().includes(q) || (s.nameEn && s.nameEn.toLowerCase().includes(q))
    );

    if (matches.length === 0) {
        searchResults.innerHTML = '<div class="search-result-item" style="color:var(--text-tertiary)">❌ কোনো ফলাফল পাওয়া যায়নি</div>';
    } else {
        searchResults.innerHTML = matches.slice(0, 6).map(s =>
            `<div class="search-result-item" onclick="flyToSpot(${s.lat},${s.lng},'${s.name}')">
        <span class="mood-dot" style="background:${moodColors[s.mood]}"></span>
        <span><strong>${s.name}</strong> — ${s.type} — ${s.rate}</span>
      </div>`
        ).join('');
    }
    searchResults.classList.add('show');
});

searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); searchLocation(); } });
document.addEventListener('click', e => { if (!e.target.closest('.map-search-bar')) searchResults.classList.remove('show'); });

function searchLocation() {
    const q = searchInput.value.trim().toLowerCase();
    if (!q) return;
    const match = allMapSpots.find(s => s.name.toLowerCase().includes(q) || (s.nameEn && s.nameEn.toLowerCase().includes(q)));
    if (match) {
        flyToSpot(match.lat, match.lng, match.name);
    } else {
        showToast('❌ "' + searchInput.value.trim() + '" এলাকায় কোনো চাঁদাবাজি রিপোর্ট নেই।', true);
    }
    searchResults.classList.remove('show');
}

function flyToSpot(lat, lng, name) {
    map.flyTo([lat, lng], 15, { animate: true, duration: 1.2 });
    searchInput.value = name;
    searchResults.classList.remove('show');
    document.getElementById('map').scrollIntoView({ behavior: 'smooth' });
}

// ===== ANIMATED COUNTERS =====
function animateCounter(el, target) {
    const dur = 2200, start = performance.now();
    const tick = now => { const p = Math.min((now - start) / dur, 1); el.textContent = Math.floor((1 - Math.pow(1 - p, 4)) * target).toLocaleString('bn-BD'); if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
}
document.querySelectorAll('[data-count]').forEach(el => {
    new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting && !e.target.dataset.done) { e.target.dataset.done = '1'; animateCounter(e.target, parseInt(e.target.dataset.count)); } });
    }, { threshold: 0.5 }).observe(el);
});

// ===== FORM → FIRESTORE =====
function sanitize(s) { return s.replace(/[<>]/g, '').trim().slice(0, 500); }
document.getElementById('reportForm').addEventListener('submit', async e => {
    e.preventDefault();
    const location = sanitize(document.getElementById('location').value);
    const collectorType = document.getElementById('collectorType').value;
    const currentRate = Math.min(Math.max(parseInt(document.getElementById('currentRate').value) || 0, 0), 999999);
    const mood = document.querySelector('input[name="mood"]:checked');
    const vipCode = sanitize(document.getElementById('vipCode').value);
    const description = sanitize(document.getElementById('description').value);
    if (!location || !collectorType || !currentRate || !mood) { showToast('⚠️ সব ফিল্ড পূরণ করুন!', true); return; }
    const btn = document.getElementById('submitBtn');
    btn.textContent = '⏳ পাঠানো হচ্ছে...'; btn.disabled = true;
    try {
        await db.collection('reports').add({ location, collectorType, currentRate, mood: mood.value, vipCode: vipCode || '', description: description || '', status: 'pending', createdAt: firebase.firestore.FieldValue.serverTimestamp() });
        document.getElementById('reportForm').style.display = 'none';
        document.getElementById('formSuccessMsg').style.display = 'block';
        document.getElementById('reportForm').reset();
    } catch (err) { showToast('❌ ত্রুটি: ' + err.message, true); }
    btn.textContent = '📤 রিপোর্ট জমা দিন'; btn.disabled = false;
});

window.resetFormView = function () {
    document.getElementById('formSuccessMsg').style.display = 'none';
    document.getElementById('reportForm').style.display = 'block';
};

// ===== TOAST =====
function showToast(msg, err = false) {
    const t = document.getElementById('toast'); document.getElementById('toastMsg').textContent = msg;
    t.style.borderColor = err ? 'var(--danger-red)' : 'var(--accent)';
    t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 4000);
}

// ===== AI EXCUSE GENERATOR =====
const excuses = [
    { emoji: '👮', text: '"ভাই আমার মামা DIG, ফোন করব?" — ৯৫% সাকসেস রেট' },
    { emoji: '🤕', text: '"দুই রাস্তা আগে পকেটমার লইয়া গেছে, ভাই খালি পকেট!" — ৬৮% সাকসেস' },
    { emoji: '🤰', text: '"বউ লেবারে, এখনই হসপিটাল যাইতে হবে!" — ৮৮% সাকসেস রেট' },
    { emoji: '📱', text: '"ভাই ক্যামেরা চালু আছে, লাইভে আছি!" — ৭৫% সাকসেস রেট' },
    { emoji: '🪪', text: '"আমি সাংবাদিক, প্রেস কার্ড দেখাই?" — ৬২% সাকসেস রেট' },
    { emoji: '😭', text: '"গতকাল চাকরি গেছে ভাই, বাচ্চার দুধের টাকাও নাই!" — ৭৯% সাকসেস রেট' },
    { emoji: '🤝', text: '"জামাল ভাইয়ের লোক আমি, চিনেন না?" — ৫৫% সাকসেস রেট (ভুল জামাল হলে 0%)' },
    { emoji: '🔧', text: '"গাড়ি খারাপ, টো করতেছি, ভাই একটু সহানুভূতি!" — ৪৫% সাকসেস রেট' },
    { emoji: '🤒', text: '"ভাই আমার জ্বর ১০৪, ডেঙ্গু হইতে পারে, কাছে আইসেন না!" — ৯২% সাকসেস রেট' },
    { emoji: '📞', text: '"থানায় ফোন করব? নাকি আমরা ভদ্রভাবে সমাধান করি?" — ৩৫% সাকসেস রেট (ব্যাকফায়ার ঝুঁকি)' },
    { emoji: '🎓', text: '"আমি মাদ্রাসার হুজুর, চাঁদা নিলে গুনাহ হবে ভাই!" — ৮৫% সাকসেস রেট' },
    { emoji: '🚑', text: '"অ্যাম্বুলেন্স পিছনে আসতেছে, রাস্তা ছাড়েন!" — ৭০% সাকসেস রেট' }
];
let excuseCounter = 0;
window.generateExcuse = function () {
    const display = document.getElementById('excuseDisplay');
    display.classList.add('animating');
    setTimeout(() => {
        const e = excuses[Math.floor(Math.random() * excuses.length)];
        document.getElementById('excuseText').textContent = e.text;
        document.querySelector('.excuse-emoji').textContent = e.emoji;
        excuseCounter++;
        document.getElementById('excuseCount').textContent = excuseCounter.toLocaleString('bn-BD');
        display.classList.remove('animating');
    }, 400);
};

// ===== SHIFT CHANGE TRACKER =====
const shifts = [
    { name: '🌙 রাত শিফট', rate: 'রেট: লো (ঘুমাচ্ছে)', start: 0, end: 6 },
    { name: '🌅 সকাল শিফট', rate: 'রেট: স্বাভাবিক', start: 6, end: 12 },
    { name: '🌇 বিকেল শিফট', rate: 'রেট: +৫০% সার্জ!', start: 12, end: 18 },
    { name: '🌃 সন্ধ্যা শিফট', rate: 'রেট: +৮০% পিক আওয়ার!', start: 18, end: 24 }
];
function updateShiftTracker() {
    const now = new Date();
    const h = now.getHours(), m = now.getMinutes(), s = now.getSeconds();
    let ci = shifts.findIndex(sh => h >= sh.start && h < sh.end);
    if (ci === -1) ci = 0;
    const ni = (ci + 1) % shifts.length;
    const cur = shifts[ci], nxt = shifts[ni];
    document.getElementById('currentShiftName').textContent = cur.name;
    document.getElementById('currentShiftRate').textContent = cur.rate;
    document.getElementById('nextShiftName').textContent = nxt.name;
    document.getElementById('nextShiftRate').textContent = nxt.rate;
    const shiftDur = (cur.end - cur.start) * 3600;
    const elapsed = (h - cur.start) * 3600 + m * 60 + s;
    const pct = Math.min((elapsed / shiftDur) * 100, 100);
    document.getElementById('shiftProgressFill').style.width = pct + '%';
    const remain = shiftDur - elapsed;
    const rh = Math.floor(remain / 3600), rm = Math.floor((remain % 3600) / 60), rs = remain % 60;
    document.getElementById('shiftCountdown').textContent =
        `শিফট চেঞ্জ হতে বাকি: ${rh} ঘণ্টা ${rm} মিনিট ${rs} সেকেন্ড`;
    const w = document.getElementById('shiftWarning');
    if (pct > 80) { w.style.display = 'block'; w.textContent = '⚡ সার্জ প্রাইসিং শুরু হতে পারে — এখনই পালান!'; }
    else { w.style.display = 'none'; }
}
updateShiftTracker();
setInterval(updateShiftTracker, 1000);


