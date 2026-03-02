// ===== SCROLL REVEAL =====
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('revealed'); revealObserver.unobserve(entry.target); }
    });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ===== NUMBER COUNTING =====
const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const el = entry.target;
            const target = parseInt(el.getAttribute('data-count'), 10);
            let current = 0;
            const increment = Math.max(1, Math.floor(target / 40));
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }
                el.textContent = current.toLocaleString('bn-BD');
            }, 50);
            statObserver.unobserve(el);
        }
    });
});
document.querySelectorAll('.stat-value').forEach(el => statObserver.observe(el));

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
    const isRed = color === '#ff2d2d';
    const extraClass = isRed ? ' pulse-marker' : '';
    const shadow = isRed ? '' : 'box-shadow:0 2px 8px rgba(0,0,0,0.4);';
    return L.divIcon({
        className: 'map-marker',
        html: `<div class="${extraClass}" style="width:${size}px;height:${size}px;background:${color};border-radius:50%;border:3px solid white;${shadow}"></div>`,
        iconSize: [size, size], iconAnchor: [size / 2, size / 2]
    });
}

// Static hardcoded spots
const chandaSpots = [
    { lat: 23.7245, lng: 90.4135, name: 'গুলিস্তান', nameEn: 'gulistan', type: 'লোকাল সিন্ডিকেট', rate: '৳ ১,৫০০', mood: 'red', note: 'শিশু পার্ক এলাকায় বাসমালিক সমিতির নামে' },
    { lat: 23.7381, lng: 90.3958, name: 'শাহবাগ', nameEn: 'shahbag', type: 'পলিটিক্যাল ক্যাডার', rate: '৳ ৮০০', mood: 'red', note: 'মোড়ে স্থায়ী চেকপোস্ট' },
    { lat: 23.7330, lng: 90.4187, name: 'মতিঝিল', nameEn: 'motijheel', type: 'পাতি মাস্তান', rate: '৳ ১০০', mood: 'green', note: 'শাপলা চত্বরে, রিকশা-ভ্যান থেকে কম রেট' },
    { lat: 23.8067, lng: 90.3686, name: 'মিরপুর ১০', nameEn: 'mirpur 10', type: 'পলিটিক্যাল ক্যাডার', rate: '৳ ৫০০', mood: 'red', note: '🔥 সবচেয়ে হট ডেঞ্জার জোন' },
    { lat: 23.7572, lng: 90.3880, name: 'ফার্মগেট', nameEn: 'farmgate', type: 'ট্রাফিক পুলিশ', rate: '৳ ২০০', mood: 'yellow', note: '"লাইসেন্স দেখান" গেম' },
    { lat: 23.8759, lng: 90.3795, name: 'উত্তরা', nameEn: 'uttara', type: 'পলিটিক্যাল ক্যাডার', rate: '৳ ৮০০', mood: 'red', note: 'সেক্টর ৭ এ নতুন চেকপোস্ট' },
    { lat: 23.7507, lng: 90.3916, name: 'কারওয়ান বাজার', nameEn: 'karwan bazar', type: 'লোকাল সিন্ডিকেট', rate: '৳ ৩০০', mood: 'yellow', note: 'পণ্যবাহী ট্রাক ও পিকআপ থেকে চাঁদা' },
    { lat: 23.7509, lng: 90.4009, name: 'তেজগাঁও', nameEn: 'tejgaon', type: 'ট্রাক টার্মিনাল সিন্ডিকেট', rate: '৳ ১৫০', mood: 'green', note: 'ইন্ডাস্ট্রিয়াল এলাকায় পার্কিং ফি এর নামে' },
    // Real-world reported highway/terminal spots
    { lat: 23.7837, lng: 90.3442, name: 'গাবতলী বাস টার্মিনাল', nameEn: 'gabtoli', type: 'মালিক-শ্রমিক সমিতি', rate: '৳ ১,২০০', mood: 'red', note: 'টার্মিনালে না থামলেও পার্কিং ফি দিতে হয়' },
    { lat: 23.7877, lng: 90.3344, name: 'আমিনবাজার', nameEn: 'aminbazar', type: 'লোকাল সিন্ডিকেট', rate: '৳ ৪০০', mood: 'yellow', note: 'পণ্যবাহী ট্রাকে চাঁদাবাজি' },
    { lat: 23.7153, lng: 90.4284, name: 'সায়েদাবাদ বাস টার্মিনাল', nameEn: 'sayedabad', type: 'পলিটিক্যাল ক্যাডার', rate: '৳ ১,৫০০', mood: 'red', note: 'বাস প্রতি নির্ধারিত চাঁদা ছাড়া ছাড়তে পারে না' },
    { lat: 24.5828, lng: 90.3955, name: 'ত্রিশাল (দরিরামপুর)', nameEn: 'trishal', type: 'হাইওয়ে পুলিশ ও লোকাল', rate: '৳ ৫০০', mood: 'red', note: 'ঢাকা-ময়মনসিংহ মহাসড়কে বাস-ট্রাক থেকে চাঁদা' },
    { lat: 24.7628, lng: 90.4121, name: 'ময়মনসিংহ পাটগুদাম', nameEn: 'mymensingh patgudam', type: 'টার্মিনাল সিন্ডিকেট', rate: '৳ ৬০০', mood: 'red', note: 'ময়মনসিংহ শহরের পাটগুদাম সেতু মোড়ে' },
    { lat: 23.5186, lng: 90.9631, name: 'ইলিয়টগঞ্জ, কুমিল্লা', nameEn: 'eliotganj', type: 'হাইওয়ে সিন্ডিকেট', rate: '৳ ১,০০০', mood: 'yellow', note: 'ঢাকা-চট্টগ্রাম মহাসড়কে কাভার্ড ভ্যান টার্গেট' },
    { lat: 24.6738, lng: 89.4182, name: 'শেরপুর, বগুড়া', nameEn: 'sherpur bogura', type: 'শ্রমিক সংগঠন', rate: '৳ ৮০০', mood: 'red', note: 'ঢাকা-বগুড়া মহাসড়কে ভারী পণ্যবাহী ট্রাকে চাঁদা' },
    { lat: 24.3970, lng: 89.7711, name: 'বঙ্গবন্ধু সেতু এপ্রোচ', nameEn: 'bangabandhu bridge tangail', type: 'হাইওয়ে চাঁদাবাজ', rate: '৳ ২,০০০', mood: 'red', note: 'টাঙ্গাইল প্রান্তে সেতু পারাপারকারী ট্রাকে মোটা অংকের চাঁদা' },
    { lat: 22.2965, lng: 91.9782, name: 'পটিয়া বাইপাস', nameEn: 'potiya', type: 'লোকাল সিন্ডিকেট', rate: '৳ ৫০০', mood: 'yellow', note: 'চট্টগ্রাম-কক্সবাজার মহাসড়কে সিএনজি ও বাস থেকে' }
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
    return `
    <div style="font-family:Inter,sans-serif;line-height:1.6;min-width:170px">
        <strong style="font-size:14px">📍 ${s.name}</strong>
        <div style="font-size:12px;color:#666;margin:3px 0">${s.type}</div>
        <div style="display:flex;align-items:center;gap:8px;margin:5px 0">
            <span style="font-size:16px;font-weight:700;color:#333">${s.rate}</span>
            <span style="font-size:11px;padding:2px 8px;border-radius:10px;background:${moodColors[s.mood]}20;color:${moodColors[s.mood]}">${moodLabels[s.mood]}</span>
        </div>
        ${s.note ? `<div style="font-size:11px;color:#888;font-style:italic">${s.note}</div>` : ''}
        ${s.source === 'firestore' ? '<div style="margin-top:4px;font-size:10px;color:#4a9b9b">✅ ভেরিফাইড রিপোর্ট</div>' : ''}
        <div style="margin-top:10px; border-top:1px solid #ccc; padding-top:8px; text-align:center;">
            <button onclick="generateShareCard('${s.name}', '${s.rate}', '${s.type}')" 
                style="background:none; color:#1a73e8; border:1px solid #1a73e8; padding:4px 12px; border-radius:4px; font-size:11px; font-weight:bold; cursor:pointer; width:100%; transition:all 0.2s;">
                📸 অ্যালার্ট কার্ড ডাউনলোড
            </button>
        </div>
    </div>`;
}

