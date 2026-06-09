// ms-tech-solution/frontend/js/main.js
// API BASE URL
const API_BASE_URL = 'http://127.0.0.1:8001';

// Visitor ID
if (!localStorage.getItem('visitor_id')) {
    localStorage.setItem('visitor_id', 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9));
}

// Visitor Tracking
async function trackVisitor() {
    if (sessionStorage.getItem('tracked')) return;
    sessionStorage.setItem('tracked', 'yes');
    const userAgent = navigator.userAgent;
    let device = 'desktop';
    if (/mobile/i.test(userAgent)) device = 'mobile';
    if (/tablet/i.test(userAgent)) device = 'tablet';
    let browser = 'Unknown';
    if (/chrome/i.test(userAgent)) browser = 'Chrome';
    else if (/firefox/i.test(userAgent)) browser = 'Firefox';
    else if (/safari/i.test(userAgent)) browser = 'Safari';
    else if (/edge/i.test(userAgent)) browser = 'Edge';
    let os = 'Unknown';
    if (/windows/i.test(userAgent)) os = 'Windows';
    else if (/mac/i.test(userAgent)) os = 'Mac';
    else if (/android/i.test(userAgent)) os = 'Android';
    else if (/ios|iphone|ipad/i.test(userAgent)) os = 'iOS';
    try {
        await fetch(`${API_BASE_URL}/api/track`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ page: window.location.pathname, referrer: document.referrer, device, browser, os })
        });
    } catch (err) { console.log('Tracking skipped'); }
}
trackVisitor();

// Mobile Menu
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const navMenu = document.querySelector('.nav-menu');
if (mobileMenuBtn && navMenu) {
    mobileMenuBtn.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        mobileMenuBtn.classList.toggle('active');
    });
}

// Smooth Scroll
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');
const header = document.querySelector('.header');

window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
        if (scrollY >= section.offsetTop - 100) current = section.getAttribute('id');
    });
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) link.classList.add('active');
    });
    if (header) header.style.background = scrollY > 50 ? 'rgba(15, 42, 74, 0.98)' : 'rgba(15, 42, 74, 0.95)';
});

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            navMenu?.classList.remove('active');
            mobileMenuBtn?.classList.remove('active');
        }
    });
});

// ============================================
// CHATBOT - CLEAN SIMPLE VERSION
// ============================================
const chatToggle = document.getElementById('chatToggle');
const chatBox = document.getElementById('chatBox');
const chatClose = document.getElementById('chatClose');
const chatMessages = document.getElementById('msgs');
const chatInput = document.getElementById('chatIn');
const chatSend = document.getElementById('chatBtn');

// Toggle open/close
chatToggle?.addEventListener('click', () => {
    if (chatBox.style.display === 'none' || chatBox.style.display === '') {
        chatBox.style.display = 'flex';
    } else {
        chatBox.style.display = 'none';
    }
});

chatClose?.addEventListener('click', () => {
    chatBox.style.display = 'none';
});

// Add message to chat
function addMessage(text, isUser = false) {
    if (!chatMessages) return;
    const div = document.createElement('div');
    div.className = isUser ? 'user-message' : 'bot-message';
    div.style.cssText = 'opacity:1!important;transform:none!important;animation:none!important;';
    div.textContent = text;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Send message
async function sendMessage() {
    const message = chatInput?.value.trim();
    if (!message) return;

    addMessage(message, true);
    chatInput.value = '';
    addMessage('Typing...', false);

    try {
        const response = await fetch(`${API_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: localStorage.getItem('visitor_id'),
                message: message
            })
        });

        const lastMsg = chatMessages.lastElementChild;
        if (lastMsg && lastMsg.textContent === 'Typing...') lastMsg.remove();

        if (response.ok) {
            const data = await response.json();
            addMessage(data.response, false);
        } else {
            addMessage('⚠️ Connection issue. WhatsApp: +92 310 3888922', false);
        }
    } catch (err) {
        const lastMsg = chatMessages.lastElementChild;
        if (lastMsg && lastMsg.textContent === 'Typing...') lastMsg.remove();
        addMessage('⚠️ Connection issue. WhatsApp: +92 310 3888922', false);
    }
}

// Send button click
chatSend?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    sendMessage();
});

// Enter key
chatInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        sendMessage();
    }
});

// Quick replies
document.querySelectorAll('.quick-replies button').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const msg = btn.getAttribute('data-msg');
        if (msg && chatInput) {
            chatInput.value = msg;
            sendMessage();
        }
    });
});

// ============================================
// CONTACT FORM
// ============================================
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = {
            name: document.getElementById('name')?.value || '',
            email: document.getElementById('email')?.value || '',
            phone: document.getElementById('phone')?.value || '',
            service: document.getElementById('service')?.value || '',
            message: document.getElementById('message')?.value || ''
        };
        const btn = contactForm.querySelector('.btn-submit');
        const originalText = btn.textContent;
        btn.textContent = 'Sending...';
        btn.disabled = true;
        try {
            const response = await fetch(`${API_BASE_URL}/api/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (response.ok) {
                alert('✅ Message sent! We will contact you within 1 hour.');
                contactForm.reset();
            } else throw new Error('Server error');
        } catch (err) {
            alert('📋 We received your message! We will contact you on WhatsApp.');
            contactForm.reset();
        }
        btn.textContent = originalText;
        btn.disabled = false;
    });
}

