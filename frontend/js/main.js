// MTechify/frontend/js/main.js
// API BASE URL
const API_BASE_URL = 'https://mtechify-labs.onrender.com';

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
// CHATBOT - ENHANCED WITH CONTEXT MEMORY
// ============================================
const chatToggle = document.getElementById('chatToggle');
const chatBox = document.getElementById('chatBox');
const chatClose = document.getElementById('chatClose');
const chatMessages = document.getElementById('msgs');
const chatInput = document.getElementById('chatIn');
const chatSend = document.getElementById('chatBtn');

// Context memory — last 5 messages
let chatContext = [];

// Toggle open/close with animation
chatToggle?.addEventListener('click', () => {
    const isOpen = chatBox.classList.contains('open');
    if (isOpen) {
        chatBox.classList.remove('open');
    } else {
        chatBox.classList.add('open');
    }
});

chatClose?.addEventListener('click', () => {
    chatBox.classList.remove('open');
});

// Add message to chat
function addMessage(text, isUser = false) {
    if (!chatMessages) return;
    const div = document.createElement('div');
    div.className = isUser ? 'user-msg' : 'bot-msg';
    div.textContent = text;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return div;
}

// Show typing indicator
function showTyping() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = '<span></span><span></span><span></span>';
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return typingDiv;
}

function removeTyping() {
    const typing = document.getElementById('typingIndicator');
    if (typing) typing.remove();
}

// Fallback responses with context
function getFallbackReply(msg, context) {
    const m = msg.toLowerCase();
    
    // Check if user is asking follow-up based on context
    const lastBotMsg = context.filter(c => c.role === 'assistant').pop();
    if (lastBotMsg && ['logo', 'pricing', 'website', 'erp'].some(k => lastBotMsg.content.toLowerCase().includes(k))) {
        if (m.includes('how much') || m.includes('price') || m.includes('cost')) {
            return "💰 Price details: Logo (PKR 800-2,500), Website (from PKR 15,000), ERP (custom quote). WhatsApp for exact quote!";
        }
    }
    
    if (m.includes('price') || m.includes('pricing') || m.includes('cost')) {
        return "💰 **Our Pricing:**\n• Logo: Basic PKR 800, Standard PKR 1,500, Premium PKR 2,500\n• Website: from PKR 15,000\n• ERP: Custom quote\n• Social Media: from PKR 5,000/mo";
    }
    if (m.includes('logo')) {
        return "🎨 **Logo Design:**\n• Premium quality, AI-powered\n• Same day delivery (6-8 hours)\n• 3 packages: Basic (PKR 800), Standard (PKR 1,500), Premium (PKR 2,500)\n• Unlimited revisions on Premium\n\nWant to see samples? WhatsApp us!";
    }
    if (m.includes('website') || m.includes('web')) {
        return "🌐 **Web Development:**\n• Business websites from PKR 15,000\n• E-commerce stores\n• Landing pages & portfolios\n• Mobile responsive, SEO friendly\n\nComing soon! Early bird discount available. WhatsApp now!";
    }
    if (m.includes('erp') || m.includes('software')) {
        return "📊 **ERP Software:**\n• Inventory management\n• Billing & invoicing\n• Sales reporting\n• Custom for retailers & wholesalers\n\nCustom quote based on your requirements. Share your business type!";
    }
    if (m.includes('delivery') || m.includes('time')) {
        return "⚡ **Delivery Timeline:**\n• Logo: 6-8 hours (same day)\n• Website: 7-14 days\n• ERP: 2-4 weeks\n\nUrgent? WhatsApp for priority service!";
    }
    if (m.includes('whatsapp') || m.includes('contact') || m.includes('phone')) {
        return "📞 **Contact Us:**\n• WhatsApp: +92 310 3888922\n• Email: hello.mtechifylabs@gmail.com\n• Response time: within 1 hour\n\nClick the WhatsApp button on bottom-left to chat directly!";
    }
    if (m.includes('hello') || m.includes('hi') || m.includes('salam')) {
        return "👋 Assalamualaikum! Welcome to MTechify Labs.\n\nI can help you with:\n• 💰 Pricing details\n• 🎨 Logo design process\n• 🌐 Website development\n• 📊 ERP software\n• ⚡ Delivery time\n• 📞 Contact information\n\nWhat would you like to know?";
    }
    if (m.includes('review') || m.includes('feedback')) {
        return "⭐ We love feedback! Share your experience in the 'Rate Your Experience' section on our website. Your review helps other businesses trust us!";
    }
    if (m.includes('career') || m.includes('job') || m.includes('work')) {
        return "💼 Want to work with us? Visit the 'Work With MTechify Labs' section on our website. We're hiring designers, developers, and marketers!";
    }
    if (m.includes('mission') || m.includes('vision')) {
        return "🎯 **Our Mission:** Empower Pakistani businesses with world-class digital solutions.\n\n🚀 **Our Vision:** Become Pakistan's most trusted full-service IT company.\n\nLearn more on our website!";
    }
    
    return "🤔 Let me connect you with our team! WhatsApp us at +92 310 3888922 for personalized help. Or ask me about: pricing, logo, website, ERP, delivery, or contact.";
}