// ===== LIVE MAP MARKERS (CLUSTERED) =====
const markersClusterGroup = L.markerClusterGroup({
    iconCreateFunction: function (cluster) {
        return L.divIcon({
            html: '<div style="background:var(--accent-dim); color:var(--text-primary); border:2px solid var(--accent); border-radius:50%; width:36px; height:36px; display:flex; align-items:center; justify-content:center; font-weight:bold; box-shadow:0 0 10px var(--accent-dim);">' + cluster.getChildCount() + '</div>',
            className: 'custom-cluster-icon',
            iconSize: L.point(36, 36)
        });
    },
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true
});
map.addLayer(markersClusterGroup);

// Add static markers
chandaSpots.forEach(s => {
    const marker = L.marker([s.lat, s.lng], { icon: makeIcon(moodColors[s.mood]) }).bindPopup(createPopup(s));
    marker.on('mouseover', function (e) { this.openPopup(); });
    markersClusterGroup.addLayer(marker);
});
// ===== TICKER LOGIC =====
function updateSpotsTicker() {
    const ticker = document.getElementById('spotsTicker');
    if (!ticker) return;
    if (allMapSpots.length === 0) {
        ticker.innerHTML = '<span class="ticker-item">✅ বর্তমানে কোনো চাঁদাবাজির স্পট রিপোর্ট নেই</span>';
        return;
    }
    // Duplicate the spots array 3 times to ensure a smooth infinite scroll without gaps on large screens
    const spotsForTicker = [...allMapSpots, ...allMapSpots, ...allMapSpots];
    ticker.innerHTML = spotsForTicker.map(s => `
        <span class="ticker-item" style="cursor:pointer" onclick="flyToSpot(${s.lat},${s.lng},'${s.name.replace(/'/g, "\\'")}')">
            <span class="mood-dot" style="background:${moodColors[s.mood]}; width:8px; height:8px;"></span>
            <strong>${s.name}</strong>
            <span style="opacity:0.6">|</span>
            <span style="color:${moodColors[s.mood]}">${s.rate}</span>
        </span>
    `).join('');
}

