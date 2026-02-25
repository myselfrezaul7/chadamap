// ===== THEME TOGGLE =====
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;

function setTheme(theme) {
    html.setAttribute('data-theme', theme);
    themeToggle.textContent = theme === 'dark' ? '🌙' : '☀️';
    localStorage.setItem('chandamap-theme', theme);
}

// Init from localStorage or default dark
const savedTheme = localStorage.getItem('chandamap-theme') || 'dark';
setTheme(savedTheme);

themeToggle.addEventListener('click', () => {
    const current = html.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'light' : 'dark');
});

// ===== ADMIN AUTH =====
const ADMIN_HASH = '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'; // sha256('password')

async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    const layout = document.querySelector('.dashboard-layout');
    const overlay = document.getElementById('adminAuthOverlay');
    if (layout) layout.classList.add('locked');
    if (sessionStorage.getItem('chandamap_admin') === 'true') {
        layout.classList.remove('locked');
        overlay.classList.add('authenticated');
    }
});

document.getElementById('adminLoginBtn').addEventListener('click', async () => {
    const pwd = document.getElementById('adminPassword').value;
    const hash = await sha256(pwd);
    const errEl = document.getElementById('adminAuthError');
    if (hash === ADMIN_HASH) {
        document.querySelector('.dashboard-layout').classList.remove('locked');
        document.getElementById('adminAuthOverlay').classList.add('authenticated');
        sessionStorage.setItem('chandamap_admin', 'true');
        showToast('✅ অ্যাডমিন অ্যাক্সেস সফল! স্বাগতম, বস।');
    } else {
        errEl.style.display = 'block';
        document.getElementById('adminPassword').value = '';
        setTimeout(() => errEl.style.display = 'none', 3000);
    }
});

document.getElementById('adminPassword').addEventListener('keypress', e => {
    if (e.key === 'Enter') document.getElementById('adminLoginBtn').click();
});

// ===== NAVBAR =====
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => navbar.classList.toggle('scrolled', window.scrollY > 50));

const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('open');
});
navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navLinks.classList.remove('open');
    });
});

// ===== LEAFLET MAP =====
const map = L.map('liveMap').setView([23.7644, 90.3893], 12);

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap © CARTO',
    maxZoom: 19
}).addTo(map);

// Watch for theme changes to swap tiles
const lightTiles = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const darkTiles = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
let currentLayer = null;

function updateMapTiles() {
    const theme = html.getAttribute('data-theme');
    if (currentLayer) map.removeLayer(currentLayer);
    currentLayer = L.tileLayer(theme === 'light' ? lightTiles : darkTiles, {
        attribution: '© OpenStreetMap © CARTO',
        maxZoom: 19
    }).addTo(map);
}
updateMapTiles();

// Re-apply tiles when theme changes
const origSetTheme = setTheme;
// We override indirectly by observing attribute changes
const observer = new MutationObserver(() => updateMapTiles());
observer.observe(html, { attributes: true, attributeFilter: ['data-theme'] });

