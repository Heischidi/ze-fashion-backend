// Global API URL - Change this to your live backend URL
window.API_ROOT = 'https://ze-fashion-backend.onrender.com';

// Global Toast Notification
function showToast(message) {
  const el = document.createElement('div');
  el.className = 'fixed top-4 right-4 bg-black text-white border border-gold px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300 font-medium transform translate-y-0 opacity-100';
  el.textContent = message;
  document.body.appendChild(el);

  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(-20px)';
    setTimeout(() => el.remove(), 300);
  }, 3000);
}

document.addEventListener('DOMContentLoaded', () => {
  // Mobile menu functionality
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  const closeMenu = document.getElementById('closeMenu');

  function toggleMenu() {
    mobileMenu.classList.toggle('hidden');
    document.body.classList.toggle('no-scroll');
  }

  function closeMobileMenu() {
    mobileMenu.classList.add('hidden');
    document.body.classList.remove('no-scroll');
  }

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', toggleMenu);
  }

  if (closeMenu && mobileMenu) {
    closeMenu.addEventListener('click', closeMobileMenu);
  }

  // Close menu when clicking any link
  if (mobileMenu) {
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMobileMenu);
    });
  }
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// Interactive buttons with fashion-specific feedback
document.querySelectorAll('button').forEach(button => {
  button.addEventListener('click', function () {
    // Add click animation
    this.style.transform = 'scale(0.95)';
    setTimeout(() => {
      this.style.transform = '';
    }, 150);

    // Show fashion-specific demo messages
    let message = '';
    if (this.textContent.includes('Shop Collection') || this.textContent.includes('Add to Cart')) {
      message = 'Item added to your wishlist! This is a demo boutique.';
    } else if (this.textContent.includes('Subscribe')) {
      message = 'Thank you for subscribing to Zë updates!';
    } else if (this.textContent.includes('Explore') || this.textContent.includes('View')) {
      message = 'Opening collection... This is a demo experience.';
    } else if (this.textContent.includes('Learn More')) {
      message = "Discover more about Zë's heritage and craftsmanship.";
    }

    if (message) {
      showToast(message);
    }
  });
});

// Enhanced hover effects for fashion elements
document.querySelectorAll('.hover-scale').forEach(element => {
  element.addEventListener('mouseenter', function () {
    this.style.transform = 'scale(1.05)';
  });

  element.addEventListener('mouseleave', function () {
    this.style.transform = '';
  });
});

// Collection card interactions
document.querySelectorAll('.collection-card').forEach(card => {
  card.addEventListener('click', function () {
    const title = this.querySelector('h3').textContent;
    showToast(`Exploring ${title} collection...`);
  });
});

// Hero Slider Logic
document.addEventListener('DOMContentLoaded', () => {
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.slider-dot');
  const prevBtn = document.getElementById('prev-slide');
  const nextBtn = document.getElementById('next-slide');
  let currentSlide = 0;
  let slideInterval;

  function showSlide(index) {
    slides.forEach(slide => slide.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));

    slides[index].classList.add('active');
    dots[index].classList.add('active');
    currentSlide = index;
  }

  function nextSlide() {
    let next = (currentSlide + 1) % slides.length;
    showSlide(next);
  }

  function prevSlide() {
    let prev = (currentSlide - 1 + slides.length) % slides.length;
    showSlide(prev);
  }

  function startSlideShow() {
    slideInterval = setInterval(nextSlide, 5000);
  }

  function resetSlideShow() {
    clearInterval(slideInterval);
    startSlideShow();
  }

  if (slides.length > 0) {
    // Event Listeners
    nextBtn?.addEventListener('click', () => {
      nextSlide();
      resetSlideShow();
    });

    prevBtn?.addEventListener('click', () => {
      prevSlide();
      resetSlideShow();
    });

    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        showSlide(index);
        resetSlideShow();
      });
    });

    // Start auto-play
    startSlideShow();
  }
});

// Navbar background on scroll
window.addEventListener('scroll', () => {
  const nav = document.querySelector('nav');
  if (window.scrollY > 50) {
    nav.style.background = 'rgba(5, 5, 5, 0.95)';
    nav.style.backdropFilter = 'blur(20px)';
    nav.style.borderBottom = '1px solid rgba(171, 125, 125, 0.3)';
  } else {
    nav.style.background = ''; // Revert to CSS default (.glass-nav)
    nav.style.backdropFilter = '';
    nav.style.borderBottom = '';
  }
});