updateSpotsTicker();
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
    'গাবতলী': { lat: 23.7837, lng: 90.3442 }, 'gabtoli': { lat: 23.7837, lng: 90.3442 },
    'আমিনবাজার': { lat: 23.7877, lng: 90.3344 }, 'aminbazar': { lat: 23.7877, lng: 90.3344 },
    'মহাখালী': { lat: 23.7781, lng: 90.4010 }, 'mohakhali': { lat: 23.7781, lng: 90.4010 },
    'সায়েদাবাদ': { lat: 23.7153, lng: 90.4284 }, 'sayedabad': { lat: 23.7153, lng: 90.4284 },
    'চানখারপুল': { lat: 23.7258, lng: 90.3957 }, 'chankharpul': { lat: 23.7258, lng: 90.3957 },
    'টঙ্গী': { lat: 23.8932, lng: 90.3989 }, 'tongi': { lat: 23.8932, lng: 90.3989 },
    'কাঁচপুর': { lat: 23.7032, lng: 90.5218 }, 'kanchpur': { lat: 23.7032, lng: 90.5218 },
    'নারায়ণগঞ্জ': { lat: 23.6238, lng: 90.5000 }, 'narayanganj': { lat: 23.6238, lng: 90.5000 },
    'মুন্সিগঞ্জ': { lat: 23.5422, lng: 90.5305 }, 'munshiganj': { lat: 23.5422, lng: 90.5305 },
    'গাজীপুর': { lat: 23.9999, lng: 90.4203 }, 'gazipur': { lat: 23.9999, lng: 90.4203 },
    'সাভার': { lat: 23.8583, lng: 90.2667 }, 'savar': { lat: 23.8583, lng: 90.2667 },
    'কেরানীগঞ্জ': { lat: 23.6800, lng: 90.3200 }, 'keraniganj': { lat: 23.6800, lng: 90.3200 },
    'মানিকগঞ্জ': { lat: 23.8644, lng: 90.0047 }, 'manikganj': { lat: 23.8644, lng: 90.0047 },
    'নরসিংদী': { lat: 23.9193, lng: 90.7176 }, 'narsingdi': { lat: 23.9193, lng: 90.7176 },
    'ময়মনসিংহ': { lat: 24.7471, lng: 90.4203 }, 'mymensingh': { lat: 24.7471, lng: 90.4203 },
    'ত্রিশাল': { lat: 24.5828, lng: 90.3955 }, 'trishal': { lat: 24.5828, lng: 90.3955 },
    'বগুড়া': { lat: 24.8465, lng: 89.3778 }, 'bogura': { lat: 24.8465, lng: 89.3778 },
    'শেরপুর': { lat: 24.6738, lng: 89.4182 }, 'sherpur': { lat: 24.6738, lng: 89.4182 },
    'কুমিল্লা': { lat: 23.4607, lng: 91.1809 }, 'cumilla': { lat: 23.4607, lng: 91.1809 },
    'পটিয়া': { lat: 22.2965, lng: 91.9782 }, 'potiya': { lat: 22.2965, lng: 91.9782 },
    'চট্টগ্রাম': { lat: 22.3569, lng: 91.7832 }, 'chattogram': { lat: 22.3569, lng: 91.7832 },
    'কক্সবাজার': { lat: 21.9497, lng: 92.1466 }, 'coxs bazar': { lat: 21.9497, lng: 92.1466 }, "cox's bazar": { lat: 21.9497, lng: 92.1466 },
    'নাটোর': { lat: 24.4102, lng: 89.0076 }, 'natore': { lat: 24.4102, lng: 89.0076 }
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
    dynamicMarkers.forEach(m => markersClusterGroup.removeLayer(m));
    dynamicMarkers = [];
    // Remove old dynamic spots from allMapSpots
    allMapSpots = [...chandaSpots];

    snapshot.docs.forEach(doc => {
        const r = doc.data();
        let coords;
        if (r.exactLat && r.exactLng) {
            coords = { lat: r.exactLat, lng: r.exactLng };
        } else {
            coords = findCoords(r.location || '');
        }
        const spot = {
            lat: coords.lat,
            lng: coords.lng,
            name: r.location || 'অজানা',
            type: r.collectorType || '-',
            rate: '৳ ' + (r.currentRate || 0).toLocaleString('bn-BD'),
            mood: r.mood || 'green',
            note: [r.description, r.vipCode].filter(Boolean).join(' - ') || '',
            source: 'firestore'
        };
        allMapSpots.push(spot);
        const marker = L.marker([spot.lat, spot.lng], { icon: makeIcon(moodColors[spot.mood], 14) }).bindPopup(createPopup(spot));
        marker.on('mouseover', function (e) { this.openPopup(); });
        markersClusterGroup.addLayer(marker);
        dynamicMarkers.push(marker);
    });
    updateHeatmap();
    updateSpotsTicker();
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
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.type && s.type.toLowerCase().includes(q)) ||
        (s.nameEn && s.nameEn.toLowerCase().includes(q)) ||
        (s.note && s.note.toLowerCase().includes(q)) ||
        (s.location && s.location.toLowerCase().includes(q))
    );

    if (matches.length === 0) {
        searchResults.innerHTML = `
            <div class="search-result-item" style="flex-direction:column; align-items:center; gap:8px; padding:16px;">
                <div style="color:var(--text-tertiary)">❌ কোনো রিপোর্ট পাওয়া যায়নি</div>
                <button type="button" class="btn-secondary" style="padding:6px 16px; font-size:13px; margin-top:8px;" onclick="searchLocation()">
                    📍 '${q}' ম্যাপে দেখুন
                </button>
            </div>
        `;
    } else {
        searchResults.innerHTML = matches.slice(0, 15).map(s => {
            const docId = s.name.replace(/\//g, '_');
            const votes = window.spotVotesObj ? (window.spotVotesObj[docId] || { upvotes: 0, downvotes: 0 }) : { upvotes: 0, downvotes: 0 };
            return `<div class="search-result-item" style="flex-direction:column; align-items:flex-start; gap:8px;">
        <div style="display:flex; align-items:center; gap:8px; cursor:pointer; width:100%;" onclick="flyToSpot(${s.lat},${s.lng},'${s.name}')">
            <span class="mood-dot" style="background:${moodColors[s.mood]}"></span>
            <span><strong>${s.name}</strong> - ${s.type} - ${s.rate}</span>
        </div>
        ${s.note ? `<div style="font-size:11px; color:var(--text-tertiary); margin-left:16px; white-space:normal; line-height:1.4;">📝 ${s.note}</div>` : ''}
        <div style="display:flex; justify-content:space-between; width:100%; margin-top:4px; padding-left:16px;">
            <div style="display:flex; gap:8px;">
                <button type="button" class="btn-vote" onclick="voteResult('${s.name}', 'up', event)">👍 ঠিক <span style="opacity:0.7;margin-left:3px">${votes.upvotes}</span></button>
                <button type="button" class="btn-vote" onclick="voteResult('${s.name}', 'down', event)">👎 ভুল <span style="opacity:0.7;margin-left:3px">${votes.downvotes}</span></button>
            </div>
            <button type="button" class="btn-secondary" style="padding:4px 8px; font-size:11px;" onclick="reportAtSpot(${s.lat},${s.lng},'${s.name}')">📍 রিপোর্ট করুন</button>
        </div>
      </div>`
        }).join('');
    }
    searchResults.classList.add('show');
});