// Send message with context memory
async function sendMessage() {
    const message = chatInput?.value.trim();
    if (!message) return;

    addMessage(message, true);
    chatInput.value = '';
    
    // Store user message in context
    chatContext.push({ role: 'user', content: message });
    if (chatContext.length > 10) chatContext.shift();

    // Show typing indicator
    showTyping();

    try {
        const response = await fetch(`${API_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: localStorage.getItem('visitor_id'),
                message: message
            })
        });

        removeTyping();

        if (response.ok) {
            const data = await response.json();
            addMessage(data.response, false);
            chatContext.push({ role: 'assistant', content: data.response });
            if (chatContext.length > 10) chatContext.shift();
        } else {
            const fallback = getFallbackReply(message, chatContext);
            addMessage(fallback, false);
            chatContext.push({ role: 'assistant', content: fallback });
        }
    } catch (err) {
        removeTyping();
        const fallback = getFallbackReply(message, chatContext);
        addMessage(fallback, false);
        chatContext.push({ role: 'assistant', content: fallback });
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
document.querySelectorAll('.chatbot-quick button').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const msg = btn.getAttribute('data-msg');
        if (msg && chatInput) {
            chatInput.value = msg;
            sendMessage();
        }
    });
});

// Click outside to close
document.addEventListener('click', (e) => {
    if (chatBox && chatToggle) {
        const isClickInside = chatBox.contains(e.target) || chatToggle.contains(e.target);
        if (!isClickInside && chatBox.classList.contains('open')) {
            chatBox.classList.remove('open');
        }
    }
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
                showToast('✅ Message sent! We will contact you within 1 hour.');
                contactForm.reset();
            } else throw new Error('Server error');
        } catch (err) {
            showToast('📋 Message received! We will contact you soon.', 'info');
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
        if (rating === 0) { showToast('⭐ Please select a rating first!', 'error'); return; }
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
                showToast('⭐ Thank you! Review submitted for approval.');
                reviewForm.reset();
                if (starsContainer) { starsContainer.textContent = '☆☆☆☆☆'; starsContainer.classList.remove('active'); }
                const ri = document.getElementById('reviewRating');
                if (ri) ri.value = 0;
                currentRating = 0;
            } else throw new Error('Server error');
        } catch (err) {
            showToast('⭐ Thank you for your feedback!');
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
                showToast('✅ Application submitted! We will contact you within 48 hours.');

                careersForm.reset();
            } else throw new Error('Server error');
        } catch (err) {
            showToast('📋 Application received! We will contact you soon.', 'info');
            careersForm.reset();
        }
        btn.textContent = originalText;
        btn.disabled = false;
    });
}

// ============================================
// TOAST NOTIFICATIONS (alert replace)
// ============================================
function showToast(message, type = 'success') {
    const existing = document.getElementById('toastNotif');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.id = 'toastNotif';
    toast.style.cssText = `
        position:fixed;bottom:90px;left:50%;transform:translateX(-50%);
        background:${type === 'success' ? '#16A34A' : type === 'error' ? '#DC2626' : '#1A3C6E'};
        color:white;padding:12px 24px;border-radius:8px;font-size:0.9rem;
        font-weight:600;z-index:99999;box-shadow:0 4px 16px rgba(0,0,0,0.2);
        animation:slideUp 0.3s ease;max-width:90vw;text-align:center;`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

// ============================================
// DYNAMIC SERVICES LOADER
// ============================================
async function loadServices() {
    const grid = document.getElementById('servicesGrid');
    if (!grid) return;
    try {
        const res = await fetch(`${API_BASE_URL}/api/services`);
        const data = await res.json();
        grid.innerHTML = '';
        data.services.forEach(s => {
            const priceMap = {
                graphic_design: 'From PKR 500',
                web_development: 'From PKR 7,000',
                erp_software: 'Custom Quote',
                social_media: 'From PKR 5,000/mo',
                ai_automation: 'Custom Quote',
                custom_software: 'Custom Quote'
            };
            const card = document.createElement('div');
            card.className = 'service-card';
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            card.style.transition = 'all 0.6s ease';
            card.innerHTML = `
                <div class="service-icon">${s.icon}</div>
                <h3>${s.service_name}</h3>
                <p>${s.description}</p>
                <div class="service-footer">
                    <span class="service-status ${s.is_active === 'active' ? 'active' : 'soon'}">
                        ${s.is_active === 'active' ? '✓ Available Now' : '🚀 Coming Soon'}
                    </span>
                    <span class="service-price">${priceMap[s.service_key] || 'Custom Quote'}</span>
                </div>`;
            grid.appendChild(card);
            observer.observe(card);
        });
    } catch (err) {
        console.log('Services load failed, keeping static');
    }
}

// ============================================
// DYNAMIC SERVICES ACCORDION WITH PRICING
// ============================================
async function loadServicesWithPricing() {
  const accordion = document.getElementById('servicesAccordion');
  if (!accordion) return;

  try {
    // Load both services and pricing together
    const [svcRes, pkgRes] = await Promise.all([
      fetch(`${API_BASE_URL}/api/services`),
      fetch(`${API_BASE_URL}/api/pricing`)
    ]);

    const svcData = await svcRes.json();
    const pkgData = await pkgRes.json();

    const services = svcData.services || [];
    const packages = pkgData.packages || [];

    if (!services.length) {
      accordion.innerHTML = '<p style="text-align:center;color:#6B7280">No services found.</p>';
      return;
    }

    accordion.innerHTML = '';

    services.forEach((svc, index) => {
      // Get packages for this service
      const svcPackages = packages.filter(p => p.service_key === svc.service_key);
      const isActive = svc.is_active === 'active';

      // Build packages HTML
      let packagesHTML = '';
      if (svcPackages.length > 0) {
        packagesHTML = `<div class="packages-grid">
          ${svcPackages.map(p => {
            let features = [];
            try { features = JSON.parse(p.features || '[]'); } catch(e) {}
            return `
              <div class="package-card ${p.is_popular ? 'popular' : ''}">
                ${p.is_popular ? '<div class="package-popular-badge">🔥 Best Value</div>' : ''}
                <h4>${p.package_name}</h4>
                <div class="package-price">PKR ${(p.price || 0).toLocaleString()}</div>
                <p class="package-desc">${p.description || ''}</p>
                <ul class="package-features">
                  ${features.map(f => `<li>${f}</li>`).join('')}
                </ul>
                <a href="https://wa.me/923103888922?text=I want ${p.package_name} (PKR ${p.price})"
                   class="package-order-btn" target="_blank">
                  Order on WhatsApp →
                </a>
              </div>`;
          }).join('')}
        </div>`;
      } else {
        packagesHTML = `<div class="no-packages-msg">
          <p>📞 Contact us for custom pricing on this service.</p>
          <a href="https://wa.me/923103888922" target="_blank" 
             style="display:inline-block;margin-top:12px;padding:10px 24px;background:#F59E0B;color:#1A3C6E;border-radius:8px;font-weight:700;text-decoration:none;">
            WhatsApp for Quote →
          </a>
        </div>`;
      }

      const item = document.createElement('div');
      item.className = `service-accordion-item ${!isActive ? 'coming-soon' : ''}`;
      // Auto-open first active service
      if (index === 0) item.classList.add('open');

      item.innerHTML = `
        <div class="service-accordion-header">
          <div class="service-accordion-left">
            <div class="service-accordion-icon">${svc.icon}</div>
            <div class="service-accordion-info">
              <h3>${svc.service_name}</h3>
              <p>${svc.description || ''}</p>
            </div>
          </div>
          <div class="service-accordion-right">
            <span class="service-status ${isActive ? 'active' : 'soon'}">
              ${isActive ? '✓ Available Now' : '🚀 Coming Soon'}
            </span>
            <span class="service-accordion-arrow">▼</span>
          </div>
        </div>
        <div class="service-accordion-body">
          ${packagesHTML}
        </div>`;

      // Click to toggle
      item.querySelector('.service-accordion-header').addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        // Close all
        document.querySelectorAll('.service-accordion-item').forEach(i => i.classList.remove('open'));
        // Open clicked (toggle)
        if (!isOpen) item.classList.add('open');
      });

      accordion.appendChild(item);
    });

  } catch(err) {
    console.log('Services accordion load failed:', err);
    accordion.innerHTML = '<p style="text-align:center;color:#6B7280;padding:40px;">Unable to load services. Please refresh.</p>';
  }
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
async function loadServicesSection() {
    const grid = document.getElementById('servicesGrid');
    if (!grid) return;
    try {
        const res = await fetch(`${API_BASE_URL}/api/services`);
        const data = await res.json();
        grid.innerHTML = '';
        data.services.forEach(s => {
            const priceMap = {
                graphic_design: 'From PKR 500',
                web_development: 'From PKR 7,000',
                erp_software: 'Custom Quote',
                social_media: 'From PKR 5,000/mo',
                ai_automation: 'Custom Quote',
                custom_software: 'Custom Quote'
            };
            const card = document.createElement('div');
            card.className = 'service-card';
            card.innerHTML = `
                <div class="service-icon">${s.icon}</div>
                <h3>${s.service_name}</h3>
                <p>${s.description}</p>
                <div class="service-footer">
                    <span class="service-status ${s.is_active === 'active' ? 'active' : 'soon'}">
                        ${s.is_active === 'active' ? '✓ Available Now' : '🚀 Coming Soon'}
                    </span>
                    <span class="service-price">${priceMap[s.service_key] || 'Custom Quote'}</span>
                </div>`;
            grid.appendChild(card);
        });
    } catch(err) {
        console.log('Services section load failed');
    }
}

loadReviews();
loadServicesSection();
loadServicesWithPricing();

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