// ============================================
// REVIEW FORM
// ============================================
let currentRating = 0;
const starsContainer = document.querySelector('.stars');
if (starsContainer) {
    starsContainer.addEventListener('click', function(e) {
        const rect = this.getBoundingClientRect();
        const rating = Math.ceil((e.clientX - rect.left) / (rect.width / 5));
        currentRating = Math.min(5, Math.max(1, rating));
        this.textContent = '★'.repeat(currentRating) + '☆'.repeat(5 - currentRating);
        this.classList.add('active');
        const ratingInput = document.getElementById('reviewRating');
        if (ratingInput) ratingInput.value = currentRating;
    });
}

const reviewForm = document.getElementById('reviewForm');
if (reviewForm) {
    reviewForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const rating = parseInt(document.getElementById('reviewRating')?.value || 0);
        if (rating === 0) { alert('⭐ Please select a rating'); return; }
        const reviewData = {
            client_name: document.getElementById('reviewName')?.value || '',
            rating: rating,
            review_text: document.getElementById('reviewText')?.value || '',
            whatsapp: document.getElementById('reviewWhatsapp')?.value || ''
        };
        const btn = reviewForm.querySelector('button[type="submit"]');
        const originalText = btn.textContent;
        btn.textContent = 'Submitting...';
        btn.disabled = true;
        try {
            const response = await fetch(`${API_BASE_URL}/api/review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reviewData)
            });
            if (response.ok) {
                alert('⭐ Thank you! Review submitted for approval.');
                reviewForm.reset();
                if (starsContainer) { starsContainer.textContent = '☆☆☆☆☆'; starsContainer.classList.remove('active'); }
                const ri = document.getElementById('reviewRating');
                if (ri) ri.value = 0;
                currentRating = 0;
            } else throw new Error('Server error');
        } catch (err) {
            alert('⭐ Thank you for your feedback!');
            reviewForm.reset();
        }
        btn.textContent = originalText;
        btn.disabled = false;
    });
}

// ============================================
// CAREERS FORM
// ============================================
const careersForm = document.getElementById('careersForm');
if (careersForm) {
    careersForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const candidateData = {
            full_name: document.getElementById('candidateName')?.value || '',
            whatsapp: document.getElementById('candidateWhatsapp')?.value || '',
            email: document.getElementById('candidateEmail')?.value || '',
            expertise: document.getElementById('candidateExpertise')?.value || '',
            experience: document.getElementById('candidateExperience')?.value || '',
            portfolio_link: document.getElementById('candidatePortfolio')?.value || '',
            message: document.getElementById('candidateMessage')?.value || ''
        };
        const btn = careersForm.querySelector('button[type="submit"]');
        const originalText = btn.textContent;
        btn.textContent = 'Sending...';
        btn.disabled = true;
        try {
            const response = await fetch(`${API_BASE_URL}/api/careers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(candidateData)
            });
            if (response.ok) {
                alert('✅ Application submitted! We will contact you within 48 hours.');
                careersForm.reset();
            } else throw new Error('Server error');
        } catch (err) {
            alert('📋 Application received! We will contact you soon.');
            careersForm.reset();
        }
        btn.textContent = originalText;
        btn.disabled = false;
    });
}

// ============================================
// LOAD REVIEWS
// ============================================
async function loadReviews() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/reviews`);
        if (response.ok) {
            const data = await response.json();
            const reviewsGrid = document.getElementById('reviewsGrid');
            if (reviewsGrid) {
                if (data.reviews && data.reviews.length > 0) {
                    reviewsGrid.innerHTML = '';
                    data.reviews.forEach(review => {
                        const card = document.createElement('div');
                        card.className = 'review-card';
                        card.innerHTML = `
                            <div style="color:#F59E0B;font-size:1.2rem;margin-bottom:10px">${'★'.repeat(review.rating)}${'☆'.repeat(5-review.rating)}</div>
                            <p style="font-style:italic">"${(review.review_text || '').substring(0, 200)}"</p>
                            <div style="margin-top:12px">
                                <strong style="color:#1A3C6E">${review.client_name}</strong>
                                <small style="display:block;color:#6B7280">Verified Client</small>
                            </div>`;
                        reviewsGrid.appendChild(card);
                    });
                } else {
                    reviewsGrid.innerHTML = '<p style="text-align:center;padding:20px;">No reviews yet. Be the first! ⭐</p>';
                }
            }
        }
    } catch (err) {
        const reviewsGrid = document.getElementById('reviewsGrid');
        if (reviewsGrid) reviewsGrid.innerHTML = '<p style="text-align:center;padding:20px;">No reviews yet. Be the first! ⭐</p>';
    }
}
loadReviews();

// Fix Facebook link
document.querySelectorAll('.footer-social a').forEach(link => {
    if (link.getAttribute('aria-label') === 'Facebook') {
        link.href = 'https://www.facebook.com/share/1EtYyjfUGM/';
        link.target = '_blank';
    }
});

// Scroll Animations
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.service-card, .pricing-card, .testimonial, .feature, .portfolio-item, .review-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'all 0.6s ease';
    observer.observe(el);
});

console.log('✅ MS-Tech Solution loaded!');