window.reportAtSpot = function (lat, lng, name) {
    document.getElementById('mapSearchInput').value = name;
    document.getElementById('searchResults').classList.remove('show');

    // Fill report form
    document.getElementById('location').value = name;

    // Set on main map
    map.flyTo([lat, lng], 15);
    reportMarker.setLatLng([lat, lng]);
    document.getElementById('exactLat').value = lat;
    document.getElementById('exactLng').value = lng;

    document.getElementById('report').scrollIntoView({ behavior: 'smooth' });
}

window.reportNewLocation = async function (locName) {
    document.getElementById('mapSearchInput').value = locName;
    document.getElementById('searchResults').classList.remove('show');
    document.getElementById('location').value = locName;

    // Attempt to fly to the location
    const coords = findCoords(locName);
    let flyLat = coords.lat, flyLng = coords.lng;

    // Check if it's the random center offset
    if (Math.abs(flyLat - 23.7644) <= 0.03 && Math.abs(flyLng - 90.3893) <= 0.03) {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locName + ', Bangladesh')}&limit=1`);
            const data = await res.json();
            if (data && data.length > 0) {
                flyLat = parseFloat(data[0].lat);
                flyLng = parseFloat(data[0].lon);
            }
        } catch (e) { }
    }

    map.flyTo([flyLat, flyLng], 15, { animate: true, duration: 1.2 });
    reportMarker.setLatLng([flyLat, flyLng]);
    updateHiddenInputs(flyLat, flyLng);

    document.getElementById('report').scrollIntoView({ behavior: 'smooth' });
    showToast('📍 ম্যাপে জায়গাটি পিন করুন এবং ফর্মটি পূরণ করুন।');
}

window.spotVotesObj = {};
if (typeof db !== 'undefined') {
    db.collection('spot_votes').onSnapshot(snapshot => {
        snapshot.docs.forEach(doc => {
            window.spotVotesObj[doc.id] = doc.data();
        });
        // Re-render search if open to show updated votes
        if (searchInput.value.trim().length >= 2 && searchResults.classList.contains('show')) {
            searchInput.dispatchEvent(new Event('input'));
        }
    });
}

window.voteResult = async function (name, type, e) {
    e.stopPropagation();
    const btn = e.target;
    // Keep a reference to the span to re-inject later
    const docId = name.replace(/\//g, '_');
    const votes = window.spotVotesObj ? (window.spotVotesObj[docId] || { upvotes: 0, downvotes: 0 }) : { upvotes: 0, downvotes: 0 };
    let newUp = votes.upvotes + (type === 'up' ? 1 : 0);
    let newDown = votes.downvotes + (type === 'down' ? 1 : 0);

    btn.innerHTML = type === 'up' ? `✅ ধন্যবাদ! <span style="opacity:0.7;margin-left:3px">${newUp}</span>` : `🙏 রিভিউ করব <span style="opacity:0.7;margin-left:3px">${newDown}</span>`;
    btn.style.borderColor = type === 'up' ? 'var(--neon-green)' : 'var(--danger-red)';
    btn.style.color = type === 'up' ? 'var(--neon-green)' : 'var(--danger-red)';

    // Persistence
    if (typeof db !== 'undefined') {
        const docRef = db.collection('spot_votes').doc(docId);
        try {
            await db.runTransaction(async (transaction) => {
                const doc = await transaction.get(docRef);
                if (!doc.exists) {
                    transaction.set(docRef, { upvotes: type === 'up' ? 1 : 0, downvotes: type === 'down' ? 1 : 0 });
                } else {
                    const currentUp = doc.data().upvotes || 0;
                    const currentDown = doc.data().downvotes || 0;
                    transaction.update(docRef, {
                        upvotes: currentUp + (type === 'up' ? 1 : 0),
                        downvotes: currentDown + (type === 'down' ? 1 : 0)
                    });
                }
            });
        } catch (err) { console.error('Vote err', err); }
    }

    setTimeout(() => {
        btn.innerHTML = type === 'up' ? `👍 ঠিক <span style="opacity:0.7;margin-left:3px">${newUp}</span>` : `👎 ভুল <span style="opacity:0.7;margin-left:3px">${newDown}</span>`;
        btn.style.borderColor = 'var(--border)';
        btn.style.color = 'var(--text-secondary)';
    }, 2000);

    if (type === 'up') showToast(`👍 '${name}' এর তথ্যের সত্যতা নিশ্চিত করার জন্য ধন্যবাদ!`);
    else showToast(`👎 '${name}' এর তথ্যটি আমরা আবার ভেরিফাই করব।`);
}

searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); searchLocation(); } });
document.addEventListener('click', e => { if (!e.target.closest('.map-search-bar')) searchResults.classList.remove('show'); });

let tempSearchMarker = null;

async function searchLocation() {
    const q = searchInput.value.trim().toLowerCase();
    if (!q) return;

    if (tempSearchMarker) {
        map.removeLayer(tempSearchMarker);
        tempSearchMarker = null;
    }

    const searchBtn = searchInput.nextElementSibling;
    const btnText = searchBtn.innerText;

    const match = allMapSpots.find(s => s.name.toLowerCase().includes(q) || (s.nameEn && s.nameEn.toLowerCase().includes(q)));
    if (match) {
        flyToSpot(match.lat, match.lng, match.name);
        return;
    }

    // Geocoding Fallback
    searchBtn.innerText = '⏳ খুঁজছি...';
    searchBtn.disabled = true;
    searchResults.classList.remove('show');

    // First check hardcoded known area coords
    const coords = findCoords(q);
    const isRandomOffset = (Math.abs(coords.lat - 23.7644) <= 0.06 && Math.abs(coords.lng - 90.3893) <= 0.06);

    if (!isRandomOffset) {
        flyToUnknownSpot(coords.lat, coords.lng, searchInput.value.trim());
        searchBtn.innerText = btnText;
        searchBtn.disabled = false;
        return;
    }

    // Nominatim fallback
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q + ', Bangladesh')}&limit=1`);
        const data = await res.json();

        if (data && data.length > 0) {
            flyToUnknownSpot(parseFloat(data[0].lat), parseFloat(data[0].lon), searchInput.value.trim());
        } else {
            showToast('❌ "' + searchInput.value.trim() + '" লোকেশনটি ম্যাপে পাওয়া যায়নি।', true);
        }
    } catch (err) {
        showToast('❌ নেটওয়ার্ক ত্রুটি, লোকেশন খোঁজা সম্ভব হয়নি।', true);
    }

    searchBtn.innerText = btnText;
    searchBtn.disabled = false;
}