// Newsletter subscription
const emailInput = document.querySelector('input[type="email"]');
if (emailInput) {
  emailInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      const subscribeBtn = this.parentElement.querySelector('button');
      subscribeBtn.click();
    }
  });
}



// Cart functionality
window.API_ROOT = window.API_ROOT || 'http://localhost:4000';
const API_ROOT = window.API_ROOT;

async function syncCart() {
  const token = sessionStorage.getItem('ze_token');
  if (!token) return;

  const localCart = JSON.parse(localStorage.getItem("ze_cart_v1") || "[]");
  if (localCart.length > 0) {
    // Push local items to server
    try {
      await fetch(API_ROOT + '/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ items: localCart })
      });
    } catch (e) { console.error(e); }
  }

  // Fetch server cart
  try {
    const res = await fetch(API_ROOT + '/api/cart', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.items) {
      localStorage.setItem("ze_cart_v1", JSON.stringify(data.items));
      updateCartCount();
    }
  } catch (e) { console.error(e); }
}

window.addToCart = async function (id, title, image, price) {
  let cart = JSON.parse(localStorage.getItem("ze_cart_v1") || "[]");
  const existing = cart.find(item => item.id === id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: id,
      title: title,
      image: image,
      price: price,
      quantity: 1,
    });
  }
  localStorage.setItem("ze_cart_v1", JSON.stringify(cart));
  showToast("Added to cart!");
  updateCartCount();
  await syncCart();
};

function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem("ze_cart_v1") || "[]");
  const count = cart.reduce((acc, item) => acc + item.quantity, 0);
  document.querySelectorAll('.cart-count').forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? 'flex' : 'none';
  });
}

// Check for Google Login Token
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');
const userStr = urlParams.get('user');

if (token && userStr) {
  try {
    const user = JSON.parse(decodeURIComponent(userStr));
    sessionStorage.setItem('ze_token', token);
    sessionStorage.setItem('ze_user', JSON.stringify(user));

    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);

    // Redirect or update UI
    window.location.href = 'index.html';
  } catch (e) {
    console.error('Error parsing user data', e);
  }
}

// Initialize cart count on load
document.addEventListener('DOMContentLoaded', async () => {
  updateCartCount();
  syncCart();
});