// Marker icon factory
function makeIcon(color) {
    return L.divIcon({
        className: 'custom-marker',
        html: `<div style="width:20px;height:20px;background:${color};border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });
}

const chandaSpots = [
    {
        lat: 23.7245, lng: 90.4135, name: 'গুলিস্তান',
        type: 'লোকাল সিন্ডিকেট', rate: '৳ ১,৫০০', mood: 'red', moodText: '🔴 রেড',
        note: 'শিশু পার্ক এলাকায় সক্রিয়, সন্ধ্যার পর হাই রেট'
    },
    {
        lat: 23.7381, lng: 90.3958, name: 'শাহবাগ',
        type: 'পলিটিক্যাল ক্যাডার', rate: '৳ ৮০০', mood: 'red', moodText: '🔴 রেড',
        note: 'মোড়ে স্থায়ী চেকপোস্ট, রাত ১০টার পর সবচেয়ে কড়া'
    },
    {
        lat: 23.7330, lng: 90.4187, name: 'মতিঝিল',
        type: 'পাতি মাস্তান', rate: '৳ ১০০', mood: 'green', moodText: '🟢 গ্রিন',
        note: 'শাপলা চত্বরে, কম রেট, সমঝোতা সহজ'
    },
    {
        lat: 23.8067, lng: 90.3686, name: 'মিরপুর ১০',
        type: 'পলিটিক্যাল ক্যাডার', rate: '৳ ৫০০', mood: 'red', moodText: '🔴 রেড',
        note: '🔥 সবচেয়ে হট ডেঞ্জার জোন'
    },
    {
        lat: 23.7572, lng: 90.3880, name: 'ফার্মগেট',
        type: 'ট্রাফিক পুলিশ', rate: '৳ ২০০', mood: 'yellow', moodText: '🟡 ইয়েলো',
        note: 'সিগনালে ট্রাফিক পুলিশ, "লাইসেন্স দেখান" গেম'
    },
    {
        lat: 23.8759, lng: 90.3795, name: 'উত্তরা',
        type: 'পলিটিক্যাল ক্যাডার', rate: '৳ ৮০০', mood: 'red', moodText: '🔴 রেড',
        note: 'সেক্টর ৭ এ নতুন চেকপোস্ট, জোর করে নেয়'
    },
    {
        lat: 23.7507, lng: 90.3916, name: 'কারওয়ান বাজার',
        type: 'লোকাল সিন্ডিকেট', rate: '৳ ৩০০', mood: 'yellow', moodText: '🟡 ইয়েলো',
        note: 'মিডিয়া অফিস এলাকা, কিছুটা ভদ্র ভাবে নেয়'
    },
    {
        lat: 23.7509, lng: 90.4009, name: 'তেজগাঁও',
        type: 'পাতি মাস্তান', rate: '৳ ১৫০', mood: 'green', moodText: '🟢 গ্রিন',
        note: 'ইন্ডাস্ট্রিয়াল এলাকা, দিনে কম, রাতে বেশি'
    }
];

const moodColors = { red: '#ff2d2d', yellow: '#ffc107', green: '#39ff14' };

chandaSpots.forEach(spot => {
    const marker = L.marker([spot.lat, spot.lng], { icon: makeIcon(moodColors[spot.mood]) }).addTo(map);
    marker.bindPopup(`
    <div style="font-family:Inter,sans-serif;line-height:1.5;min-width:200px">
      <strong style="font-size:15px;display:block;margin-bottom:4px">📍 ${spot.name}</strong>
      <div style="font-size:13px;color:#666;margin-bottom:6px">${spot.type}</div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        <span style="font-size:18px;font-weight:700;color:#333">${spot.rate}</span>
        <span style="font-size:11px;padding:2px 8px;border-radius:10px;background:${moodColors[spot.mood]}20;color:${moodColors[spot.mood]}">${spot.moodText}</span>
      </div>
      <div style="font-size:12px;color:#888;font-style:italic">${spot.note}</div>
    </div>
  `);
});

// ===== ANIMATED COUNTERS =====
function animateCounter(el, target, prefix = '', suffix = '') {
    const duration = 2000;
    const start = performance.now();
    const update = (now) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(eased * target);
        el.textContent = prefix + current.toLocaleString('bn-BD') + suffix;
        if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
}

const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.dataset.animated) {
            entry.target.dataset.animated = 'true';
            const target = parseInt(entry.target.dataset.count);
            if (isNaN(target)) return;
            const text = entry.target.textContent;
            const prefix = text.startsWith('৳') ? '৳ ' : '';
            animateCounter(entry.target, target, prefix);
        }
    });
}, { threshold: 0.5 });
document.querySelectorAll('[data-count]').forEach(el => counterObserver.observe(el));

// ===== FORM =====
const reportForm = document.getElementById('reportForm');
const toast = document.getElementById('toast');
const toastMsg = document.getElementById('toastMsg');

reportForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const location = document.getElementById('location').value;
    const type = document.getElementById('collectorType').value;
    const rate = document.getElementById('currentRate').value;
    const mood = document.querySelector('input[name="mood"]:checked');
    if (!location || !type || !rate || !mood) { showToast('⚠️ সব ফিল্ড পূরণ করুন!', true); return; }
    const btn = document.getElementById('submitBtn');
    btn.textContent = '⏳ পাঠানো হচ্ছে...';
    btn.disabled = true;
    setTimeout(() => {
        showToast('✅ রিপোর্ট সফলভাবে অ্যাডমিনকে পাঠানো হয়েছে!');
        reportForm.reset();
        btn.textContent = '📤 অ্যাডমিনকে পাঠান';
        btn.disabled = false;
    }, 1500);
});

function showToast(message, isError = false) {
    toastMsg.textContent = message;
    toast.style.borderColor = isError ? 'var(--danger-red)' : 'var(--accent)';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4000);
}

// ===== DASHBOARD =====
document.querySelectorAll('.btn-verify').forEach(btn => {
    btn.addEventListener('click', function () {
        const row = this.closest('tr');
        this.textContent = '✅ ভেরিফাইড';
        this.style.background = 'var(--neon-green)';
        this.style.color = '#0a0a0a';
        this.disabled = true;
        row.style.opacity = '0.5';
        showToast('✅ রিপোর্ট ভেরিফাই হয়েছে!');
    });
});

document.querySelectorAll('.btn-reject').forEach(btn => {
    btn.addEventListener('click', function () {
        const row = this.closest('tr');
        this.textContent = '❌ রিজেক্টেড';
        this.style.background = 'var(--danger-red)';
        this.style.color = 'white';
        this.disabled = true;
        row.style.opacity = '0.3';
        showToast('❌ ফেক রিপোর্ট রিজেক্ট!', true);
    });
});

document.querySelectorAll('.sidebar-nav a').forEach(link => {
    link.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelectorAll('.sidebar-nav a').forEach(l => l.classList.remove('active'));
        this.classList.add('active');
    });
});

document.getElementById('syndicateToggle').addEventListener('change', function () {
    showToast(this.checked ? '⚠️ সিন্ডিকেটদের সাথে ডেটা শেয়ারিং চালু!' : '✅ ডেটা শেয়ারিং বন্ধ।', this.checked);
});

document.getElementById('btnPolice').addEventListener('click', () => showToast('🚔 পুলিশ রেইড অ্যালার্ট ট্রিগার হয়েছে!'));
document.getElementById('btnSurge').addEventListener('click', () => showToast('📈 সার্জ প্রাইসিং — সব স্পটে রেট ২৫% বাড়ানো হয়েছে!', true));
document.getElementById('btnVip').addEventListener('click', () => showToast('👑 ভিআইপি মামা ওভাররাইড অ্যাক্টিভেটেড!'));
document.getElementById('downloadBtn').addEventListener('click', () => showToast('📲 শীঘ্রই আসছে! স্টে টিউনড।'));

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const target = document.querySelector(this.getAttribute('href'));
        if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
});