function flyToUnknownSpot(lat, lng, name) {
    map.flyTo([lat, lng], 15, { animate: true, duration: 1.2 });

    // Add a temporary marker for the searched location
    if (tempSearchMarker) map.removeLayer(tempSearchMarker);
    tempSearchMarker = L.marker([lat, lng], {
        icon: L.divIcon({
            className: 'search-marker',
            html: '<div style="font-size:24px; filter:drop-shadow(0 4px 6px rgba(0,0,0,0.3))">📌</div>',
            iconSize: [24, 24], iconAnchor: [12, 24]
        })
    }).addTo(map);

    tempSearchMarker.bindPopup(`
        <div style="font-family:Inter;text-align:center;">
            <strong>${name}</strong><br/>
            <span style="color:var(--text-tertiary);font-size:12px">এখানে কোনো রিপোর্ট নেই</span><br/>
            <button onclick="reportNewLocation('${name}')" style="margin-top:8px;padding:4px 8px;font-size:11px;background:var(--accent);color:#fff;border:none;border-radius:4px;cursor:pointer;">📍 রিপোর্ট করুন</button>
        </div>
    `).openPopup();

    document.getElementById('map').scrollIntoView({ behavior: 'smooth' });
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

// ===== REPORT MARKER ON MAIN MAP =====
let reportMarker = L.marker([23.7644, 90.3893], { draggable: true, icon: makeIcon(moodColors.red, 16) }).addTo(map);

function updateHiddenInputs(lat, lng) {
    document.getElementById('exactLat').value = lat;
    document.getElementById('exactLng').value = lng;
}

// Initial update
updateHiddenInputs(23.7644, 90.3893);

reportMarker.on('dragend', function (e) {
    const { lat, lng } = e.target.getLatLng();
    updateHiddenInputs(lat, lng);
});

map.on('click', function (e) {
    // Only place marker if we are somewhat zoomed in, to avoid accidental clicks when viewing the whole city
    reportMarker.setLatLng(e.latlng);
    updateHiddenInputs(e.latlng.lat, e.latlng.lng);

    // Only scroll to the form if the user isn't holding shift (to allow easy continuous mapping)
    if (!e.originalEvent.shiftKey) {
        document.getElementById('report').scrollIntoView({ behavior: 'smooth' });
    }
});

const getPos = (options) => new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, options));