/* --- PLP Logic (Collections Page) --- */
if (window.location.pathname.match(/(collections|men|women|kids)\.html/)) {
  let currentPage = 1;
  let loading = false;
  let hasMore = true;
  // Select grid that includes grid-cols-2 (for mobile)
  const productGrid = document.querySelector('.grid.grid-cols-2.md\\:grid-cols-3') || document.querySelector('.grid.grid-cols-1.md\\:grid-cols-3');

  async function loadProducts(reset = false) {
    const params = new URLSearchParams(window.location.search);

    // Determine category from filename if not in params
    const path = window.location.pathname;
    if (path.includes('women.html')) params.set('category', 'women');
    else if (path.includes('men.html')) params.set('category', 'men');
    else if (path.includes('kids.html')) params.set('category', 'kids');

    // Only load products if a category is selected (for collections.html) or implied (for specific pages)
    if (!params.has('category') && path.includes('collections.html')) return;

    if (loading || (!hasMore && !reset)) return;
    loading = true;

    if (reset) {
      currentPage = 1;
      hasMore = true;
      if (productGrid) productGrid.innerHTML = '';
    }

    params.set('page', currentPage);
    params.set('limit', 12);

    try {
      const res = await fetch(`${API_ROOT}/api/products?${params.toString()}`);
      const data = await res.json();

      if (data.items.length === 0) {
        hasMore = false;
        if (currentPage === 1 && productGrid) productGrid.innerHTML = '<p class="col-span-full text-center py-10">No products found.</p>';
      } else {
        renderProducts(data.items);
        currentPage++;
      }
    } catch (e) {
      console.error(e);
      showToast('Failed to load products');
    } finally {
      loading = false;
    }
  }

  function renderProducts(products) {
    if (!productGrid) return;
    products.forEach(p => {
      const img = p.images && p.images.length > 0 ? p.images[0] : '/images/placeholder.png';
      const el = document.createElement('div');
      el.className = 'group cursor-pointer';
      el.innerHTML = `
        <div class="relative overflow-hidden mb-2 md:mb-4">
          <img src="${img}" alt="${p.title}" class="w-full h-[250px] md:h-[400px] object-cover transition-transform duration-700 group-hover:scale-105">
          <div class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
             <button onclick="event.stopPropagation(); addToCart(${p.id}, '${p.title.replace(/'/g, "\\'")}', '${img}', ${p.price})" class="hidden md:block bg-white text-black px-6 py-3 uppercase tracking-wider hover:bg-gold hover:text-white transition-colors">
               Quick Add
             </button>
             <button onclick="event.stopPropagation(); addToCart(${p.id}, '${p.title.replace(/'/g, "\\'")}', '${img}', ${p.price})" class="md:hidden bg-white text-black p-2 rounded-full hover:bg-gold hover:text-white transition-colors shadow-lg">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
             </button>
          </div>
          ${p.compare_at_price ? `<div class="absolute top-2 left-2 md:top-4 md:left-4 bg-red-600 text-white text-[10px] md:text-xs px-2 py-1">SALE</div>` : ''}
        </div>
        <h3 class="font-serif text-sm md:text-lg mb-1 truncate">${p.title}</h3>
        <div class="flex gap-2 items-center flex-wrap">
          <p class="text-gray-600 text-sm md:text-base">₦${(p.price).toLocaleString()}</p>
          ${p.compare_at_price ? `<p class="text-gray-400 line-through text-xs md:text-sm">₦${(p.compare_at_price).toLocaleString()}</p>` : ''}
        </div>
      `;
      el.addEventListener('click', () => window.location.href = `product.html?id=${p.id}`);
      productGrid.appendChild(el);
    });
  }

  // Highlight active category
  function highlightActiveCategory() {
    const params = new URLSearchParams(window.location.search);
    const category = params.get('category');

    document.querySelectorAll('.collection-card').forEach(card => {
      card.classList.remove('ring-4', 'ring-gold');
      if (category && card.getAttribute('href').includes(`category=${category}`)) {
        card.classList.add('ring-4', 'ring-gold');
      }
    });
  }

  // Infinite Scroll
  window.addEventListener('scroll', () => {
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 1000) {
      loadProducts();
    }
  });

  // Initial Load
  document.addEventListener('DOMContentLoaded', () => {
    highlightActiveCategory();
    const params = new URLSearchParams(window.location.search);
    const categoryCards = document.getElementById('categoryCards');
    const pageTitle = document.querySelector('h1');
    const pageSubtitle = document.querySelector('.text-xl.text-gray-400');

    // Determine category from filename or params
    let category = params.get('category');
    const path = window.location.pathname;
    if (path.includes('women.html')) category = 'women';
    else if (path.includes('men.html')) category = 'men';
    else if (path.includes('kids.html')) category = 'kids';

    if (category) {
      // Specific Category View
      if (categoryCards) categoryCards.classList.add('hidden');

      // Update Title
      if (pageTitle) pageTitle.textContent = category.charAt(0).toUpperCase() + category.slice(1);
      if (pageSubtitle) {
        if (category === 'men') pageSubtitle.textContent = 'Sophisticated style for the modern man.';
        else if (category === 'women') pageSubtitle.textContent = 'Elegance and grace for every occasion.';
        else if (category === 'kids') pageSubtitle.textContent = 'Playful comfort meets luxury.';
        else pageSubtitle.textContent = `Explore our exclusive ${category} collection.`;
      }

      loadProducts(true);
    } else {
      // Main Collections View
      if (categoryCards) categoryCards.classList.remove('hidden');
      if (pageTitle) pageTitle.textContent = 'Our Collections';
      if (pageSubtitle) pageSubtitle.textContent = 'Curated pieces for the modern connoisseur.';

      if (productGrid) productGrid.innerHTML = ''; // Clear products
    }
  });
}

