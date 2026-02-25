// ===== ADMIN AUTH =====
const ADMIN_HASH = '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'; // sha256 of 'password'

async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Lock dashboard on load
document.addEventListener('DOMContentLoaded', () => {
    const layout = document.querySelector('.dashboard-layout');
    const overlay = document.getElementById('adminAuthOverlay');
    if (layout) layout.classList.add('locked');

    // Check if already authenticated in this session
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
        const layout = document.querySelector('.dashboard-layout');
        const overlay = document.getElementById('adminAuthOverlay');
        layout.classList.remove('locked');
        overlay.classList.add('authenticated');
        sessionStorage.setItem('chandamap_admin', 'true');
        showToast('✅ অ্যাডমিন অ্যাক্সেস সফল! স্বাগতম, বস।');
    } else {
        errEl.style.display = 'block';
        document.getElementById('adminPassword').value = '';
        document.getElementById('adminPassword').style.borderColor = '#ff2d2d';
        setTimeout(() => { errEl.style.display = 'none'; }, 3000);
    }
});

document.getElementById('adminPassword').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') document.getElementById('adminLoginBtn').click();
});

// ===== NAVBAR SCROLL EFFECT =====
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
});

// ===== HAMBURGER MENU =====
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('open');
});

// Close mobile menu on link click
navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navLinks.classList.remove('open');
    });
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

// Intersection Observer for counters
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

// ===== FORM SUBMISSION =====
const reportForm = document.getElementById('reportForm');
const toast = document.getElementById('toast');
const toastMsg = document.getElementById('toastMsg');

reportForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const location = document.getElementById('location').value;
    const type = document.getElementById('collectorType').value;
    const rate = document.getElementById('currentRate').value;
    const mood = document.querySelector('input[name="mood"]:checked');

    if (!location || !type || !rate || !mood) {
        showToast('⚠️ সব ফিল্ড পূরণ করুন!', true);
        return;
    }

    // Simulate submission
    const btn = document.getElementById('submitBtn');
    btn.textContent = '⏳ পাঠানো হচ্ছে...';
    btn.disabled = true;

    setTimeout(() => {
        showToast('✅ রিপোর্ট সফলভাবে অ্যাডমিনকে পাঠানো হয়েছে! ম্যাপে শীঘ্রই যোগ হবে।');
        reportForm.reset();
        btn.textContent = '📤 ভেরিফিকেশনের জন্য অ্যাডমিনকে পাঠান';
        btn.disabled = false;
    }, 1500);
});

function showToast(message, isError = false) {
    toastMsg.textContent = message;
    toast.style.borderColor = isError ? '#ff2d2d' : '#39ff14';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4000);
}

// ===== DASHBOARD TABLE BUTTONS =====
document.querySelectorAll('.btn-verify').forEach(btn => {
    btn.addEventListener('click', function () {
        const row = this.closest('tr');
        this.textContent = '✅ ভেরিফাইড';
        this.style.background = '#39ff14';
        this.style.color = '#0a0a0f';
        this.disabled = true;
        row.style.opacity = '0.5';
        showToast('✅ রিপোর্ট ভেরিফাই হয়েছে — লাইভ ম্যাপে যোগ করা হচ্ছে!');
    });
});

document.querySelectorAll('.btn-reject').forEach(btn => {
    btn.addEventListener('click', function () {
        const row = this.closest('tr');
        this.textContent = '❌ রিজেক্টেড';
        this.style.background = '#ff2d2d';
        this.style.color = '#fff';
        this.disabled = true;
        row.style.opacity = '0.3';
        row.style.textDecoration = 'line-through';
        showToast('❌ ফেক রিপোর্ট রিজেক্ট করা হয়েছে!', true);
    });
});

// ===== SIDEBAR NAV =====
document.querySelectorAll('.sidebar-nav a').forEach(link => {
    link.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelectorAll('.sidebar-nav a').forEach(l => l.classList.remove('active'));
        this.classList.add('active');
    });
});

// ===== HEATMAP TOGGLE =====
const syndicateToggle = document.getElementById('syndicateToggle');
syndicateToggle.addEventListener('change', function () {
    if (this.checked) {
        showToast('⚠️ সিন্ডিকেটদের সাথে লাইভ ডেটা শেয়ারিং চালু — দায়িত্ব আপনার!', true);
    } else {
        showToast('✅ ডেটা শেয়ারিং বন্ধ করা হয়েছে।');
    }
});

// ===== GOD MODE BUTTONS =====
document.getElementById('btnPolice').addEventListener('click', () => {
    showToast('🚔 পুলিশ রেইড অ্যালার্ট ট্রিগার করা হয়েছে! সব চেকপোস্টে নোটিফিকেশন পাঠানো হচ্ছে...');
});

document.getElementById('btnSurge').addEventListener('click', () => {
    showToast('📈 সার্জ প্রাইসিং ব্রডকাস্ট — সব স্পটে রেট ২৫% বাড়ানো হয়েছে!', true);
});

document.getElementById('btnVip').addEventListener('click', () => {
    showToast('👑 ভিআইপি মামা ওভাররাইড অ্যাক্টিভেটেড — সব চেকপোস্ট ১ ঘণ্টার জন্য ফ্রি পাস!');
});

// ===== DOWNLOAD APP BUTTON =====
document.getElementById('downloadBtn').addEventListener('click', () => {
    showToast('📲 শীঘ্রই আসছে! Play Store ও App Store-এ — স্টে টিউনড!');
});

// ===== SMOOTH SCROLL FOR NAV LINKS =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});