window.getUserLocation = async function () {
    const btn = document.getElementById('gpsBtn');
    if (!navigator.geolocation) {
        showToast('❌ আপনার ব্রাউজার GPS সাপোর্ট করে না।', true);
        return;
    }
    btn.innerHTML = '⏳ জিপিএস খোঁজা হচ্ছে...';

    try {
        // Try high accuracy first (max 8 seconds)
        let pos = await getPos({ enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }).catch(async (e) => {
            console.warn("High accuracy GPS failed, falling back to network location...", e);
            // Fall back to low accuracy (network/wifi triangulation) with 15s timeout
            return await getPos({ enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 });
        });

        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        map.flyTo([lat, lng], 15);
        reportMarker.setLatLng([lat, lng]);
        document.getElementById('exactLat').value = lat;
        document.getElementById('exactLng').value = lng;
        document.getElementById('map').scrollIntoView({ behavior: 'smooth' });

        try {
            // Reverse Geocoding via Nominatim OpenStreetMap
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`);
            const data = await res.json();
            if (data && data.address) {
                const area = data.address.suburb || data.address.city_district || data.address.town || data.address.village || data.address.county || data.address.city;
                if (area) {
                    document.getElementById('location').value = area;
                }
            }
        } catch (e) { console.error('Geocoding error', e); }

        btn.innerHTML = '✅ অবস্থান পাওয়া গেছে';
        setTimeout(() => btn.innerHTML = '📡 আমার অবস্থান', 3000);

    } catch (err) {
        console.error("GPS completely failed:", err);
        let msg = '❌ লোকেশন অ্যাক্সেস দেওয়া হয়নি বা সিগন্যাল নেই।';
        if (err.code === 3) msg = '❌ লাইভ নেটওয়ার্ক টাইমআউট! আবার চেষ্টা করুন।';
        if (err.code === 2) msg = '❌ আপনার ডিভাইসে জিপিএস বন্ধ আছে বা সিগন্যাল নেই।';
        if (err.code === 1) msg = '❌ ব্রাউজার সেটিংসে লোকেশন পারমিশন দিন।';
        showToast(msg, true);
        btn.innerHTML = '📡 আমার অবস্থান';
    }
};

// ===== FORM → FIRESTORE =====
function sanitize(s) { return s.replace(/[<>]/g, '').trim().slice(0, 500); }
let pendingReportData = null;

document.getElementById('reportForm').addEventListener('submit', async e => {
    e.preventDefault();
    const locationStr = sanitize(document.getElementById('location').value);
    const exactLat = parseFloat(document.getElementById('exactLat').value);
    const exactLng = parseFloat(document.getElementById('exactLng').value);

    const collectorType = document.getElementById('collectorType').value;
    const currentRate = Math.min(Math.max(parseInt(document.getElementById('currentRate').value) || 0, 0), 999999);
    const mood = document.querySelector('input[name="mood"]:checked');
    const vipCode = sanitize(document.getElementById('vipCode').value);
    const description = sanitize(document.getElementById('description').value);

    if (isNaN(exactLat) || isNaN(exactLng) || !collectorType || !currentRate || !mood) { showToast('⚠️ ম্যাপে স্থান টিক করুন এবং সব আবশ্যিক ফিল্ড পূরণ করুন!', true); return; }

    pendingReportData = {
        location: locationStr || 'অজানা এলাকা',
        exactLat: exactLat,
        exactLng: exactLng,
        collectorType: collectorType,
        currentRate: currentRate,
        mood: mood.value,
        vipCode: vipCode || '',
        description: description || '',
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        status: 'pending'
    };

    document.getElementById('confirmSubmitModal').style.display = 'flex';
});

document.getElementById('finalSubmitBtn').addEventListener('click', () => {
    if (!pendingReportData) return;

    document.getElementById('confirmSubmitModal').style.display = 'none';
    const btn = document.getElementById('submitBtn');
    btn.textContent = '⏳ পাঠানো হচ্ছে...'; btn.disabled = true;

    db.collection('reports').add(pendingReportData)
        .then(() => {
            showToast("✅ স্পট রিপোর্ট সফলভাবে জমা হয়েছে।", false);
            document.getElementById('reportForm').reset();
            localStorage.removeItem('chandaMapDraft');
            document.getElementById('reportForm').style.display = 'none';
            document.getElementById('formSuccessMsg').style.display = 'block';
            pendingReportData = null;
        }).catch((error) => {
            showToast("❌ এরর: " + error.message, true);
            btn.disabled = false;
            btn.innerHTML = '📤 রিপোর্ট জমা দিন';
        });
});

// ===== AUTO-SAVE DRAFT =====
function saveDraft() {
    const draft = {
        location: document.getElementById('location').value,
        exactLat: document.getElementById('exactLat').value,
        exactLng: document.getElementById('exactLng').value,
        collectorType: document.getElementById('collectorType').value,
        currentRate: document.getElementById('currentRate').value,
        mood: document.querySelector('input[name="mood"]:checked')?.value || '',
        vipCode: document.getElementById('vipCode').value,
        description: document.getElementById('description').value
    };
    localStorage.setItem('chandaMapDraft', JSON.stringify(draft));
}

function loadDraft() {
    const draftStr = localStorage.getItem('chandaMapDraft');
    if (draftStr) {
        try {
            const draft = JSON.parse(draftStr);
            if (draft.location) document.getElementById('location').value = draft.location;
            if (draft.exactLat && draft.exactLng) {
                document.getElementById('exactLat').value = draft.exactLat;
                document.getElementById('exactLng').value = draft.exactLng;
                reportMarker.setLatLng([draft.exactLat, draft.exactLng]);
            }
            if (draft.collectorType) document.getElementById('collectorType').value = draft.collectorType;
            if (draft.currentRate) document.getElementById('currentRate').value = draft.currentRate;
            if (draft.mood) {
                const moodOpt = document.querySelector(`input[name="mood"][value="${draft.mood}"]`);
                if (moodOpt) moodOpt.checked = true;
            }
            if (draft.vipCode) document.getElementById('vipCode').value = draft.vipCode;
            if (draft.description) document.getElementById('description').value = draft.description;
        } catch (e) { }
    }
}

document.querySelectorAll('#reportForm input, #reportForm select, #reportForm textarea').forEach(el => {
    el.addEventListener('input', saveDraft);
    el.addEventListener('change', saveDraft);
});

window.addEventListener('load', loadDraft);

// ===== GENERATE SHARE CARD =====
window.generateShareCard = async function (name, rate, type) {
    const container = document.createElement('div');
    // Ensure fixed width/position so the card is always perfectly laid out off-screen
    container.style.position = 'fixed';
    container.style.top = '-9999px';
    container.style.left = '-9999px';
    container.style.width = '420px';
    container.style.padding = '30px';
    container.style.background = '#111827';
    container.style.zIndex = '-1';

    container.innerHTML = `
        <div style="font-family: 'Inter', sans-serif; text-align: center; color: #fff;">
            <div style="display:flex; justify-content:center; align-items:center; gap:8px; margin-bottom: 24px;">
                <svg width="24" height="24" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="40" height="40" rx="10" fill="#4a9b9b" />
                    <text x="16.5" y="24" font-family="Inter,sans-serif" font-size="14" font-weight="800" fill="white">৳</text>
                </svg>
                <div style="font-size: 16px; font-weight: 800; color: #4a9b9b; letter-spacing: 2px;">CHADAMAP.VERCEL.APP</div>
            </div>
            <div style="font-size: 20px; font-weight: 800; color: #ff2d2d; margin-bottom: 8px; text-transform: uppercase;">🚨 লাইভ রোড-ট্যাক্স অ্যালার্ট</div>
            <div style="font-size: 42px; font-weight: 900; margin-bottom: 12px; line-height:1.2;">📍 ${name}</div>
            <div style="font-size: 18px; color: #9ca3af; margin-bottom: 32px; background: rgba(255,255,255,0.05); display:inline-block; padding:8px 16px; border-radius:20px;">কালেক্টর: ${type}</div>
            <div style="background: rgba(255, 45, 45, 0.1); padding: 24px; border-radius: 16px; border: 2px solid #ff2d2d;">
                <div style="font-size: 14px; text-transform: uppercase; letter-spacing: 2px; color: #ff2d2d; margin-bottom: 8px;">বর্তমান রানিং রেট</div>
                <div style="font-size: 56px; font-weight: 900; color: #fff; letter-spacing:-1px;">${rate}</div>
            </div>
            <div style="margin-top: 32px; font-size: 12px; color: #6b7280;">এই কার্ড অটোমেটিক জেনারেট করা হয়েছে। বাস্তব ডেটার উপর ভিত্তি করে স্যাটায়ার।</div>
        </div>
    `;
    document.body.appendChild(container);

    showToast("কার্ড তৈরি হচ্ছে...", false);

    try {
        const canvas = await html2canvas(container, { backgroundColor: '#111827', scale: 2, useCORS: true });
        container.remove();

        const dataUrl = canvas.toDataURL('image/png');

        // Convert base64 to Blob for native sharing
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const file = new File([blob], `chanda_alert_${name.replace(/\s+/g, '_')}.png`, { type: 'image/png' });

        const triggerDownload = () => {
            const link = document.createElement('a');
            link.download = `chanda_alert_${name.replace(/\s+/g, '_')}.png`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast(`'${name}' এর অ্যালার্ট কার্ড তৈরি হয়েছে!`, false);
        };

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    title: 'Chanda Map Alert',
                    text: `Road Tax Alert for ${name}!`,
                    files: [file]
                });
                showToast(`অ্যালার্ট কার্ড শেয়ার করা হয়েছে!`, false);
            } catch (e) {
                if (e.name !== 'AbortError') triggerDownload();
            }
        } else {
            triggerDownload();
        }
    } catch (err) {
        console.error("Card generation failed", err);
        showToast("❌ কার্ড তৈরিতে সমস্যা হয়েছে।", true);
        if (container.parentNode) container.remove();
    }
};
// ===== SCROLL PROGRESS BAR =====
window.addEventListener('scroll', () => {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    if (height > 0) {
        document.getElementById('scrollProgress').style.width = (winScroll / height) * 100 + '%';
    }

    // Parallax
    const heroImage = document.getElementById('heroImage');
    if (heroImage && winScroll < window.innerHeight) {
        heroImage.style.transform = `translateY(${winScroll * 0.15}px)`;
    }
}, { passive: true });

window.resetFormView = function () {
    document.getElementById('formSuccessMsg').style.display = 'none';
    document.getElementById('reportForm').style.display = 'block';
};

// ===== TOAST NOTIFICATIONS =====
window.showToast = function (msg, error = false) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast-message ${error ? 'warning' : 'success'}`;
    const icon = error ? '⚠️' : '✅';
    toast.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-text">${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

// ===== AI EXCUSE GENERATOR =====
const excuses = [
    { emoji: '👮', text: '"ভাই আমার মামা DIG, ফোন করব?" - ৯৫% সাকসেস রেট' },
    { emoji: '🤕', text: '"দুই রাস্তা আগে পকেটমার লইয়া গেছে, ভাই খালি পকেট!" - ৬৮% সাকসেস' },
    { emoji: '🤰', text: '"বউ লেবারে, এখনই হসপিটাল যাইতে হবে!" - ৮৮% সাকসেস রেট' },
    { emoji: '📱', text: '"ভাই ক্যামেরা চালু আছে, লাইভে আছি!" - ৭৫% সাকসেস রেট' },
    { emoji: '🪪', text: '"আমি সাংবাদিক, প্রেস কার্ড দেখাই?" - ৬২% সাকসেস রেট' },
    { emoji: '😭', text: '"গতকাল চাকরি গেছে ভাই, বাচ্চার দুধের টাকাও নাই!" - ৭৯% সাকসেস রেট' },
    { emoji: '🤝', text: '"জামাল ভাইয়ের লোক আমি, চিনেন না?" - ৫৫% সাকসেস রেট (ভুল জামাল হলে 0%)' },
    { emoji: '🔧', text: '"গাড়ি খারাপ, টো করতেছি, ভাই একটু সহানুভূতি!" - ৪৫% সাকসেস রেট' },
    { emoji: '🤒', text: '"ভাই আমার জ্বর ১০৪, ডেঙ্গু হইতে পারে, কাছে আইসেন না!" - ৯২% সাকসেস রেট' },
    { emoji: '📞', text: '"থানায় ফোন করব? নাকি আমরা ভদ্রভাবে সমাধান করি?" - ৩৫% সাকসেস রেট (ব্যাকফায়ার ঝুঁকি)' },
    { emoji: '🎓', text: '"আমি মাদ্রাসার হুজুর, চাঁদা নিলে গুনাহ হবে ভাই!" - ৮৫% সাকসেস রেট' },
    { emoji: '🚑', text: '"অ্যাম্বুলেন্স পিছনে আসতেছে, রাস্তা ছাড়েন!" - ৭০% সাকসেস রেট' }
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
    if (pct > 80) { w.style.display = 'block'; w.textContent = '⚡ সার্জ প্রাইসিং শুরু হতে পারে - এখনই পালান!'; }
    else { w.style.display = 'none'; }
}
updateShiftTracker();
setInterval(updateShiftTracker, 1000);

// ===== CHANDA CALCULATOR =====
window.calculateChanda = function () {
    const v = document.getElementById('calcVehicle').value;
    const r = document.getElementById('calcRoute').value;
    const res = document.getElementById('calcResult').querySelector('span');

    let base = 0;
    if (v === 'bus') base = 500;
    if (v === 'truck') base = 800;
    if (v === 'cng') base = 100;
    if (v === 'private') base = 200;

    let multiplier = 1;
    if (r === 'city') multiplier = 1;
    if (r === 'highway') multiplier = 1.5;
    if (r === 'bridge') multiplier = 2.5;

    let total = Math.floor(base * multiplier);

    let cur = 0;
    const step = Math.max(10, Math.floor(total / 20));

    // Animate the result number
    const int = setInterval(() => {
        cur += step;
        if (cur >= total) {
            cur = total;
            clearInterval(int);
            res.style.transform = 'scale(1.1)';
            setTimeout(() => res.style.transform = 'scale(1)', 200);
        }
        res.innerHTML = `৳ ${cur.toLocaleString('bn-BD')}`;
    }, 30);
};

// ===== SATIRE POPUP ("Masud") =====
window.showSatirePopup = function () {
    const popup = document.getElementById('satirePopup');
    popup.style.display = 'flex';
    // Force reflow
    void popup.offsetWidth;
    popup.classList.add('show');
};

window.hideSatirePopup = function () {
    const popup = document.getElementById('satirePopup');
    popup.classList.remove('show');
    // Wait for transition to finish
    setTimeout(() => {
        popup.style.display = 'none';
    }, 300);
};

// ===== GO TO TOP BUTTON =====
const goTopBtn = document.getElementById('goTopBtn');
if (goTopBtn) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            goTopBtn.classList.add('show');
        } else {
            goTopBtn.classList.remove('show');
        }
    }, { passive: true });
}