/* --- Authentication handlers --- */
(function () {
  const signInForm = document.getElementById('signInForm');
  if (signInForm) {
    signInForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      if (!email || !password) { showToast('Enter email and password'); return; }

      try {
        const res = await fetch(API_ROOT + '/api/auth/login', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (!res.ok) {
          // Handle verification error specifically
          if (res.status === 403 && data.error.includes('verify')) {
            showToast(data.error);
            return;
          }
          showToast(data.error || 'Sign in failed');
          return;
        }

        sessionStorage.setItem('ze_token', data.token);
        sessionStorage.setItem('ze_user', JSON.stringify(data.user || {}));
        showToast('Signed in successfully');
        await syncCart();

        if (data.user?.role === 'admin') setTimeout(() => window.location.href = 'admin.html', 1000);
        else setTimeout(() => window.location.href = 'index.html', 1000);
      } catch (err) { console.error(err); showToast('Login error'); }
    });
  }

  const signUpForm = document.getElementById('signUpForm');
  if (signUpForm) {
    signUpForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const name = document.getElementById('signup-name').value.trim();
      const email = document.getElementById('signup-email').value.trim();
      const password = document.getElementById('signup-password').value;

      try {
        const res = await fetch(API_ROOT + '/api/auth/register', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();
        if (!res.ok) { showToast(data.error || 'Sign up failed'); return; }

        // Registration successful, but wait for verification
        showToast(data.message || 'Account created. Please verify your email.');

        if (data.devLink) {
          console.log('Verification Link:', data.devLink);
          // Show link directly in UI for reliability
          const linkContainer = document.createElement('div');
          linkContainer.className = 'mt-4 p-4 bg-zinc-800 rounded border border-yellow-500/30 text-center';
          linkContainer.innerHTML = `
            <p class="text-white mb-2">Verification Link (Demo Mode):</p>
            <a href="${data.devLink}" target="_blank" class="block w-full break-all text-yellow-500 hover:text-white underline p-2 bg-black/50 rounded text-sm">
              Click to Verify
            </a>
            <p class="text-xs text-gray-400 mt-2">Open this link to verify your account.</p>
          `;

          // Clear form and show message
          signUpForm.innerHTML = '';
          signUpForm.appendChild(linkContainer);

          // Add a "Back to Sign In" button
          const backBtn = document.createElement('button');
          backBtn.className = 'mt-4 w-full text-center text-gray-400 hover:text-white text-sm underline';
          backBtn.textContent = 'Back to Sign In';
          backBtn.onclick = () => {
            location.reload();
          };
          signUpForm.appendChild(backBtn);
        } else {
          // Normal flow (with working email)
          const signInContainer = document.getElementById('signInContainer');
          const signUpContainer = document.getElementById('signUpContainer');
          if (signInContainer && signUpContainer) {
            signUpContainer.classList.add('hidden');
            signInContainer.classList.remove('hidden');
          }
        }

      } catch (err) { console.error(err); showToast('Sign up error'); }
    });
  }

  // Handle Sign Out Button (Delegation)
  document.addEventListener('click', (e) => {
    if (e.target.id === 'signOutBtn' || e.target.closest('#signOutBtn') || e.target.classList.contains('signout')) {
      e.preventDefault();
      if (confirm('Are you sure you want to sign out?')) {
        sessionStorage.removeItem('ze_token');
        sessionStorage.removeItem('ze_user');
        localStorage.removeItem('ze_cart_v1');
        showToast('Signed out');
        setTimeout(() => window.location.href = 'index.html', 500);
      }
    }
  });

  function setupUserMenu() {
    try {
      const token = sessionStorage.getItem('ze_token');
      const user = JSON.parse(sessionStorage.getItem('ze_user') || '{}');
      if (!token) return;

      // Handle ALL sign in links (Desktop & Mobile)
      const signInLinks = document.querySelectorAll('a[href="signin.html"]');

      signInLinks.forEach(link => {
        link.href = 'account.html';
        // For desktop icon, show "Hi Name", for mobile text, show "My Account"
        const name = user.name ? user.name.split(' ')[0] : 'User';

        if (link.querySelector('svg')) {
          // Desktop Icon style - Keep icon but change title
          link.title = `My Account (${name})`;
          // Optional: Change icon to user icon if desired, but keeping existing is fine
        } else {
          // Mobile/Text style
          link.textContent = `My Account (${name})`;
        }

        // Remove old listeners by cloning (already done by the loop structure in original code if we replace)
        const newLink = link.cloneNode(true);
        link.parentNode.replaceChild(newLink, link);
      });

      // Add Admin link if admin
      if (user.role === 'admin') {
        const navContainer = document.querySelector('nav .flex.items-center.space-x-4') || document.querySelector('nav .flex.items-center');
        if (navContainer && !document.querySelector('a[href="admin.html"]')) {
          const adminLink = document.createElement('a');
          adminLink.href = 'admin.html';
          adminLink.className = 'text-white hover:text-gold transition-colors text-sm font-medium border border-white/20 px-3 py-1 rounded hover:border-gold ml-4';
          adminLink.textContent = 'Admin';
          navContainer.insertBefore(adminLink, navContainer.firstChild);
        }
      }
    } catch (e) { console.error('User menu setup error:', e); }
  }



  // Run setup on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setupUserMenu();
    });
  } else {
    setupUserMenu();
  }
})();