// ===== LIVE CHANDA TICKER =====
function initChandaTicker() {
    const ticker = document.getElementById('liveChandaTicker');
    if (!ticker) return;

    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const millisInMonth = daysInMonth * 24 * 60 * 60 * 1000;

    // ... keeping the rest identical - replacing the end ...

    // ===== RIPPLE EFFECT =====
    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('.btn-primary, .btn-secondary').forEach(btn => {
            btn.classList.add('ripple-btn');
            btn.addEventListener('pointerdown', function (e) {
                const rect = btn.getBoundingClientRect();
                const diameter = Math.max(rect.width, rect.height);
                const radius = diameter / 2;

                const ripple = document.createElement('span');
                ripple.style.width = ripple.style.height = `${diameter}px`;
                ripple.style.left = `${e.clientX - rect.left - radius}px`;
                ripple.style.top = `${e.clientY - rect.top - radius}px`;
                ripple.classList.add('ripple');

                const existing = btn.getElementsByClassName('ripple')[0];
                if (existing) existing.remove();

                btn.appendChild(ripple);
            });
        });
    });

    // Monthly Target: 100 Crore BDT (1,000,000,000)
    const monthlyTarget = 1000000000;

    // Calculate precise milliseconds passed this month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const elapsedMillis = now.getTime() - startOfMonth;

    // Calculate real-time exact amount based on proportion of month passed
    let totalChanda = Math.floor((elapsedMillis / millisInMonth) * monthlyTarget);

    // Amount per 80ms interval
    const ratePerInterval = (monthlyTarget / millisInMonth) * 80;

    // Fast-ticking interval to show real-time "collection" accurately
    setInterval(() => {
        totalChanda += ratePerInterval;
        ticker.textContent = '৳ ' + Math.floor(totalChanda).toLocaleString('bn-BD');
    }, 80);
}
initChandaTicker();
