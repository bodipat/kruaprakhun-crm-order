// Krua Prakhun CRM & Order Application Logic (Refactored for Brand Theme & Layout Screenshots)

// ==========================================
// CONFIGURATIONS (Firebase & LINE LIFF)
// ==========================================
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const liffId = "YOUR_LIFF_ID";
const notifyProxyUrl = ""; // Replace with your VPS URL e.g. "https://yourdomain.com/api/notify" or "http://your-vps-ip:3000/api/notify"

// ==========================================
// 1. DATABASE ENGINE (localStorage Wrapper & Firebase Sync)
// ==========================================
class Database {
  constructor() {
    this.prefix = 'kruaprakhun_';
    
    // Initialize Firebase if configured
    if (typeof firebase !== 'undefined' && firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY") {
      firebase.initializeApp(firebaseConfig);
      this.db = firebase.firestore();
      this.isFirebase = true;
      console.log('Live Database: Firebase initialized.');
    } else {
      this.isFirebase = false;
      console.log('Local Simulation Database: Using browser LocalStorage.');
    }
    
    this.init();
  }

  init() {
    const dbVersion = localStorage.getItem(this.prefix + 'db_version');
    const targetVersion = '1.4';

    const storedMenus = localStorage.getItem(this.prefix + 'menus');
    const needsSeed = !storedMenus || JSON.parse(storedMenus).length < 30 || dbVersion !== targetVersion;

    if (needsSeed) {
      const seed = window.KruaPrakhunSeedData;
      if (seed) {
        this.saveCache('categories', seed.MOCK_CATEGORIES);
        this.saveCache('menus', seed.MOCK_MENUS);
        this.saveCache('toppings', seed.MOCK_TOPPINGS);
        this.saveCache('options', seed.MOCK_OPTIONS);
        this.saveCache('campaigns', seed.MOCK_CAMPAIGNS);
        this.saveCache('sources', seed.MOCK_SOURCES);
        this.saveCache('customers', seed.MOCK_CUSTOMERS);
        this.saveCache('orders', seed.MOCK_ORDERS);
        this.saveCache('ledger', seed.MOCK_LEDGER);
        localStorage.setItem(this.prefix + 'db_version', targetVersion);
        console.log('Local cache seeded/reset successfully with real menu items.');
      } else {
        console.error('Seed data not found in window object!');
      }
    }

    if (this.isFirebase) {
      this.syncWithFirebase();
    }
  }

  async syncWithFirebase() {
    try {
      const collections = ['categories', 'menus', 'toppings', 'options', 'campaigns', 'sources', 'customers', 'orders', 'settings', 'ledger'];
      
      // 1. One-time initial load of all collections to local cache
      for (const col of collections) {
        const snapshot = await this.db.collection(col).get();
        if (snapshot.empty) {
          // If Firestore is empty for this collection, seed it from local cache!
          console.log(`Firestore collection '${col}' is empty. Seeding...`);
          const localData = this.get(col);
          if (localData && (Array.isArray(localData) ? localData.length > 0 : Object.keys(localData).length > 0)) {
            if (col === 'settings') {
              await this.db.collection(col).doc('global').set(localData);
            } else {
              for (const item of localData) {
                if (item && item.id) {
                  await this.db.collection(col).doc(item.id).set(item);
                }
              }
            }
          }
        } else {
          // Update local cache with Firestore data
          if (col === 'settings') {
            const doc = snapshot.docs[0];
            if (doc) {
              this.saveCache('settings', doc.data());
            }
          } else {
            const dataList = snapshot.docs.map(doc => doc.data());
            this.saveCache(col, dataList);
          }
        }
      }
      
      console.log('Firebase: Initial database synchronization complete.');
      
      // Trigger UI updates with live data
      if (state.activeRole) {
        switchRole(state.activeRole);
      }

      // 2. Set up real-time listeners for active collections
      // Listen to Orders
      this.db.collection('orders').onSnapshot(snapshot => {
        const orders = snapshot.docs.map(doc => doc.data());
        this.saveCache('orders', orders);
        console.log('Firebase: Live Orders updated.');
        if (state.activeRole === 'kitchen') {
          KitchenApp.renderKitchenBoard();
        } else if (state.activeRole === 'admin') {
          StoreAdmin.loadOrders();
        }
      });

      // Listen to Menus
      this.db.collection('menus').onSnapshot(snapshot => {
        const menus = snapshot.docs.map(doc => doc.data());
        this.saveCache('menus', menus);
        console.log('Firebase: Live Menus updated.');
        if (state.activeRole === 'customer') {
          CustomerApp.renderCatalog();
        } else if (state.activeRole === 'admin') {
          StoreAdmin.loadMenus();
        }
      });

      // Listen to Settings
      this.db.collection('settings').doc('global').onSnapshot(doc => {
        if (doc.exists) {
          this.saveCache('settings', doc.data());
          console.log('Firebase: Live Settings updated.');
          if (state.activeRole === 'customer') {
            CustomerApp.renderHeroSection();
          } else if (state.activeRole === 'admin') {
            StoreAdmin.loadSettings();
          }
        }
      });

      // Listen to Ledger
      this.db.collection('ledger').onSnapshot(snapshot => {
        const ledger = snapshot.docs.map(doc => doc.data());
        this.saveCache('ledger', ledger);
        console.log('Firebase: Live Ledger updated.');
        if (state.activeRole === 'admin') {
          StoreAdmin.renderLedger();
        }
      });

    } catch (error) {
      console.error('Error syncing with Firebase:', error);
    }
  }

  get(key) {
    const data = localStorage.getItem(this.prefix + key);
    if (!data) return key === 'settings' ? {} : [];
    return JSON.parse(data);
  }

  saveCache(key, data) {
    localStorage.setItem(this.prefix + key, JSON.stringify(data));
  }

  save(key, data) {
    this.saveCache(key, data);
    
    // Asynchronously save to Firebase if enabled
    if (this.isFirebase) {
      if (key === 'settings') {
        this.db.collection(key).doc('global').set(data)
          .catch(err => console.error('Firebase: Settings save error:', err));
      } else if (Array.isArray(data)) {
        data.forEach(item => {
          if (item && item.id) {
            this.db.collection(key).doc(item.id).set(item)
              .catch(err => console.error(`Firebase: Error saving ${key}/${item.id}:`, err));
          }
        });
      }
    }
  }

  // Generic CRUD helpers
  insert(key, item) {
    const list = this.get(key);
    list.push(item);
    this.save(key, list);
    return item;
  }

  update(key, id, updatedFields, idKey = 'id') {
    const list = this.get(key);
    const index = list.findIndex(item => item[idKey] === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...updatedFields };
      this.save(key, list);
      return list[index];
    }
    return null;
  }

  delete(key, id, idKey = 'id') {
    const list = this.get(key);
    const filtered = list.filter(item => item[idKey] !== id);
    this.save(key, filtered);
    
    if (this.isFirebase) {
      this.db.collection(key).doc(id).delete()
        .catch(err => console.error(`Firebase: Error deleting ${key}/${id}:`, err));
    }
  }
}

const db = new Database();

// ==========================================
// 2. STATE MANAGER & GLOBAL APP STATE
// ==========================================
const state = {
  activeRole: 'customer', // customer, admin, kitchen, marketing
  activeCategory: 'all',
  searchQuery: '',
  cart: [],
  currentCustomer: null,
  activeOrderSession: {
    source_id: null,
    campaign_id: null,
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_content: null,
    utm_term: null,
    gclid: null
  },
  soundEnabled: true,
  audioContext: null,
  authenticatedRoles: {
    admin: false,
    kitchen: false,
    marketing: false
  },
  editingLedgerId: null
};

// Utility to format date string from YYYY-MM-DD or ISO string to DD/MM/YYYY
function formatDateDisplay(dateStr) {
  if (!dateStr) return '-';
  let dateOnly = dateStr;
  if (typeof dateStr === 'string') {
    dateOnly = dateStr.split('T')[0].split(' ')[0];
  } else if (dateStr instanceof Date) {
    const y = dateStr.getFullYear();
    const m = String(dateStr.getMonth() + 1).padStart(2, '0');
    const d = String(dateStr.getDate()).padStart(2, '0');
    return `${d}/${m}/${y}`;
  }
  
  const parts = String(dateOnly).split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const month = parts[1];
    const day = parts[2];
    return `${day}/${month}/${year}`;
  }
  return dateStr;
}

// Load session auth for staff roles if exists
try {
  const storedAuth = sessionStorage.getItem('kp_staff_auth');
  if (storedAuth) {
    state.authenticatedRoles = JSON.parse(storedAuth);
  }
} catch (e) {
  console.warn('Failed to load staff auth session', e);
}

// ==========================================
// 3. ATTRIBUTION ENGINE (Tracker)
// ==========================================
const Tracker = {
  // Parse query parameters
  parseParams(urlStr) {
    try {
      const url = new URL(urlStr);
      const params = {};
      url.searchParams.forEach((val, key) => {
        params[key] = val;
      });
      return params;
    } catch (e) {
      // If it's just a query string
      const search = urlStr.includes('?') ? urlStr.split('?')[1] : urlStr;
      const params = {};
      if (!search) return params;
      const parts = search.split('&');
      parts.forEach(part => {
        const [key, val] = part.split('=');
        if (key) params[decodeURIComponent(key)] = decodeURIComponent(val || '');
      });
      return params;
    }
  },

  // Process and update state
  captureAttribution(urlStr) {
    const params = this.parseParams(urlStr);
    
    // Extract parameters
    const sourceId = params.source || params.source_id || null;
    const campaignId = params.campaign || params.campaign_id || null;
    const utmSource = params.utm_source || null;
    const utmMedium = params.utm_medium || null;
    const utmCampaign = params.utm_campaign || null;
    const utmContent = params.utm_content || null;
    const utmTerm = params.utm_term || null;
    const gclid = params.gclid || null;

    // Check if valid source exists in database
    let sourceRecord = null;
    if (sourceId) {
      const sources = db.get('sources');
      sourceRecord = sources.find(s => s.id === sourceId);
    }

    // Populate active tracking session
    state.activeOrderSession = {
      source_id: sourceId,
      source_name: sourceRecord ? sourceRecord.name : (sourceId ? `Direct: ${sourceId}` : null),
      source_type: sourceRecord ? sourceRecord.type : (utmSource ? 'Digital' : 'Organic'),
      campaign_id: campaignId || (sourceRecord ? sourceRecord.campaign_id : null),
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
      utm_content: utmContent,
      utm_term: utmTerm,
      gclid: gclid,
      landing_page_url: urlStr
    };

    // Store in sessionStorage to maintain session persistence
    sessionStorage.setItem('kp_attribution', JSON.stringify(state.activeOrderSession));
    this.updateUIBadge();
  },

  // Load from session storage
  loadSessionAttribution() {
    const stored = sessionStorage.getItem('kp_attribution');
    if (stored) {
      state.activeOrderSession = JSON.parse(stored);
    }
    this.updateUIBadge();
  },

  // Update UI indicators
  updateUIBadge() {
    const badgeContainer = document.getElementById('active-campaign-badge');
    const simUrlInput = document.getElementById('sim-url-input');
    if (!badgeContainer) return;

    // Sync simulator URL input
    if (simUrlInput && window.location.href !== simUrlInput.value) {
      // Don't overwrite if user is typing
      if (document.activeElement !== simUrlInput) {
        simUrlInput.value = state.activeOrderSession.landing_page_url || window.location.href;
      }
    }

    if (state.activeOrderSession.source_id || state.activeOrderSession.utm_campaign) {
      const campaignName = state.activeOrderSession.utm_campaign || state.activeOrderSession.campaign_id || 'Campaign';
      const sourceName = state.activeOrderSession.source_name || state.activeOrderSession.utm_source || 'Unknown';
      badgeContainer.innerHTML = `
        <div class="badge badge-primary" style="background: rgba(19, 78, 30, 0.08); color: var(--primary); border: 1px solid rgba(19, 78, 30, 0.2);">
          <span style="font-size: 0.8rem; margin-right: 4px;">🎯</span>
          ${sourceName} (${campaignName})
        </div>
      `;
    } else {
      badgeContainer.innerHTML = '';
    }
  }
};

// ==========================================
// 4. KITCHEN AUDIO HELPER
// ==========================================
const AudioHelper = {
  playAlert() {
    if (!state.soundEnabled) return;
    try {
      if (!state.audioContext) {
        state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      const ctx = state.audioContext;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Play double chime
      const playTone = (time, freq, dur) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        
        gainNode.gain.setValueAtTime(0.3, time);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + dur - 0.05);
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.start(time);
        osc.stop(time + dur);
      };

      const now = ctx.currentTime;
      playTone(now, 523.25, 0.3); // C5
      playTone(now + 0.15, 659.25, 0.4); // E5
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  }
};

// ==========================================
// 5. CUSTOMER ENGINE (Circular Categories, Grid Catalog, Cart, Checkout)
// ==========================================
const CustomerApp = {
  renderHeroSection() {
    const storedSettings = db.get('settings');
    const settings = {
      hero_title: (storedSettings && storedSettings.hero_title) || 'อาหารอร่อย\nสำหรับ[gold]ทุกมื้อ[/gold]',
      hero_desc: (storedSettings && storedSettings.hero_desc) || 'ครัวพระคุณปรุงอาหารโฮมเมดสดใหม่ เลือกเมนูโปรด ปรับตัวเลือก และสั่งผ่าน LINE ได้ง่ายในไม่กี่ขั้นตอน'
    };

    const titleEl = document.getElementById('hero-title-val');
    const descEl = document.getElementById('hero-desc-val');

    if (titleEl) {
      let titleHtml = settings.hero_title.replace(/\n/g, '<br>');
      titleHtml = titleHtml.replace(/\[gold\](.*?)\[\/gold\]/g, '<span class="highlight-gold">$1</span>');
      titleEl.innerHTML = titleHtml;
    }

    if (descEl) {
      descEl.textContent = settings.hero_desc;
    }
  },
  renderFeaturedMenu() {
    const menus = db.get('menus');
    const recommendedItem = menus.find(m => m.recommended && m.status === 'active');
    const featuredContainer = document.getElementById('featured-recom-card-container');
    
    if (recommendedItem && featuredContainer) {
      const imgEl = document.getElementById('featured-img');
      const titleEl = document.getElementById('featured-title');
      const descEl = document.getElementById('featured-desc');
      const priceEl = document.getElementById('featured-price');
      const featuredAddBtn = document.getElementById('featured-add-btn');

      if (imgEl) imgEl.src = recommendedItem.image;
      if (titleEl) titleEl.textContent = recommendedItem.name;
      if (descEl) descEl.textContent = recommendedItem.description || 'ราคาเมนูจริงของร้าน';
      if (priceEl) priceEl.textContent = '฿' + recommendedItem.base_price;

      // Click behavior
      featuredContainer.onclick = () => {
        this.openItemModal(recommendedItem.id);
      };
      if (featuredAddBtn) {
        featuredAddBtn.onclick = (e) => {
          e.stopPropagation();
          this.openItemModal(recommendedItem.id);
        };
      }
      featuredContainer.style.display = 'block';
    } else if (featuredContainer) {
      featuredContainer.style.display = 'none';
    }
  },
  renderCircularCategories() {
    const container = document.getElementById('circular-categories-container');
    if (!container) return;

    const categories = db.get('categories');
    
    // Icon/Emoji mapping for categories
    const icons = {
      'cat_value': '🥘',
      'cat_daily': '🍽️',
      'cat_seafood': '🐟'
    };

    let html = '';
    categories.forEach(cat => {
      // Calculate dynamic counts
      const menus = db.get('menus').filter(m => m.category_id === cat.id && m.status === 'active');
      const countLabel = cat.id === 'cat_value' ? '3 เมนู' : cat.id === 'cat_daily' ? '12 เมนู' : '16 เมนู'; // Hardcoded target representation or actual
      const actualCount = menus.length;

      html += `
        <div class="circular-cat-card" data-id="${cat.id}">
          <div class="circular-cat-node">
            <span class="icon-placeholder">${icons[cat.id] || '🍲'}</span>
          </div>
          <div class="circular-cat-title">${cat.name}</div>
          <div class="circular-cat-count">${countLabel}</div>
        </div>
      `;
    });
    container.innerHTML = html;

    // Attach click events
    container.querySelectorAll('.circular-cat-card').forEach(card => {
      card.addEventListener('click', () => {
        state.activeCategory = card.dataset.id;
        this.renderCategories();
        this.renderMenus();
        // Smooth scroll to catalog catalog
        document.getElementById('menu-catalog-anchor').scrollIntoView({ behavior: 'smooth' });
      });
    });
  },

  renderCategories() {
    const container = document.getElementById('catalog-pills-container');
    if (!container) return;

    const categories = db.get('categories');
    let html = `<button class="catalog-pill-btn ${state.activeCategory === 'all' ? 'active' : ''}" data-id="all">ทั้งหมด</button>`;
    
    categories.forEach(cat => {
      html += `<button class="catalog-pill-btn ${state.activeCategory === cat.id ? 'active' : ''}" data-id="${cat.id}">${cat.name}</button>`;
    });
    container.innerHTML = html;

    // Attach click events to pills
    container.querySelectorAll('.catalog-pill-btn').forEach(pill => {
      pill.addEventListener('click', () => {
        state.activeCategory = pill.dataset.id;
        this.renderCategories();
        this.renderMenus();
      });
    });
  },

  renderMenus() {
    const container = document.getElementById('menu-grid-container');
    if (!container) return;

    let menus = db.get('menus');
    
    // Category Filter
    if (state.activeCategory !== 'all') {
      menus = menus.filter(m => m.category_id === state.activeCategory);
    }

    // Search Query Filter
    if (state.searchQuery.trim() !== '') {
      const q = state.searchQuery.toLowerCase();
      menus = menus.filter(m => 
        m.name.toLowerCase().includes(q) || 
        (m.description && m.description.toLowerCase().includes(q))
      );
    }

    // Render Cards in Double Column
    if (menus.length === 0) {
      container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 40px 0;">ไม่พบเมนูที่ต้องการ</div>`;
      return;
    }

    let html = '';
    menus.forEach(menu => {
      const recBadge = menu.recommended ? `<div class="catalog-card-rec-badge">แนะนำ</div>` : '';
      html += `
        <div class="catalog-card" data-id="${menu.id}">
          <div class="catalog-card-img-wrapper">
            <img src="${menu.image}" class="catalog-card-img" alt="${menu.name}" loading="lazy">
            ${recBadge}
          </div>
          <div class="catalog-card-info">
            <div>
              <div class="catalog-card-title">${menu.name}</div>
              <div class="catalog-card-desc">${menu.description || 'ราคาเมนูจริงของร้าน'}</div>
            </div>
            <div class="catalog-card-footer">
              <div class="catalog-card-price"><span class="currency">฿</span>${menu.base_price}</div>
              <div class="catalog-circle-add-btn">+</div>
            </div>
          </div>
        </div>
      `;
    });
    container.innerHTML = html;

    // Attach Click Events to Cards
    container.querySelectorAll('.catalog-card').forEach(card => {
      card.addEventListener('click', () => {
        this.openItemModal(card.dataset.id);
      });
    });
  },

  openItemModal(menuId) {
    const menus = db.get('menus');
    const menu = menus.find(m => m.id === menuId);
    if (!menu) return;

    state.selectedMenuProduct = {
      menu: menu,
      quantity: 1,
      options: {},
      toppings: [],
      note: ''
    };

    // Render options
    const modalImg = document.getElementById('modal-product-img');
    const modalTitle = document.getElementById('modal-product-title');
    const modalDesc = document.getElementById('modal-product-desc');
    const optionsContainer = document.getElementById('modal-options-container');

    modalImg.src = menu.image;
    modalTitle.textContent = menu.name;
    modalDesc.textContent = menu.description || 'ราคาเมนูจริงของร้าน';

    let optionsHtml = '';

    // 1. Spicy Option (If available on menu)
    if (menu.spicy_option_available) {
      const spicyGroup = db.get('options').find(o => o.id === 'opt_spicy');
      if (spicyGroup) {
        optionsHtml += this.buildOptionHTML(spicyGroup, true);
        // Set default
        state.selectedMenuProduct.options[spicyGroup.group_name] = spicyGroup.options[2]; // เผ็ดปกติ
      }
    }

    // 2. Add Rice Option (If category is not seafood or drinks)
    if (menu.category_id !== 'cat_seafood' && menu.category_id !== 'cat_drinks') {
      const riceGroup = db.get('options').find(o => o.id === 'opt_rice');
      if (riceGroup) {
        optionsHtml += this.buildOptionHTML(riceGroup, true);
        state.selectedMenuProduct.options[riceGroup.group_name] = riceGroup.options[1]; // ข้าวปกติ
      }
      
      const prepGroup = db.get('options').find(o => o.id === 'opt_preparation');
      if (prepGroup) {
        optionsHtml += this.buildOptionHTML(prepGroup, true);
        state.selectedMenuProduct.options[prepGroup.group_name] = prepGroup.options[0]; // ราดข้าว
      }
    }

    // 3. Toppings (If available)
    if (menu.topping_available) {
      const toppings = db.get('toppings').filter(t => t.status === 'active');
      optionsHtml += `
        <div class="option-group">
          <div class="option-group-title">
            <span>เพิ่มท็อปปิ้ง (เลือกได้มากกว่า 1 รายการ)</span>
          </div>
          <div class="option-choices">
      `;
      toppings.forEach(top => {
        optionsHtml += `
          <div class="choice-row topping-choice" data-id="${top.id}" data-price="${top.price}">
            <div class="choice-label">
              <div class="choice-checkbox"></div>
              <span>${top.name}</span>
            </div>
            <div class="choice-price">+${top.price} ฿</div>
          </div>
        `;
      });
      optionsHtml += `</div></div>`;
    }

    // 4. Note fields
    optionsHtml += `
      <div class="option-group">
        <div class="option-group-title">รายละเอียดเพิ่มเติม / คำสั่งพิเศษ</div>
        <textarea id="item-note-textarea" class="item-note-input" placeholder="ตัวอย่าง: เผ็ดน้อยมากๆ, ขอไข่ดาวกรอบๆ, ไม่ใส่ผงชูรส"></textarea>
      </div>
    `;

    optionsContainer.innerHTML = optionsHtml;
    this.updateModalBottomBar();

    // Attach click events inside modal
    // Radio buttons
    optionsContainer.querySelectorAll('.choice-radio-option').forEach(row => {
      row.addEventListener('click', () => {
        const group = row.dataset.group;
        const val = row.dataset.val;
        
        // Remove active class from sibling rows
        optionsContainer.querySelectorAll(`.choice-radio-option[data-group="${group}"]`).forEach(r => r.classList.remove('selected'));
        row.classList.add('selected');
        
        state.selectedMenuProduct.options[group] = val;
        this.updateModalBottomBar();
      });
    });

    // Toppings Checkboxes
    optionsContainer.querySelectorAll('.topping-choice').forEach(row => {
      row.addEventListener('click', () => {
        const id = row.dataset.id;
        const price = parseInt(row.dataset.price);
        const name = row.querySelector('.choice-label span').textContent;
        const index = state.selectedMenuProduct.toppings.findIndex(t => t.id === id);

        if (index === -1) {
          row.classList.add('selected');
          state.selectedMenuProduct.toppings.push({ id, name, price });
        } else {
          row.classList.remove('selected');
          state.selectedMenuProduct.toppings.splice(index, 1);
        }
        this.updateModalBottomBar();
      });
    });

    // Qty counter
    document.getElementById('modal-qty-val').textContent = state.selectedMenuProduct.quantity;

    // Show Overlay
    document.getElementById('product-modal-overlay').classList.add('active');
  },

  buildOptionHTML(group, preselectFirst = true) {
    let html = `
      <div class="option-group">
        <div class="option-group-title">
          <span>${group.group_name}</span>
          ${group.required ? '<span class="required-tag">จำเป็น</span>' : ''}
        </div>
        <div class="option-choices">
    `;

    group.options.forEach((opt, idx) => {
      // Handle extra costs coded in text (e.g. (+10 บาท))
      let priceText = '';
      let cleanOpt = opt;
      if (opt.includes('(+')) {
        const match = opt.match(/\(\+(\d+)/);
        if (match) {
          priceText = `+${match[1]} ฿`;
        }
      }
      
      const isDefault = (group.id === 'opt_spicy' && idx === 2) || // เผ็ดปกติ
                        (group.id === 'opt_rice' && idx === 1) ||  // ข้าวปกติ
                        (group.id === 'opt_preparation' && idx === 0);

      html += `
        <div class="choice-row choice-radio-option ${isDefault ? 'selected' : ''}" data-group="${group.group_name}" data-val="${opt}">
          <div class="choice-label">
            <div class="choice-radio"></div>
            <span>${opt}</span>
          </div>
          ${priceText ? `<div class="choice-price">${priceText}</div>` : ''}
        </div>
      `;
    });

    html += `</div></div>`;
    return html;
  },

  updateModalBottomBar() {
    const p = state.selectedMenuProduct;
    let singlePrice = p.menu.base_price;

    // Calculate options price offsets
    Object.entries(p.options).forEach(([group, val]) => {
      if (val.includes('(+')) {
        const match = val.match(/\(\+(\d+)/);
        if (match) singlePrice += parseInt(match[1]);
      }
    });

    // Toppings sum
    p.toppings.forEach(t => singlePrice += t.price);

    const totalPrice = singlePrice * p.quantity;
    document.getElementById('btn-add-cart-price').textContent = totalPrice + ' ฿';
  },

  updateQty(delta) {
    if (!state.selectedMenuProduct) return;
    state.selectedMenuProduct.quantity = Math.max(1, state.selectedMenuProduct.quantity + delta);
    document.getElementById('modal-qty-val').textContent = state.selectedMenuProduct.quantity;
    this.updateModalBottomBar();
  },

  addToCart() {
    const p = state.selectedMenuProduct;
    if (!p) return;

    // Capture text note safely
    const noteEl = document.getElementById('item-note-textarea');
    p.note = noteEl ? noteEl.value : '';

    // Capture total price safely and strip non-numeric symbols
    const priceEl = document.getElementById('btn-add-cart-price');
    const priceText = priceEl ? priceEl.textContent : '0';
    const cleanedPrice = priceText.replace(/[^\d.]/g, '');
    const totalItemPrice = parseFloat(cleanedPrice) || 0;

    // Add unique identifier to cart item
    const cartItem = {
      cart_item_id: 'cart_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      menu_id: p.menu.id,
      menu_name: p.menu.name,
      quantity: p.quantity,
      base_price: p.menu.base_price,
      selected_options: { ...p.options },
      selected_toppings: [...p.toppings],
      item_note: p.note,
      total_item_price: totalItemPrice
    };

    if (!state.cart) state.cart = [];
    state.cart.push(cartItem);
    
    const overlay = document.getElementById('product-modal-overlay');
    if (overlay) overlay.classList.remove('active');
    
    this.updateFloatingCart();
  },

  updateFloatingCart() {
    const cartBar = document.getElementById('floating-cart-bar');
    const headerQty = document.getElementById('header-cart-qty');
    
    const totalQty = state.cart.reduce((acc, item) => acc + item.quantity, 0);
    const subtotal = state.cart.reduce((acc, item) => acc + item.total_item_price, 0);

    // Sync header icon counter
    if (headerQty) {
      headerQty.textContent = totalQty;
    }

    if (state.cart.length === 0) {
      if (cartBar) cartBar.style.display = 'none';
      return;
    }

    if (cartBar) {
      document.getElementById('cart-bar-qty').textContent = totalQty;
      document.getElementById('cart-bar-total-price').textContent = '฿' + subtotal;
      cartBar.style.display = 'flex';
    }
  },

  handleLineUserAutoLogin(profile) {
    const customers = db.get('customers');
    const cust = customers.find(c => c.line_user_id === profile.userId);
    
    // Show LINE user widget in navbar
    const widget = document.getElementById('line-user-widget');
    const avatar = document.getElementById('line-user-avatar');
    const nameSpan = document.getElementById('line-user-name');
    
    if (widget && avatar && nameSpan) {
      avatar.src = profile.pictureUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80';
      nameSpan.textContent = profile.displayName;
      widget.style.display = 'flex';
    }

    if (cust) {
      state.currentCustomer = cust;
      console.log('LIFF Auto-Login: Welcome back', cust.name);
      
      // Auto-populate form fields if they are currently on the checkout page
      const chkName = document.getElementById('chk-name');
      const chkPhone = document.getElementById('chk-phone');
      const chkAddress = document.getElementById('chk-address');
      
      if (chkName) chkName.value = cust.name;
      if (chkPhone) chkPhone.value = cust.phone;
      if (chkAddress && cust.default_address) chkAddress.value = cust.default_address;

      if (document.getElementById('checkout-flow-panel') && document.getElementById('checkout-flow-panel').style.display === 'block') {
        this.renderCheckoutPage();
      }
    } else {
      // Create temporary customer profile
      state.currentCustomer = {
        id: 'cust_tmp_' + profile.userId,
        name: profile.displayName,
        phone: '',
        line_user_id: profile.userId,
        line_display_name: profile.displayName,
        line_picture_url: profile.pictureUrl,
        email: '',
        default_address: '',
        first_source: state.activeOrderSession.source_id || 'Organic',
        latest_source: state.activeOrderSession.source_id || 'Organic',
        created_at: new Date().toISOString(),
        last_order_at: null,
        consent_marketing: true,
        is_temp: true
      };
      console.log('LIFF Auto-Login: Temp profile created for new customer.');
    }
  },

  // Renders Checkout Screen Layout (Cart + Address + Payment)
  renderCheckoutPage() {
    // 1. Render Cart items inside checkout
    const itemsContainer = document.getElementById('checkout-items-container');
    if (!itemsContainer) return;

    if (state.cart.length === 0) {
      itemsContainer.innerHTML = `<div style="text-align: center; color: var(--text-secondary); padding: 20px 0;">ไม่มีรายการอาหารในตะกร้า</div>`;
      document.getElementById('checkout-submit-btn').disabled = true;
      document.getElementById('checkout-submit-btn').style.opacity = 0.5;
    } else {
      let html = '';
      state.cart.forEach(item => {
        const optionBadges = Object.entries(item.selected_options)
          .map(([k, v]) => `${k}: ${v}`).join(', ');
        
        const toppingText = item.selected_toppings.map(t => `+${t.name}`).join(', ');
        const notesLine = item.item_note ? `<div class="checkout-item-sub" style="color: var(--danger);">* Note: ${item.item_note}</div>` : '';
        const detailsLine = [optionBadges, toppingText].filter(x => x).join(' | ');

        html += `
          <div class="checkout-item-row" style="margin-bottom: 10px; padding-bottom: 8px;">
            <div class="checkout-item-details">
              <div class="checkout-item-name">${item.menu_name} x ${item.quantity}</div>
              ${detailsLine ? `<div class="checkout-item-sub" style="font-size:0.75rem; color:var(--text-secondary);">${detailsLine}</div>` : ''}
              ${notesLine}
            </div>
            <div class="checkout-item-price" style="font-weight: 700;">${item.total_item_price} ฿</div>
          </div>
        `;
      });
      itemsContainer.innerHTML = html;
      document.getElementById('checkout-submit-btn').disabled = false;
      document.getElementById('checkout-submit-btn').style.opacity = 1;
    }

    // 2. Render Prices Summary (Subtotal, Fee, Promo discounts)
    this.calculateCheckoutSummary();

    // 3. Render Profile Authentication boxes
    const authContainer = document.getElementById('checkout-auth-container');
    if (state.currentCustomer) {
      authContainer.innerHTML = `
        <div class="auth-profile">
          <img src="${state.currentCustomer.line_display_name ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80' : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}" class="auth-avatar" alt="Avatar">
          <div class="auth-details">
            <h4 style="color: var(--primary); font-family: var(--font-prompt);">${state.currentCustomer.name}</h4>
            <p>เบอร์โทร: ${state.currentCustomer.phone} ${state.currentCustomer.line_display_name ? `| LINE: ${state.currentCustomer.line_display_name}` : ''}</p>
          </div>
        </div>
      `;
      // Pre-fill address if customer has one
      if (state.currentCustomer.default_address) {
        document.getElementById('chk-address').value = state.currentCustomer.default_address;
      }
      document.getElementById('chk-name').value = state.currentCustomer.name;
      document.getElementById('chk-phone').value = state.currentCustomer.phone;
    } else {
      authContainer.innerHTML = `
        <div class="auth-box">
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 10px;">กรุณาเข้าสู่ระบบด้วย LINE หรือเบอร์โทรศัพท์ เพื่อเริ่มบันทึกออเดอร์และเก็บสิทธิประโยชน์ CRM</p>
          <div style="display: flex; gap: 8px; justify-content: center;">
            <button type="button" class="btn btn-secondary btn-sm" id="btn-trigger-line-login" style="background: #06C755; color: white; border: none;">
              <span>🟢</span> LINE Login
            </button>
            <button type="button" class="btn btn-secondary btn-sm" id="btn-trigger-phone-login" style="background: var(--primary); color: white; border: none;">
              <span>📞</span> เบอร์โทรศัพท์
            </button>
          </div>
        </div>
      `;
      
      // Bind click triggers
      document.getElementById('btn-trigger-line-login').onclick = () => this.openAuthModal('line');
      document.getElementById('btn-trigger-phone-login').onclick = () => this.openAuthModal('phone');
    }
  },

  calculateCheckoutSummary() {
    const subtotal = state.cart.reduce((acc, item) => acc + item.total_item_price, 0);
    
    // Delivery fee logic: standard 25 baht. Free if order is 300 baht or more (from menu).
    let deliveryFee = subtotal >= 300 ? 0 : 25;
    let discount = 0;

    const campaignId = state.activeOrderSession.campaign_id;
    if (campaignId) {
      const campaigns = db.get('campaigns');
      const activeCampaign = campaigns.find(c => c.id === campaignId);

      if (activeCampaign && activeCampaign.status === 'active') {
        // Evaluate Offers
        if (activeCampaign.offer.includes('ส่งฟรี') && subtotal >= 150) {
          deliveryFee = 0;
        } else if (activeCampaign.offer.includes('ส่วนลด 10%')) {
          discount = Math.round(subtotal * 0.1 * 10) / 10;
        }
      }
    }

    const netTotal = Math.max(0, subtotal + deliveryFee - discount);

    document.getElementById('chk-subtotal').textContent = subtotal + ' ฿';
    document.getElementById('chk-delivery-fee').textContent = deliveryFee + ' ฿';
    document.getElementById('chk-discount').textContent = discount > 0 ? `-${discount} ฿` : '0 ฿';
    document.getElementById('chk-net-total').textContent = netTotal + ' ฿';

    // Renders Payment bank account visual details
    document.getElementById('qr-chk-total').textContent = netTotal.toFixed(2) + ' ฿';

    // Render Dynamic QR code mockup linking total to promptpay
    const qrCodeImg = document.getElementById('checkout-qr-code-img');
    if (qrCodeImg) {
      const promptPayRaw = `PromptPay_0812345678_Amount_${netTotal.toFixed(2)}`;
      qrCodeImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(promptPayRaw)}`;
    }
  },

  openAuthModal(type) {
    const overlay = document.getElementById('auth-modal-overlay');
    const lineFields = document.getElementById('auth-line-fields');
    const phoneFields = document.getElementById('auth-phone-fields');
    const title = document.getElementById('auth-modal-title');

    overlay.classList.add('active');

    if (type === 'line') {
      title.textContent = 'LINE Profile Login';
      lineFields.style.display = 'block';
      phoneFields.style.display = 'none';
      
      // Seed default name
      document.getElementById('auth-line-name').value = 'สมชาย ใจมั่น';
      document.getElementById('auth-line-phone').value = '0812345678';
    } else {
      title.textContent = 'เข้าสู่ระบบด้วยเบอร์โทรศัพท์';
      lineFields.style.display = 'none';
      phoneFields.style.display = 'block';
    }
  },

  submitAuth(type) {
    const customers = db.get('customers');
    let newCustomer = null;

    if (type === 'line') {
      const name = document.getElementById('auth-line-name').value.trim();
      const phone = document.getElementById('auth-line-phone').value.trim();
      
      if (!name || !phone) {
        alert('กรุณากรอกชื่อและเบอร์โทรศัพท์');
        return;
      }

      // Check if existing customer matches phone
      let cust = customers.find(c => c.phone === phone);
      if (cust) {
        // Upgrade with LINE id
        cust.line_user_id = 'U' + Math.random().toString(36).substr(2, 10);
        cust.line_display_name = name.replace(/\s+/g, '_') + '_LINE';
        cust.name = name;
        cust.latest_source = state.activeOrderSession.source_id || cust.latest_source;
        db.update('customers', cust.id, cust);
        newCustomer = cust;
      } else {
        // Create new customer profile
        newCustomer = {
          id: 'cust_' + Date.now(),
          name: name,
          phone: phone,
          line_user_id: 'U' + Math.random().toString(36).substr(2, 10),
          line_display_name: name.replace(/\s+/g, '_') + '_LINE',
          email: '',
          default_address: '',
          first_source: state.activeOrderSession.source_id || 'Organic',
          latest_source: state.activeOrderSession.source_id || 'Organic',
          created_at: new Date().toISOString(),
          last_order_at: null,
          consent_marketing: true
        };
        db.insert('customers', newCustomer);
      }
    } else {
      // Phone Login
      const phone = document.getElementById('auth-phone-val').value.trim();
      const name = document.getElementById('auth-phone-name').value.trim();
      
      if (!phone || !name) {
        alert('กรุณากรอกข้อมูลให้ครบถ้วน');
        return;
      }

      let cust = customers.find(c => c.phone === phone);
      if (cust) {
        cust.name = name;
        cust.latest_source = state.activeOrderSession.source_id || cust.latest_source;
        db.update('customers', cust.id, cust);
        newCustomer = cust;
      } else {
        newCustomer = {
          id: 'cust_' + Date.now(),
          name: name,
          phone: phone,
          line_user_id: null,
          line_display_name: null,
          email: '',
          default_address: '',
          first_source: state.activeOrderSession.source_id || 'Organic',
          latest_source: state.activeOrderSession.source_id || 'Organic',
          created_at: new Date().toISOString(),
          last_order_at: null,
          consent_marketing: true
        };
        db.insert('customers', newCustomer);
      }
    }

    state.currentCustomer = newCustomer;
    document.getElementById('auth-modal-overlay').classList.remove('active');
    
    // Refresh checkout panels
    this.renderCheckoutPage();
  },

  handleSlipUpload(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('slip-img-preview');
    const container = document.getElementById('slip-upload-dropzone');
    const textInfo = document.getElementById('slip-upload-info-text');

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        preview.src = e.target.result;
        container.classList.add('has-image');
        textInfo.textContent = `เปลี่ยนรูปสลิป (${file.name})`;
        state.tempSlipBase64 = e.target.result; // Temporarily save slip content
      };
      reader.readAsDataURL(file);
    }
  },

  submitOrder(event) {
    event.preventDefault();

    if (state.cart.length === 0) {
      alert('ตะกร้าสินค้าว่างเปล่า กรุณาเลือกอาหารก่อน');
      return;
    }

    if (!state.currentCustomer) {
      alert('กรุณาเข้าสู่ระบบด้วย LINE หรือเบอร์โทรศัพท์ก่อนสั่งอาหาร');
      return;
    }

    // 1. Gather forms variables
    const name = document.getElementById('chk-name').value.trim();
    const phone = document.getElementById('chk-phone').value.trim();
    const address = document.getElementById('chk-address').value.trim();
    const landmark = document.getElementById('chk-landmark').value.trim();
    const riderNote = document.getElementById('chk-rider-note').value.trim();
    const consentReq = document.getElementById('chk-consent-req').checked;
    const consentMkt = document.getElementById('chk-consent-mkt').checked;

    if (!name || !phone || !address) {
      alert('กรุณากรอกข้อมูลส่วนตัวและที่อยู่จัดส่งให้ครบถ้วน');
      return;
    }

    if (!consentReq) {
      alert('คุณต้องยอมรับข้อตกลงและนโยบายความเป็นส่วนตัวเพื่อดำเนินการสั่งซื้อ');
      return;
    }

    // Check payment slip
    if (!state.tempSlipBase64) {
      alert('กรุณาแนบภาพสลิปชำระเงินโอนบัญชี');
      return;
    }

    // 2. Refresh Customer Profile DB
    if (state.currentCustomer.is_temp) {
      const customers = db.get('customers');
      let cust = customers.find(c => c.phone === phone);
      if (cust) {
        // Merge LINE details to existing customer profile matching phone
        cust.line_user_id = state.currentCustomer.line_user_id;
        cust.line_display_name = state.currentCustomer.line_display_name;
        cust.line_picture_url = state.currentCustomer.line_picture_url;
        cust.name = name;
        cust.default_address = address;
        cust.last_order_at = new Date().toISOString();
        cust.consent_marketing = consentMkt;
        db.update('customers', cust.id, cust);
        state.currentCustomer = cust;
      } else {
        // Upgrade temporary LINE customer to permanent profile using LINE User ID
        const newCust = {
          id: 'cust_' + state.currentCustomer.line_user_id,
          name: name,
          phone: phone,
          line_user_id: state.currentCustomer.line_user_id,
          line_display_name: state.currentCustomer.line_display_name,
          line_picture_url: state.currentCustomer.line_picture_url,
          email: '',
          default_address: address,
          first_source: state.activeOrderSession.source_id || 'Organic',
          latest_source: state.activeOrderSession.source_id || 'Organic',
          created_at: new Date().toISOString(),
          last_order_at: new Date().toISOString(),
          consent_marketing: consentMkt
        };
        db.insert('customers', newCust);
        state.currentCustomer = newCust;
      }
    } else {
      const customerUpdate = {
        name: name,
        phone: phone,
        default_address: address,
        last_order_at: new Date().toISOString(),
        consent_marketing: consentMkt,
        consent_timestamp: new Date().toISOString(),
        consent_source: state.activeOrderSession.source_id || 'Checkout Portal'
      };
      db.update('customers', state.currentCustomer.id, customerUpdate);
      state.currentCustomer = { ...state.currentCustomer, ...customerUpdate };
    }

    // 3. Assemble Order Structure
    const subtotal = state.cart.reduce((acc, item) => acc + item.total_item_price, 0);
    
    // Recalculate (standard 25 baht, free if order >= 300)
    let deliveryFee = subtotal >= 300 ? 0 : 25;
    let discount = 0;
    const campaignId = state.activeOrderSession.campaign_id;
    if (campaignId) {
      const campaigns = db.get('campaigns');
      const activeCampaign = campaigns.find(c => c.id === campaignId);
      if (activeCampaign && activeCampaign.status === 'active') {
        if (activeCampaign.offer.includes('ส่งฟรี') && subtotal >= 150) deliveryFee = 0;
        if (activeCampaign.offer.includes('ส่วนลด 10%')) discount = Math.round(subtotal * 0.1 * 10) / 10;
      }
    }
    const netTotal = subtotal + deliveryFee - discount;

    const orderId = 'ord_' + (1000 + db.get('orders').length + 1);
    const orderData = {
      id: orderId,
      customer_id: state.currentCustomer.id,
      customer_name: name,
      customer_phone: phone,
      order_datetime: new Date().toISOString(),
      order_status: 'Paid / Waiting Verify', // Starts as wait verification
      payment_status: 'Slip Uploaded',
      subtotal: subtotal,
      delivery_fee: deliveryFee,
      discount: discount,
      total_amount: netTotal,
      source_id: state.activeOrderSession.source_id,
      campaign_id: state.activeOrderSession.campaign_id,
      utm_source: state.activeOrderSession.utm_source,
      utm_medium: state.activeOrderSession.utm_medium,
      utm_campaign: state.activeOrderSession.utm_campaign,
      utm_content: state.activeOrderSession.utm_content,
      utm_term: state.activeOrderSession.utm_term,
      gclid: state.activeOrderSession.gclid,
      delivery_address: `${address}${landmark ? ` (จุดสังเกต: ${landmark})` : ''}`,
      rider_note: riderNote,
      slip_url: state.tempSlipBase64,
      items: state.cart.map(item => ({
        order_item_id: item.cart_item_id,
        menu_id: item.menu_id,
        menu_name: item.menu_name,
        quantity: item.quantity,
        base_price: item.base_price,
        selected_options: item.selected_options,
        selected_toppings: item.selected_toppings,
        item_note: item.item_note,
        total_item_price: item.total_item_price
      }))
    };

    // 4. Save to Database
    db.insert('orders', orderData);

    // Trigger LINE Notify Admin Notification via Proxy Server
    if (notifyProxyUrl) {
      const itemsDesc = orderData.items.map(item => `- ${item.menu_name} x ${item.quantity}`).join('\n');
      const message = `🔔 มีออเดอร์ใหม่เข้ามาแล้ว!\nหมายเลขออเดอร์: ${orderData.id}\nลูกค้า: ${orderData.customer_name}\nเบอร์โทร: ${orderData.customer_phone}\nยอดรวม: ${orderData.total_amount} ฿\nรายการอาหาร:\n${itemsDesc}\nที่อยู่จัดส่ง: ${orderData.delivery_address}`;
      
      fetch(notifyProxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message })
      })
      .then(response => response.json())
      .then(res => console.log('LINE Notify response:', res))
      .catch(err => console.error('LINE Notify error:', err));
    }

    // 5. Clean state
    state.cart = [];
    state.tempSlipBase64 = null;
    this.updateFloatingCart();

    // 6. Navigate to Thank You / Order status tracking
    this.renderTrackingPage(orderData);
  },

  renderTrackingPage(order) {
    // Hide Cart View panel
    document.getElementById('checkout-flow-panel').style.display = 'none';
    const trackingPanel = document.getElementById('order-tracking-panel');
    trackingPanel.style.display = 'block';

    document.getElementById('tracking-order-id').textContent = order.id;
    document.getElementById('tracking-total-amount').textContent = order.total_amount + ' ฿';
    
    // Render item details list
    const itemsList = document.getElementById('tracking-items-list');
    let itemsHtml = '';
    order.items.forEach(item => {
      const toppings = item.selected_toppings.map(t => t.name).join(', ');
      const options = Object.entries(item.selected_options).map(([k, v]) => `${k}: ${v}`).join(', ');
      const notes = item.item_note ? `<span style="color: var(--danger);">* Note: ${item.item_note}</span>` : '';
      itemsHtml += `
        <div style="font-size: 0.85rem; margin-bottom: 8px; display: flex; justify-content: space-between; border-bottom: 1px dashed rgba(19,78,30,0.03); padding-bottom: 5px;">
          <div>
            <strong style="color: var(--primary);">${item.menu_name} x ${item.quantity}</strong>
            <div style="font-size: 0.75rem; color: var(--text-secondary);">${[options, toppings].filter(x=>x).join(' | ')} ${notes}</div>
          </div>
          <div style="font-weight:700; color: var(--accent);">${item.total_item_price} ฿</div>
        </div>
      `;
    });
    itemsList.innerHTML = itemsHtml;

    // Trigger state checker (simulated polling intervals)
    this.pollOrderStatus(order.id);
  },

  pollOrderStatus(orderId) {
    const updateTrackerSteps = () => {
      const orders = db.get('orders');
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      const steps = [
        { status: 'Paid / Waiting Verify', elementId: 'step-verify', title: 'รอตรวจสอบยอดโอน', desc: 'ร้านค้ากำลังตรวจความถูกต้องของสลิปชำระเงิน' },
        { status: 'Accepted', elementId: 'step-accepted', title: 'รับออเดอร์แล้ว', desc: 'ร้านรับทราบและยืนยันการรับเงินเรียบร้อย' },
        { status: 'Cooking', elementId: 'step-cooking', title: 'กำลังปรุงอาหาร', desc: 'พ่อครัวกำลังจัดเตรียมอาหารมื้ออร่อยของคุณ' },
        { status: 'Completed', elementId: 'step-completed', title: 'จัดส่งสำเร็จ', desc: 'อาหารจัดส่งถึงที่หมายเรียบร้อย ทานให้อร่อยนะคะ!' }
      ];

      // Reset styles
      steps.forEach(step => {
        const el = document.getElementById(step.elementId);
        if (el) {
          el.className = 'status-step';
        }
      });

      // Find current active step index
      let currentStatus = order.order_status;
      if (currentStatus === 'New') currentStatus = 'Paid / Waiting Verify';
      if (currentStatus === 'Ready for Delivery' || currentStatus === 'Out for Delivery') currentStatus = 'Cooking';

      const activeIndex = steps.findIndex(s => s.status === currentStatus);

      steps.forEach((step, idx) => {
        const el = document.getElementById(step.elementId);
        if (!el) return;

        if (idx < activeIndex) {
          el.classList.add('completed');
        } else if (idx === activeIndex) {
          el.classList.add('active');
        }
      });
    };

    // Run immediately
    updateTrackerSteps();

    // Poll every 3 seconds while on Customer view to fetch Admin updates
    if (state.trackingInterval) clearInterval(state.trackingInterval);
    state.trackingInterval = setInterval(() => {
      // Only poll if we are actually tracking this order
      const panel = document.getElementById('order-tracking-panel');
      if (panel && panel.style.display === 'block') {
        updateTrackerSteps();
      } else {
        clearInterval(state.trackingInterval);
      }
    }, 3000);
  }
};

// ==========================================
// 6. STORE ADMIN DASHBOARD & CRM ENGINE
// ==========================================
const StoreAdmin = {
  renderOverview() {
    const orders = db.get('orders');
    const customers = db.get('customers');
    const campaigns = db.get('campaigns');

    // 1. Calculations
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter(o => o.order_datetime.startsWith(today));
    
    // Revenue calculations (excluding Cancelled/Rejected)
    const validOrders = orders.filter(o => o.order_status !== 'Cancelled' && o.payment_status !== 'Rejected');
    const totalRevenue = validOrders.reduce((acc, o) => acc + o.total_amount, 0);
    const todayRevenue = todayOrders.filter(o => o.order_status !== 'Cancelled' && o.payment_status !== 'Rejected').reduce((acc, o) => acc + o.total_amount, 0);

    const aov = validOrders.length > 0 ? (totalRevenue / validOrders.length).toFixed(1) : 0;

    // Attributions statistics
    const campaignStats = {};
    validOrders.forEach(o => {
      if (o.campaign_id) {
        campaignStats[o.campaign_id] = (campaignStats[o.campaign_id] || 0) + o.total_amount;
      }
    });
    
    let topCampaignName = 'Organic (ไม่มี)';
    let maxCampRevenue = 0;
    Object.entries(campaignStats).forEach(([campId, rev]) => {
      if (rev > maxCampRevenue) {
        maxCampRevenue = rev;
        const camp = campaigns.find(c => c.id === campId);
        topCampaignName = camp ? camp.name : campId;
      }
    });

    // Populate Overview Stats Cards
    document.getElementById('adm-stat-today-revenue').textContent = todayRevenue.toLocaleString() + ' ฿';
    document.getElementById('adm-stat-today-count').textContent = todayOrders.length + ' บิล';
    document.getElementById('adm-stat-total-revenue').textContent = totalRevenue.toLocaleString() + ' ฿';
    document.getElementById('adm-stat-aov').textContent = aov + ' ฿';
    document.getElementById('adm-stat-customers').textContent = customers.length + ' คน';
    document.getElementById('adm-stat-top-campaign').textContent = topCampaignName;

    // Render Orders Table
    this.renderOrdersTable();
  },

  renderOrdersTable() {
    const tableBody = document.getElementById('admin-orders-table-body');
    if (!tableBody) return;

    const orders = db.get('orders').sort((a,b) => new Date(b.order_datetime) - new Date(a.order_datetime));
    const statusFilter = document.getElementById('admin-order-status-filter').value;

    let filtered = orders;
    if (statusFilter !== 'all') {
      filtered = orders.filter(o => o.order_status === statusFilter);
    }

    if (filtered.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--text-muted);">ไม่พบข้อมูลออเดอร์</td></tr>`;
      return;
    }

    let html = '';
    filtered.forEach(o => {
      const dateStr = new Date(o.order_datetime).toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'});
      
      let statusBadge = '';
      if (o.order_status === 'Paid / Waiting Verify') statusBadge = `<span class="badge badge-primary" style="background: rgba(19,78,30,0.08); color: var(--primary)">รอตรวจสอบสลิป</span>`;
      else if (o.order_status === 'Accepted') statusBadge = `<span class="badge badge-secondary" style="background: rgba(194,151,56,0.1); color: var(--accent)">รับออเดอร์แล้ว</span>`;
      else if (o.order_status === 'Cooking') statusBadge = `<span class="badge badge-info">กำลังทำอาหาร</span>`;
      else if (o.order_status === 'Completed') statusBadge = `<span class="badge badge-secondary" style="background: rgba(16,185,129,0.1); color: var(--secondary)">สำเร็จ</span>`;
      else if (o.order_status === 'Cancelled') statusBadge = `<span class="badge badge-danger">ยกเลิก</span>`;
      else statusBadge = `<span class="badge badge-info">${o.order_status}</span>`;

      const sourceText = o.source_id ? `${o.source_id.replace('src_', '')}` : 'Organic';

      html += `
        <tr style="cursor: pointer;" onclick="StoreAdmin.openOrderDetail('${o.id}')">
          <td><strong>${o.id}</strong></td>
          <td>${dateStr}</td>
          <td>${o.customer_name}</td>
          <td>${o.items.length} รายการ</td>
          <td><strong>${o.total_amount} ฿</strong></td>
          <td>${statusBadge}</td>
          <td><span style="font-size: 0.75rem; background: var(--bg-tertiary); padding: 2px 6px; border-radius: 4px; color: var(--primary); font-weight:600;">${sourceText}</span></td>
          <td>${o.campaign_id ? o.campaign_id.replace('camp_', '') : '-'}</td>
          <td><button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); StoreAdmin.openOrderDetail('${o.id}')">ดูรายละเอียด</button></td>
        </tr>
      `;
    });
    tableBody.innerHTML = html;
  },

  openOrderDetail(orderId) {
    const orders = db.get('orders');
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    // Show Detail modal
    document.getElementById('admin-order-modal-id').textContent = order.id;
    document.getElementById('admin-order-detail-name').textContent = order.customer_name;
    document.getElementById('admin-order-detail-phone').innerHTML = `<a href="tel:${order.customer_phone}" style="color: var(--accent); text-decoration: none; font-weight:700;">📞 ${order.customer_phone}</a>`;
    document.getElementById('admin-order-detail-address').textContent = order.delivery_address;
    document.getElementById('admin-order-detail-rider-note').textContent = order.rider_note || '-';
    
    // Details Tracking
    const trackingHtml = `
      <div><strong>Source:</strong> ${order.source_id || 'Organic'}</div>
      <div><strong>Campaign:</strong> ${order.campaign_id || '-'}</div>
      ${order.utm_source ? `<div><strong>UTM Source:</strong> ${order.utm_source}</div>` : ''}
      ${order.utm_campaign ? `<div><strong>UTM Campaign:</strong> ${order.utm_campaign}</div>` : ''}
      ${order.gclid ? `<div><strong>GCLID:</strong> <span style="font-size:0.75rem; font-family:monospace;">${order.gclid}</span></div>` : ''}
    `;
    document.getElementById('admin-order-detail-attribution').innerHTML = trackingHtml;

    // Receipt image
    const slipImg = document.getElementById('admin-order-detail-slip');
    if (order.slip_url) {
      slipImg.src = order.slip_url;
      slipImg.style.display = 'block';
      slipImg.onclick = () => {
        // Zoom view
        const zoomOverlay = document.getElementById('image-zoom-overlay');
        const zoomImg = document.getElementById('zoomed-image');
        zoomImg.src = order.slip_url;
        zoomOverlay.classList.add('active');
      };
    } else {
      slipImg.style.display = 'none';
    }

    // Render items summary
    let itemsHtml = '';
    order.items.forEach(item => {
      const ops = Object.entries(item.selected_options).map(([k, v]) => `${k}: ${v}`).join(', ');
      const tops = item.selected_toppings.map(t => `+${t.name}`).join(', ');
      const notes = item.item_note ? `<div style="color: var(--danger); font-weight: 500;">* Note: ${item.item_note}</div>` : '';
      itemsHtml += `
        <div style="padding: 10px 0; border-bottom: 1px solid rgba(19, 78, 30, 0.05);">
          <div class="flex-between">
            <div><strong style="color: var(--primary);">${item.menu_name} x ${item.quantity}</strong></div>
            <div style="font-weight:700; color: var(--accent);">${item.total_item_price} ฿</div>
          </div>
          <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 4px;">${[ops, tops].filter(x=>x).join(' | ')}</div>
          ${notes}
        </div>
      `;
    });

    itemsHtml += `
      <div style="margin-top: 15px; background: var(--bg-primary); border: 1px solid rgba(19, 78, 30, 0.05); padding: 10px; border-radius: 8px;">
        <div class="flex-between" style="font-size: 0.8rem; margin-bottom: 4px; color: var(--text-secondary);"><span>ค่าอาหาร:</span><span>${order.subtotal} ฿</span></div>
        <div class="flex-between" style="font-size: 0.8rem; margin-bottom: 4px; color: var(--text-secondary);"><span>ค่าจัดส่ง:</span><span>${order.delivery_fee} ฿</span></div>
        ${order.discount > 0 ? `<div class="flex-between text-success" style="font-size: 0.8rem; margin-bottom: 4px; color: var(--secondary);"><span>ส่วนลด:</span><span>-${order.discount} ฿</span></div>` : ''}
        <div class="flex-between" style="font-size: 0.95rem; font-weight: 700; border-top: 1px solid rgba(19, 78, 30, 0.1); padding-top: 8px; margin-top: 5px;">
          <span>ยอดสุทธิ:</span><span style="color: var(--accent);">${order.total_amount} ฿</span>
        </div>
      </div>
    `;
    document.getElementById('admin-order-detail-items').innerHTML = itemsHtml;

    // Setup action controls based on status
    const controls = document.getElementById('admin-order-detail-controls');
    let btnHtml = '';
    
    if (order.order_status === 'Paid / Waiting Verify') {
      btnHtml = `
        <button class="btn btn-secondary" onclick="StoreAdmin.rejectSlip('${order.id}')" style="background: rgba(239,68,68,0.1); border-color: var(--danger); color: var(--danger)">ปฏิเสธสลิป</button>
        <button class="btn btn-primary" onclick="StoreAdmin.verifyPayment('${order.id}')">ยืนยันยอดเงินโอน (Verify)</button>
      `;
    } else if (order.order_status === 'Accepted') {
      btnHtml = `
        <button class="btn btn-danger" onclick="StoreAdmin.cancelOrder('${order.id}')">ยกเลิกออเดอร์</button>
        <button class="btn btn-primary" onclick="StoreAdmin.updateOrderStatus('${order.id}', 'Cooking')">ส่งเข้าห้องครัวปรุงอาหาร</button>
      `;
    } else if (order.order_status !== 'Completed' && order.order_status !== 'Cancelled') {
      btnHtml = `
        <button class="btn btn-secondary" onclick="StoreAdmin.updateOrderStatus('${order.id}', 'Completed')">ทำเสร็จ & จัดส่งเรียบร้อย</button>
      `;
    }

    controls.innerHTML = btnHtml;
    document.getElementById('admin-order-modal-overlay').classList.add('active');
  },

  verifyPayment(orderId) {
    db.update('orders', orderId, { order_status: 'Accepted', payment_status: 'Verified' });
    document.getElementById('admin-order-modal-overlay').classList.remove('active');
    this.renderOverview();
    
    // Notify kitchen dashboard (if open in background)
    if (state.activeRole === 'kitchen') KitchenApp.renderBoard();
  },

  rejectSlip(orderId) {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการปฏิเสธสลิปนี้?')) {
      db.update('orders', orderId, { order_status: 'Cancelled', payment_status: 'Rejected' });
      document.getElementById('admin-order-modal-overlay').classList.remove('active');
      this.renderOverview();
    }
  },

  cancelOrder(orderId) {
    if (confirm('ยืนยันยกเลิกออเดอร์นี้?')) {
      db.update('orders', orderId, { order_status: 'Cancelled' });
      document.getElementById('admin-order-modal-overlay').classList.remove('active');
      this.renderOverview();
    }
  },

  updateOrderStatus(orderId, status) {
    db.update('orders', orderId, { order_status: status });
    document.getElementById('admin-order-modal-overlay').classList.remove('active');
    this.renderOverview();
  },

  // CRM Profiles Dashboard Renderer
  renderCRM() {
    const container = document.getElementById('admin-crm-table-body');
    if (!container) return;

    const customers = db.get('customers');
    const orders = db.get('orders');

    if (customers.length === 0) {
      container.innerHTML = `<tr><td colspan="8" style="text-align: center;">ไม่มีข้อมูลลูกค้า</td></tr>`;
      return;
    }

    let html = '';
    customers.forEach(cust => {
      // Gather stats
      const custOrders = orders.filter(o => o.customer_id === cust.id && o.order_status !== 'Cancelled');
      const totalSpend = custOrders.reduce((acc, o) => acc + o.total_amount, 0);
      const orderCount = custOrders.length;
      const aov = orderCount > 0 ? (totalSpend / orderCount).toFixed(1) : 0;

      // Segment classification
      let segment = 'New Customer';
      if (orderCount >= 3 && totalSpend >= 500) segment = 'VIP Customer';
      else if (orderCount >= 2) segment = 'Repeat Customer';
      else if (cust.first_source && cust.first_source.includes('condo')) segment = 'Condo Customer';
      else if (cust.first_source && cust.first_source.includes('office')) segment = 'Office Customer';
      else if (cust.first_source && cust.first_source.includes('google')) segment = 'Google Ads Customer';

      // Detect preference trends from menus ordered
      const menuCounts = {};
      const spicyCounts = {};
      const toppingCounts = {};
      
      custOrders.forEach(o => {
        o.items.forEach(item => {
          menuCounts[item.menu_name] = (menuCounts[item.menu_name] || 0) + item.quantity;
          
          if (item.selected_options['ระดับความเผ็ด']) {
            spicyCounts[item.selected_options['ระดับความเผ็ด']] = (spicyCounts[item.selected_options['ระดับความเผ็ด']] || 0) + item.quantity;
          }
          item.selected_toppings.forEach(t => {
            toppingCounts[t.name] = (toppingCounts[t.name] || 0) + item.quantity;
          });
        });
      });

      // Find top values
      const getTop = (obj) => {
        let max = 0, top = '-';
        Object.entries(obj).forEach(([k,v]) => {
          if (v > max) { max = v; top = k; }
        });
        return top;
      };

      const favMenu = getTop(menuCounts);
      const favSpicy = getTop(spicyCounts);
      const favTopping = getTop(toppingCounts);

      // Render Table Row
      let badgeClass = 'badge-secondary';
      if (segment === 'VIP Customer') badgeClass = 'badge-primary';
      else if (segment === 'Repeat Customer') badgeClass = 'badge-secondary';
      
      html += `
        <tr>
          <td>
            <strong style="color: var(--primary);">${cust.name}</strong>
            <div style="font-size: 0.7rem; color: var(--text-muted);">${cust.phone}</div>
          </td>
          <td><span class="badge ${badgeClass}" style="background: rgba(19, 78, 30, 0.06); color: var(--primary);">${segment}</span></td>
          <td>${orderCount} ครั้ง</td>
          <td><strong>${totalSpend.toLocaleString()} ฿</strong></td>
          <td>${aov} ฿</td>
          <td>
            <div style="font-size: 0.75rem;">
              <strong>เมนู:</strong> ${favMenu}<br>
              <strong>เผ็ด:</strong> ${favSpicy}<br>
              <strong>ท็อปปิ้ง:</strong> ${favTopping}
            </div>
          </td>
          <td>
            <div style="font-size: 0.75rem;">
              <strong>First:</strong> ${cust.first_source ? cust.first_source.replace('src_', '') : '-'}<br>
              <strong>Latest:</strong> ${cust.latest_source ? cust.latest_source.replace('src_', '') : '-'}
            </div>
          </td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="StoreAdmin.viewCRMProfile('${cust.id}', '${segment}', ${orderCount}, ${totalSpend}, ${aov}, '${favMenu}', '${favSpicy}', '${favTopping}')">ดูประวัติ</button>
          </td>
        </tr>
      `;
    });

    container.innerHTML = html;
  },

  viewCRMProfile(custId, segment, orderCount, totalSpend, aov, favMenu, favSpicy, favTopping) {
    const customers = db.get('customers');
    const cust = customers.find(c => c.id === custId);
    if (!cust) return;

    const overlay = document.getElementById('crm-profile-modal-overlay');
    
    document.getElementById('crm-modal-name').textContent = cust.name;
    document.getElementById('crm-modal-segment').textContent = segment;
    document.getElementById('crm-modal-phone').textContent = cust.phone;
    document.getElementById('crm-modal-line').textContent = cust.line_display_name || 'ไม่ได้ผูก LINE';
    document.getElementById('crm-modal-address').textContent = cust.default_address || '-';
    
    // Stats
    document.getElementById('crm-modal-total-orders').textContent = orderCount + ' ครั้ง';
    document.getElementById('crm-modal-total-spend').textContent = totalSpend.toLocaleString() + ' ฿';
    document.getElementById('crm-modal-aov').textContent = aov + ' ฿';
    document.getElementById('crm-modal-fav-menu').textContent = favMenu;
    document.getElementById('crm-modal-fav-spicy').textContent = favSpicy;
    document.getElementById('crm-modal-fav-topping').textContent = favTopping;

    // Timeline list
    const orders = db.get('orders');
    const custOrders = orders.filter(o => o.customer_id === custId).sort((a,b) => new Date(b.order_datetime) - new Date(a.order_datetime));

    const timelineContainer = document.getElementById('crm-modal-orders-timeline');
    let timelineHtml = '';
    
    if (custOrders.length === 0) {
      timelineHtml = '<div style="color: var(--text-muted); font-size: 0.8rem;">ไม่พบประวัติการสั่งซื้อ</div>';
    } else {
      custOrders.forEach(o => {
        const time = formatDateDisplay(o.order_datetime) + ' ' + new Date(o.order_datetime).toLocaleTimeString('th-TH', {hour:'2-digit', minute:'2-digit'});
        const itemsText = o.items.map(i => `${i.menu_name} x ${i.quantity}`).join(', ');
        
        timelineHtml += `
          <div style="background: var(--bg-primary); border:1px solid rgba(19, 78, 30, 0.05); padding: 10px; border-radius: 8px; margin-bottom: 8px; font-size: 0.8rem;">
            <div class="flex-between">
              <strong style="color: var(--primary);">ออเดอร์: ${o.id}</strong>
              <span style="color: var(--accent); font-weight:700;">${o.total_amount} ฿</span>
            </div>
            <div style="color: var(--text-secondary); margin: 2px 0;">${itemsText}</div>
            <div style="font-size: 0.7rem; color: var(--text-muted);">${time} | สถานะ: ${o.order_status} | Source: ${o.source_id || 'Organic'}</div>
          </div>
        `;
      });
    }
    timelineContainer.innerHTML = timelineHtml;

    overlay.classList.add('active');
  },

  // Menu List Management view
  renderMenuManager() {
    const container = document.getElementById('admin-menu-list-container');
    if (!container) return;

    const menus = db.get('menus').sort((a,b) => a.sort_order - b.sort_order);
    const categories = db.get('categories');

    let html = '';
    menus.forEach(menu => {
      const cat = categories.find(c => c.id === menu.category_id);
      const catName = cat ? cat.name : 'ทั่วไป';

      html += `
        <tr id="menu-row-${menu.id}">
          <td><img src="${menu.image}" style="width:40px; height:40px; object-fit:cover; border-radius: 4px;"></td>
          <td><strong style="color: var(--primary);">${menu.name}</strong><br><span style="font-size:0.7rem; color:var(--text-secondary);">${menu.description || ''}</span></td>
          <td>${catName}</td>
          <td><strong>${menu.base_price} ฿</strong></td>
          <td>
            <span class="badge ${menu.status === 'active' ? 'badge-secondary' : 'badge-danger'}" style="background: rgba(19, 78, 30, 0.05); color: var(--primary)">
              ${menu.status === 'active' ? 'เปิดขาย' : 'ปิดขาย'}
            </span>
          </td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="StoreAdmin.toggleMenuStatus('${menu.id}')">สลับสถานะ</button>
            <button class="btn btn-primary btn-sm" onclick="StoreAdmin.openEditMenuModal('${menu.id}')">แก้ไข</button>
            <button class="btn btn-danger btn-sm" onclick="StoreAdmin.deleteMenuProduct('${menu.id}')">ลบ</button>
          </td>
        </tr>
      `;
    });
    container.innerHTML = html;
  },

  toggleMenuStatus(menuId) {
    const menus = db.get('menus');
    const menu = menus.find(m => m.id === menuId);
    if (!menu) return;

    const nextStatus = menu.status === 'active' ? 'inactive' : 'active';
    db.update('menus', menuId, { status: nextStatus });
    this.renderMenuManager();
  },

  deleteMenuProduct(menuId) {
    if (confirm('คุณแน่ใจว่าต้องการลบเมนูนี้?')) {
      db.delete('menus', menuId);
      this.renderMenuManager();
    }
  },

  openEditMenuModal(menuId) {
    const overlay = document.getElementById('menu-edit-modal-overlay');
    const catSelect = document.getElementById('edit-menu-category');
    
    // Find menu
    const menus = db.get('menus');
    const menu = menus.find(m => m.id === menuId);
    if (!menu) return;

    // Populate categories select dropdown
    const categories = db.get('categories');
    let selectHtml = '';
    categories.forEach(c => selectHtml += `<option value="${c.id}">${c.name}</option>`);
    catSelect.innerHTML = selectHtml;

    // Fill inputs
    document.getElementById('edit-menu-id').value = menu.id;
    document.getElementById('edit-menu-name').value = menu.name;
    document.getElementById('edit-menu-category').value = menu.category_id;
    document.getElementById('edit-menu-price').value = menu.base_price;
    document.getElementById('edit-menu-desc').value = menu.description || '';
    document.getElementById('edit-menu-img').value = menu.image || '';
    document.getElementById('edit-menu-recommended').checked = !!menu.recommended;

    // Image preview
    const preview = document.getElementById('edit-menu-preview');
    if (menu.image) {
      preview.src = menu.image;
      preview.style.display = 'block';
    } else {
      preview.style.display = 'none';
    }

    overlay.classList.add('active');
  },

  handleMenuImageUpload(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('edit-menu-preview');
    const urlInput = document.getElementById('edit-menu-img');

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        preview.src = e.target.result;
        preview.style.display = 'block';
        urlInput.value = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  },

  submitEditedMenu() {
    const menuId = document.getElementById('edit-menu-id').value;
    const name = document.getElementById('edit-menu-name').value.trim();
    const catId = document.getElementById('edit-menu-category').value;
    const price = parseInt(document.getElementById('edit-menu-price').value);
    const desc = document.getElementById('edit-menu-desc').value.trim();
    const img = document.getElementById('edit-menu-img').value.trim();
    const isRecommended = document.getElementById('edit-menu-recommended').checked;

    if (!name || isNaN(price)) {
      alert('กรุณากรอกชื่อและราคาอาหาร');
      return;
    }

    // If this is recommended, clear recommended status for all other menu items!
    if (isRecommended) {
      const allMenus = db.get('menus');
      allMenus.forEach(m => {
        if (m.id !== menuId) {
          m.recommended = false;
        }
      });
      db.save('menus', allMenus);
    }

    db.update('menus', menuId, {
      name: name,
      category_id: catId,
      base_price: price,
      description: desc,
      image: img || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
      recommended: isRecommended
    });

    document.getElementById('menu-edit-modal-overlay').classList.remove('active');
    this.renderMenuManager();
    
    // If we're currently in Customer role, re-render
    if (state.activeRole === 'customer') {
      CustomerApp.renderCircularCategories();
      CustomerApp.renderCategories();
      CustomerApp.renderFeaturedMenu();
      CustomerApp.renderMenus();
    }
  },

  loadSettings() {
    const settings = db.get('settings') || {
      hero_title: 'อาหารอร่อย\nสำหรับ[gold]ทุกมื้อ[/gold]',
      hero_desc: 'ครัวพระคุณปรุงอาหารโฮมเมดสดใหม่ เลือกเมนูโปรด ปรับตัวเลือก และสั่งผ่าน LINE ได้ง่ายในไม่กี่ขั้นตอน'
    };
    
    const titleInput = document.getElementById('setting-hero-title');
    const descInput = document.getElementById('setting-hero-desc');
    
    if (titleInput) titleInput.value = settings.hero_title;
    if (descInput) descInput.value = settings.hero_desc;
  },

  saveSettings() {
    const titleInput = document.getElementById('setting-hero-title');
    const descInput = document.getElementById('setting-hero-desc');
    
    if (!titleInput || !descInput) return;
    
    const title = titleInput.value.trim();
    const desc = descInput.value.trim();
    
    if (!title || !desc) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    
    const settings = {
      hero_title: title,
      hero_desc: desc
    };
    
    db.save('settings', settings);
    alert('บันทึกการตั้งค่าหน้าเว็บสำเร็จ!');
    
    // Update Customer View dynamically if active
    if (state.activeRole === 'customer') {
      CustomerApp.renderHeroSection();
    }
  },

  openAddMenuModal() {
    const overlay = document.getElementById('menu-add-modal-overlay');
    const catSelect = document.getElementById('add-menu-category');
    
    // Populate categories select dropdown
    const categories = db.get('categories');
    let selectHtml = '';
    categories.forEach(c => selectHtml += `<option value="${c.id}">${c.name}</option>`);
    catSelect.innerHTML = selectHtml;

    // Reset inputs
    document.getElementById('add-menu-name').value = '';
    document.getElementById('add-menu-price').value = '';
    document.getElementById('add-menu-desc').value = '';
    document.getElementById('add-menu-img').value = '';

    overlay.classList.add('active');
  },

  submitNewMenu() {
    const name = document.getElementById('add-menu-name').value.trim();
    const catId = document.getElementById('add-menu-category').value;
    const price = parseInt(document.getElementById('add-menu-price').value);
    const desc = document.getElementById('add-menu-desc').value.trim();
    let img = document.getElementById('add-menu-img').value.trim();

    if (!name || isNaN(price)) {
      alert('กรุณากรอกชื่อและราคาอาหาร');
      return;
    }

    if (!img) {
      img = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80'; // default food img
    }

    const menus = db.get('menus');
    const newMenu = {
      id: 'menu_' + Date.now(),
      name: name,
      category_id: catId,
      description: desc,
      image: img,
      base_price: price,
      status: 'active',
      recommended: false,
      spicy_option_available: true,
      topping_available: true,
      sort_order: menus.length + 1
    };

    db.insert('menus', newMenu);
    document.getElementById('menu-add-modal-overlay').classList.remove('active');
    this.renderMenuManager();
  },

  // Export tables as CSV Downloads
  exportCSV(type) {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // Include BOM for Excel Thai language support
    let fileName = '';

    if (type === 'orders') {
      fileName = 'kruaprakhun_orders.csv';
      const headers = ["Order ID", "Date", "Customer Name", "Phone", "Subtotal", "Delivery Fee", "Discount", "Total Amount", "Status", "Payment", "Source", "Campaign"];
      csvContent += headers.join(",") + "\n";

      const orders = db.get('orders');
      orders.forEach(o => {
        const orderTimeStr = o.order_datetime ? formatDateDisplay(o.order_datetime) + ' ' + new Date(o.order_datetime).toLocaleTimeString('th-TH', {hour: '2-digit', minute: '2-digit'}) : '-';
        const row = [
          o.id,
          `"${orderTimeStr}"`,
          `"${o.customer_name}"`,
          `"${o.customer_phone}"`,
          o.subtotal,
          o.delivery_fee,
          o.discount,
          o.total_amount,
          o.order_status,
          o.payment_status,
          o.source_id || 'Organic',
          o.campaign_id || '-'
        ];
        csvContent += row.join(",") + "\n";
      });
    } else if (type === 'customers') {
      fileName = 'kruaprakhun_customers_crm.csv';
      const headers = ["Customer ID", "Name", "Phone", "LINE", "Created At", "First Source", "Latest Source", "Consent Marketing"];
      csvContent += headers.join(",") + "\n";

      const customers = db.get('customers');
      customers.forEach(c => {
        const row = [
          c.id,
          `"${c.name}"`,
          `"${c.phone}"`,
          `"${c.line_display_name || '-'}"`,
          formatDateDisplay(c.created_at),
          c.first_source || 'Organic',
          c.latest_source || 'Organic',
          c.consent_marketing ? "YES" : "NO"
        ];
        csvContent += row.join(",") + "\n";
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  handleLedgerFormTypeChange() {
    const type = document.getElementById('led-type').value;
    const catSelect = document.getElementById('led-category');
    const menuSection = document.getElementById('led-menu-sales-section');
    const unitSection = document.getElementById('led-expense-unit-section');
    const vendorGroup = document.getElementById('led-vendor-group');
    const productGroup = document.getElementById('led-product-group');
    
    // Clear and build categories options based on type
    catSelect.innerHTML = '';
    
    if (type === 'income') {
      const incomeOptions = [
        { val: 'ขายอาหาร', text: 'ขายอาหาร' },
        { val: 'อื่นๆ', text: 'อื่นๆ' }
      ];
      incomeOptions.forEach(opt => {
        const el = document.createElement('option');
        el.value = opt.val;
        el.textContent = opt.text;
        catSelect.appendChild(el);
      });
      if (unitSection) unitSection.style.display = 'none';
      if (vendorGroup) vendorGroup.style.display = 'none';
      if (productGroup) productGroup.style.display = 'none';
      this.handleLedgerCategoryChange();
    } else {
      const expenseOptions = [
        { val: 'เนื้อสัตว์', text: 'เนื้อสัตว์' },
        { val: 'ผัก', text: 'ผัก' },
        { val: 'เครื่องปรุง', text: 'เครื่องปรุง' },
        { val: 'อาหารแห้ง', text: 'อาหารแห้ง' },
        { val: 'Packaging', text: 'Packaging (บรรจุภัณฑ์)' },
        { val: 'ค่าขนส่ง', text: 'ค่าขนส่ง' },
        { val: 'ค่าจ้าง', text: 'ค่าจ้าง' },
        { val: 'ค่าเช่า', text: 'ค่าเช่า' },
        { val: 'ค่าน้ำ', text: 'ค่าน้ำ' },
        { val: 'ค่าไฟ', text: 'ค่าไฟ' },
        { val: 'อื่นๆ', text: 'อื่นๆ' }
      ];
      expenseOptions.forEach(opt => {
        const el = document.createElement('option');
        el.value = opt.val;
        el.textContent = opt.text;
        catSelect.appendChild(el);
      });
      if (menuSection) menuSection.style.display = 'none';
      if (unitSection) unitSection.style.display = 'grid';
      if (vendorGroup) vendorGroup.style.display = 'block';
      if (productGroup) productGroup.style.display = 'block';
    }
  },

  handleLedgerCategoryChange() {
    const type = document.getElementById('led-type').value;
    const category = document.getElementById('led-category').value;
    const menuSection = document.getElementById('led-menu-sales-section');
    
    if (type === 'income' && category === 'ขายอาหาร') {
      menuSection.style.display = 'block';
      const menuSelect = document.getElementById('led-menu-select');
      menuSelect.innerHTML = '';
      
      const menus = db.get('menus') || [];
      
      // Add custom menu option first
      const customEl = document.createElement('option');
      customEl.value = 'custom';
      customEl.textContent = '-- กรอกชื่อเมนูเอง --';
      menuSelect.appendChild(customEl);
      
      menus.forEach(m => {
        const el = document.createElement('option');
        el.value = m.id;
        el.textContent = m.name;
        el.dataset.price = m.base_price;
        menuSelect.appendChild(el);
      });
      this.handleLedgerMenuSelectChange();
    } else {
      menuSection.style.display = 'none';
    }
  },

  handleLedgerMenuSelectChange() {
    const menuSelect = document.getElementById('led-menu-select');
    if (!menuSelect) return;
    const selectedValue = menuSelect.value;
    const customGroup = document.getElementById('led-custom-menu-group');
    const priceGroup = document.getElementById('led-menu-price-group');
    
    let basePrice = 0;
    if (selectedValue === 'custom') {
      if (customGroup) customGroup.style.display = 'block';
      if (priceGroup) priceGroup.style.display = 'block';
      basePrice = parseFloat(document.getElementById('led-menu-price').value) || 0;
    } else {
      if (customGroup) customGroup.style.display = 'none';
      if (priceGroup) priceGroup.style.display = 'none';
      const selectedOption = menuSelect.options[menuSelect.selectedIndex];
      if (selectedOption) {
        basePrice = parseFloat(selectedOption.dataset.price) || 0;
      }
    }
    
    const qty = parseInt(document.getElementById('led-quantity').value) || 1;
    const mainTotal = basePrice * qty;
    
    // Top-ups sum calculation
    const t1Qty = parseInt(document.getElementById('led-topup1-qty').value) || 1;
    const t1Price = parseFloat(document.getElementById('led-topup1-price').value) || 0;
    const t1Total = t1Qty * t1Price;
    
    const t2Qty = parseInt(document.getElementById('led-topup2-qty').value) || 1;
    const t2Price = parseFloat(document.getElementById('led-topup2-price').value) || 0;
    const t2Total = t2Qty * t2Price;
    
    document.getElementById('led-amount').value = Math.round(mainTotal + t1Total + t2Total);
  },

  calculateLedgerExpenseTotal() {
    const qty = parseFloat(document.getElementById('led-unit-qty').value) || 0;
    const price = parseFloat(document.getElementById('led-unit-price').value) || 0;
    if (qty > 0 && price > 0) {
      document.getElementById('led-amount').value = Math.round(qty * price);
    }
  },

  renderLedger() {
    try {
      // 1. Initial defaults
      const dateInput = document.getElementById('led-date');
      if (dateInput && !dateInput.value) {
        dateInput.value = new Date().toISOString().split('T')[0];
      }
      
      // Populate dropdown in form if empty
      const menuSelect = document.getElementById('led-menu-select');
      if (menuSelect && menuSelect.options.length === 0) {
        const menus = db.get('menus') || [];
        menus.forEach(m => {
          const el = document.createElement('option');
          el.value = m.id;
          el.textContent = m.name;
          el.dataset.price = m.base_price;
          menuSelect.appendChild(el);
        });
      }

      // 2. Fetch data sources
      const orders = db.get('orders') || [];
      const manualLedger = db.get('ledger') || [];
      
      // Create virtual ledger items from verified orders
      const validOrders = orders.filter(o => o.order_status !== 'Cancelled' && o.payment_status !== 'Rejected');
      const virtualOrderItems = validOrders.map(o => {
        const orderIdStr = o.order_id ? String(o.order_id) : '';
        const orderDateStr = (o.order_datetime && typeof o.order_datetime === 'string') 
          ? o.order_datetime.split(' ')[0] 
          : new Date().toISOString().split('T')[0];
        return {
          id: o.order_id || 'v_order_' + Math.random().toString(36).substr(2, 5),
          date: orderDateStr,
          type: 'income',
          category: 'ขายอาหาร',
          menu_id: null,
          menu_name: orderIdStr ? `ออเดอร์เว็บ (ID: ${orderIdStr.substr(-5).toUpperCase()})` : 'ออเดอร์เว็บ',
          quantity: null,
          amount: parseFloat(o.total_amount) || 0,
          description: `ลูกค้าสั่งผ่านเว็บ / LINE LIFF`,
          isVirtual: true
        };
      });

      const combinedLedger = [...manualLedger, ...virtualOrderItems];
      
      // Sort combined by date descending safely
      combinedLedger.sort((a, b) => {
        const dateA = a.date || '';
        const dateB = b.date || '';
        return dateB.localeCompare(dateA);
      });

      // 3. Apply Filters
      const startDate = document.getElementById('filter-start-date').value;
      const endDate = document.getElementById('filter-end-date').value;
      const filterType = document.getElementById('filter-type').value;
      const filterCategory = document.getElementById('filter-category').value;

      const filteredLedger = combinedLedger.filter(item => {
        if (startDate && item.date < startDate) return false;
        if (endDate && item.date > endDate) return false;
        if (filterType !== 'all' && item.type !== filterType) return false;
        if (filterCategory !== 'all' && item.category !== filterCategory) return false;
        return true;
      });

      // 4. Calculate Summaries on filtered dataset to reflect date/category selections
      const totalRevenue = filteredLedger.filter(i => i.type === 'income').reduce((acc, i) => acc + (parseFloat(i.amount) || 0), 0);
      const totalExpenses = filteredLedger.filter(i => i.type === 'expense').reduce((acc, i) => acc + (parseFloat(i.amount) || 0), 0);
      const netProfit = totalRevenue - totalExpenses;

      document.getElementById('ledger-revenue-val').textContent = totalRevenue.toLocaleString() + ' ฿';
      document.getElementById('ledger-expenses-val').textContent = totalExpenses.toLocaleString() + ' ฿';
      
      const profitEl = document.getElementById('ledger-profit-val');
      profitEl.textContent = netProfit.toLocaleString() + ' ฿';
      if (netProfit >= 0) {
        profitEl.style.color = 'var(--primary)';
      } else {
        profitEl.style.color = '#ef4444';
      }

      // 5. Calculate Top 5 Best-Sellers (Unfiltered / Overall logic to match paper requirements)
      const menuSales = {};
      
      // Accumulate manual menu sales
      combinedLedger.forEach(item => {
        if (item.type === 'income' && item.category === 'ขายอาหาร' && item.quantity) {
          const name = item.menu_name || 'ไม่ระบุชื่อเมนู';
          const qty = parseInt(item.quantity) || 0;
          menuSales[name] = (menuSales[name] || 0) + qty;
        }
      });
      
      // Accumulate online sales
      validOrders.forEach(o => {
        if (o.items) {
          o.items.forEach(it => {
            const name = it.menu_name;
            const qty = parseInt(it.quantity) || 0;
            menuSales[name] = (menuSales[name] || 0) + qty;
          });
        }
      });

      const sortedBestSellers = Object.entries(menuSales)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      let bHtml = '';
      if (sortedBestSellers.length === 0) {
        bHtml = '<div style="text-align: center; color: var(--text-secondary); font-size: 0.75rem; padding: 10px 0;">ไม่มีข้อมูลยอดขาย</div>';
      } else {
        sortedBestSellers.forEach(([name, qty], index) => {
          bHtml += `
            <div class="bestseller-item">
              <span class="bestseller-rank">#${index + 1}</span>
              <span class="bestseller-name">${name}</span>
              <span class="bestseller-qty">${qty} จาน</span>
            </div>
          `;
        });
      }
      document.getElementById('ledger-bestsellers-list').innerHTML = bHtml;

      // 6. Render table rows
      let tHtml = '';
      if (filteredLedger.length === 0) {
        tHtml = '<tr><td colspan="6" style="text-align: center; padding: 30px; color: var(--text-secondary);">ไม่พบรายการในระบบ</td></tr>';
      } else {
        filteredLedger.forEach(item => {
          const typeBadge = item.type === 'income' 
            ? `<span class="ledger-badge-income">รายรับ</span>` 
            : `<span class="ledger-badge-expense">รายจ่าย</span>`;
             
          const catTag = `<span class="ledger-cat-tag">${item.category}</span>`;
          const editBtn = item.isVirtual 
            ? '' 
            : `<button class="btn-action btn-edit" onclick="StoreAdmin.editLedgerItem('${item.id}')" style="color: var(--primary); background: none; border: none; cursor: pointer; font-size: 0.95rem; margin-right: 8px;">✏️</button>`;
            
          const deleteBtn = item.isVirtual 
            ? `<span style="color: var(--text-muted); font-size: 0.7rem; font-style: italic;">ออเดอร์เว็บ</span>`
            : `<button class="btn-action btn-delete" onclick="StoreAdmin.deleteLedgerItem('${item.id}')" style="color: #ef4444; background: none; border: none; cursor: pointer; font-size: 1.2rem; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px;">×</button>`;
             
          const itemAmt = parseFloat(item.amount) || 0;
          const formattedAmount = (item.type === 'income' ? '+' : '-') + itemAmt.toLocaleString() + ' ฿';
          const amountStyle = item.type === 'income' ? 'color: var(--primary); font-weight: 700; text-align: right;' : 'color: #ef4444; font-weight: 700; text-align: right;';
          
          let displayDesc = '';
          if (item.type === 'expense') {
            const prod = item.product_name || item.category || 'สินค้า';
            displayDesc = `ซื้อ${prod}`;
            
            if (item.quantity !== null && item.quantity !== undefined && !isNaN(parseFloat(item.quantity))) {
              displayDesc += ` ${item.quantity}`;
              if (item.unit) {
                displayDesc += `${item.unit}`;
              }
            }
            
            if (item.unit_price !== null && item.unit_price !== undefined && !isNaN(parseFloat(item.unit_price))) {
              displayDesc += ` @${item.unit_price} บาท`;
              if (item.unit) {
                displayDesc += `/${item.unit}`;
              }
            }
            
            if (item.vendor) {
              displayDesc += ` (ร้าน : ${item.vendor})`;
            }
            
            const isOldAutoDesc = item.description && (item.description.startsWith('ซื้อ') || item.description.includes('ร้าน:'));
            if (item.description && !isOldAutoDesc) {
              displayDesc += ` - ${item.description}`;
            }
          } else {
            if (item.category === 'ขายอาหาร') {
              const menuName = item.menu_name || 'ขายอาหาร';
              displayDesc = `ขายอาหาร: ${menuName}`;
              if (item.quantity) {
                displayDesc += ` ${item.quantity} จาน`;
              }
              if (item.unit_price) {
                displayDesc += ` @${item.unit_price} ฿`;
              }
              
              if (item.topup1_name) {
                displayDesc += ` + ${item.topup1_name}`;
                if (item.topup1_qty && item.topup1_qty > 1) {
                  displayDesc += ` ${item.topup1_qty} ฟอง`;
                }
                if (item.topup1_price) {
                  displayDesc += ` (${item.topup1_price * (item.topup1_qty || 1)} ฿)`;
                }
              }
              if (item.topup2_name) {
                displayDesc += ` + ${item.topup2_name}`;
                if (item.topup2_qty && item.topup2_qty > 1) {
                  displayDesc += ` ${item.topup2_qty} ฟอง`;
                }
                if (item.topup2_price) {
                  displayDesc += ` (${item.topup2_price * (item.topup2_qty || 1)} ฿)`;
                }
              }
              
              if (item.description) {
                displayDesc += ` - ${item.description}`;
              }
            } else {
              displayDesc = item.description || 'ขายอาหาร';
            }
          }

          tHtml += `
            <tr style="border-bottom: 1px solid rgba(19, 78, 30, 0.04); height: 45px;">
              <td style="padding: 8px;">${formatDateDisplay(item.date)}</td>
              <td style="padding: 8px;">${typeBadge}</td>
              <td style="padding: 8px;">${catTag}</td>
              <td style="padding: 8px; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${item.description || ''}">${displayDesc}</td>
              <td style="padding: 8px; ${amountStyle}">${formattedAmount}</td>
              <td style="padding: 8px; text-align: center; display: flex; align-items: center; justify-content: center; height: 45px;">${editBtn}${deleteBtn}</td>
            </tr>
          `;
        });
      }
      document.getElementById('ledger-table-body').innerHTML = tHtml;
    } catch (err) {
      console.error("Error rendering ledger:", err);
      const tbody = document.getElementById('ledger-table-body');
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="6" style="color: #ef4444; text-align: center; padding: 20px;">เกิดข้อผิดพลาดในการโหลดข้อมูล: ${err.message}</td></tr>`;
      }
    }
  },

  addLedgerItem(event) {
    if (event) event.preventDefault();
    
    const type = document.getElementById('led-type').value;
    const category = document.getElementById('led-category').value;
    const date = document.getElementById('led-date').value;
    const amount = parseFloat(document.getElementById('led-amount').value) || 0;
    let desc = document.getElementById('led-desc').value.trim();
    
    let menuId = null;
    let menuName = null;
    let quantity = null;
    let unitPrice = null;
    let unitLabel = null;
    let vendor = null;
    let productName = null;
    
    let topup1_name = null;
    let topup1_qty = null;
    let topup1_price = null;
    let topup2_name = null;
    let topup2_qty = null;
    let topup2_price = null;

    if (type === 'income' && category === 'ขายอาหาร') {
      const menuSelect = document.getElementById('led-menu-select');
      menuId = menuSelect.value;
      if (menuId === 'custom') {
        menuName = document.getElementById('led-custom-menu-name').value.trim() || 'เมนูพิเศษ';
        unitPrice = parseFloat(document.getElementById('led-menu-price').value) || 0;
      } else {
        menuName = menuSelect.options[menuSelect.selectedIndex].text;
        const selectedOption = menuSelect.options[menuSelect.selectedIndex];
        unitPrice = selectedOption ? (parseFloat(selectedOption.dataset.price) || 0) : 0;
      }
      quantity = parseInt(document.getElementById('led-quantity').value) || 1;
      
      // Top-ups
      const t1Name = document.getElementById('led-topup1-name').value.trim();
      const t1Qty = parseInt(document.getElementById('led-topup1-qty').value) || 1;
      const t1Price = parseFloat(document.getElementById('led-topup1-price').value);
      if (t1Name) {
        topup1_name = t1Name;
        topup1_qty = t1Qty;
        topup1_price = !isNaN(t1Price) ? t1Price : 0;
      }

      const t2Name = document.getElementById('led-topup2-name').value.trim();
      const t2Qty = parseInt(document.getElementById('led-topup2-qty').value) || 1;
      const t2Price = parseFloat(document.getElementById('led-topup2-price').value);
      if (t2Name) {
        topup2_name = t2Name;
        topup2_qty = t2Qty;
        topup2_price = !isNaN(t2Price) ? t2Price : 0;
      }
    } else if (type === 'expense') {
      const uQty = parseFloat(document.getElementById('led-unit-qty').value);
      const uPrice = parseFloat(document.getElementById('led-unit-price').value);
      const uLabel = document.getElementById('led-unit-label').value.trim();
      const vend = document.getElementById('led-vendor').value.trim();
      const pName = document.getElementById('led-product-name').value.trim();
      
      quantity = !isNaN(uQty) ? uQty : null;
      unitPrice = !isNaN(uPrice) ? uPrice : null;
      unitLabel = uLabel || null;
      vendor = vend || null;
      productName = pName || null;
    }
    
    const itemData = {
      date,
      type,
      category,
      menu_id: menuId,
      menu_name: menuName,
      product_name: productName,
      quantity,
      unit_price: unitPrice,
      unit: unitLabel,
      vendor,
      amount,
      topup1_name,
      topup1_qty,
      topup1_price,
      topup2_name,
      topup2_qty,
      topup2_price,
      description: desc || ""
    };

    if (state.editingLedgerId) {
      // Update existing item
      db.update('ledger', state.editingLedgerId, itemData);
      
      // Reset Edit state
      state.editingLedgerId = null;
      document.getElementById('led-submit-btn').innerHTML = '💾 บันทึกรายการ';
      document.getElementById('led-cancel-btn').style.display = 'none';
      alert('บันทึกการแก้ไขรายการสำเร็จ!');
    } else {
      // Insert new item
      const id = 'led_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
      db.insert('ledger', { id, ...itemData });
      alert('บันทึกรายการสำเร็จ!');
    }
    
    // Reset category to defaults based on type
    if (type === 'income') {
      document.getElementById('led-category').value = 'ขายอาหาร';
    } else {
      document.getElementById('led-category').value = 'เนื้อสัตว์';
    }
    this.handleLedgerCategoryChange();
    
    // Clear form and re-render
    document.getElementById('led-amount').value = '';
    document.getElementById('led-desc').value = '';
    document.getElementById('led-quantity').value = '1';
    document.getElementById('led-unit-qty').value = '';
    document.getElementById('led-unit-label').value = '';
    document.getElementById('led-unit-price').value = '';
    document.getElementById('led-vendor').value = '';
    document.getElementById('led-product-name').value = '';
    document.getElementById('led-custom-menu-name').value = '';
    document.getElementById('led-menu-price').value = '';
    document.getElementById('led-topup1-name').value = '';
    document.getElementById('led-topup1-qty').value = '1';
    document.getElementById('led-topup1-price').value = '';
    document.getElementById('led-topup2-name').value = '';
    document.getElementById('led-topup2-qty').value = '1';
    document.getElementById('led-topup2-price').value = '';
    
    this.renderLedger();
  },

  editLedgerItem(id) {
    const ledger = db.get('ledger') || [];
    const item = ledger.find(it => it.id === id);
    if (!item) return;

    // Set edit state
    state.editingLedgerId = id;
    
    // Populate form fields
    document.getElementById('led-type').value = item.type;
    this.handleLedgerFormTypeChange();
    
    document.getElementById('led-category').value = item.category;
    this.handleLedgerCategoryChange();
    
    if (item.type === 'income' && item.category === 'ขายอาหาร') {
      document.getElementById('led-menu-select').value = item.menu_id || 'custom';
      this.handleLedgerMenuSelectChange();
      
      if (item.menu_id === 'custom') {
        document.getElementById('led-custom-menu-name').value = item.menu_name || '';
        document.getElementById('led-menu-price').value = item.unit_price || '';
      }
      document.getElementById('led-quantity').value = item.quantity || '1';
      
      // Top-ups
      document.getElementById('led-topup1-name').value = item.topup1_name || '';
      document.getElementById('led-topup1-qty').value = item.topup1_qty || '1';
      document.getElementById('led-topup1-price').value = item.topup1_price !== null && item.topup1_price !== undefined ? item.topup1_price : '';
      
      document.getElementById('led-topup2-name').value = item.topup2_name || '';
      document.getElementById('led-topup2-qty').value = item.topup2_qty || '1';
      document.getElementById('led-topup2-price').value = item.topup2_price !== null && item.topup2_price !== undefined ? item.topup2_price : '';
    } else if (item.type === 'expense') {
      document.getElementById('led-product-name').value = item.product_name || '';
      document.getElementById('led-unit-qty').value = item.quantity || '';
      document.getElementById('led-unit-label').value = item.unit || '';
      document.getElementById('led-unit-price').value = item.unit_price || '';
      document.getElementById('led-vendor').value = item.vendor || '';
    }
    
    document.getElementById('led-date').value = item.date;
    document.getElementById('led-amount').value = item.amount;
    
    const isOldAutoDesc = item.description && (item.description.startsWith('ซื้อ') || item.description.includes('ร้าน:'));
    document.getElementById('led-desc').value = isOldAutoDesc ? '' : (item.description || '');

    // Change button styles
    document.getElementById('led-submit-btn').innerHTML = '💾 บันทึกการแก้ไข';
    document.getElementById('led-cancel-btn').style.display = 'block';

    // Scroll form into view smoothly
    document.getElementById('ledger-entry-form').scrollIntoView({ behavior: 'smooth' });
  },

  cancelLedgerEdit() {
    state.editingLedgerId = null;
    
    // Clear and restore form
    document.getElementById('led-amount').value = '';
    document.getElementById('led-desc').value = '';
    document.getElementById('led-quantity').value = '1';
    document.getElementById('led-unit-qty').value = '';
    document.getElementById('led-unit-label').value = '';
    document.getElementById('led-unit-price').value = '';
    document.getElementById('led-vendor').value = '';
    document.getElementById('led-product-name').value = '';
    document.getElementById('led-custom-menu-name').value = '';
    document.getElementById('led-menu-price').value = '';
    document.getElementById('led-topup1-name').value = '';
    document.getElementById('led-topup1-qty').value = '1';
    document.getElementById('led-topup1-price').value = '';
    document.getElementById('led-topup2-name').value = '';
    document.getElementById('led-topup2-qty').value = '1';
    document.getElementById('led-topup2-price').value = '';
    document.getElementById('led-type').value = 'expense';
    this.handleLedgerFormTypeChange();
    
    document.getElementById('led-submit-btn').innerHTML = '💾 บันทึกรายการ';
    document.getElementById('led-cancel-btn').style.display = 'none';
  },

  deleteLedgerItem(id) {
    if (confirm('คุณต้องการลบรายการบัญชีนี้ใช่หรือไม่?')) {
      // If we are currently editing the deleted item, cancel editing first
      if (state.editingLedgerId === id) {
        this.cancelLedgerEdit();
      }
      db.delete('ledger', id);
      this.renderLedger();
    }
  },

  exportLedgerCSV() {
    const orders = db.get('orders') || [];
    const manualLedger = db.get('ledger') || [];
    
    // Create virtual ledger items from verified orders
    const validOrders = orders.filter(o => o.order_status !== 'Cancelled' && o.payment_status !== 'Rejected');
    const virtualOrderItems = validOrders.map(o => ({
      date: o.order_datetime.split(' ')[0],
      type: 'income',
      category: 'ขายอาหาร',
      menu_name: `ยอดขายออนไลน์ (ออเดอร์ #${o.order_id.substr(-5).toUpperCase()})`,
      quantity: 1,
      unit: 'บิล',
      unit_price: o.total_amount,
      vendor: 'เว็บออนไลน์',
      amount: o.total_amount,
      description: 'ลูกค้าสั่งอาหารผ่านเว็บ/LINE LIFF'
    }));

    const combinedLedger = [...manualLedger, ...virtualOrderItems];
    combinedLedger.sort((a, b) => b.date.localeCompare(a.date));

    // Construct structured CSV file
    let csvContent = "\uFEFF"; // Add UTF-8 BOM for Microsoft Excel Thai support
    const headers = [
      "วันที่ (Date)", 
      "ประเภท (Type)", 
      "หมวดหมู่ (Category)", 
      "ชื่อสินค้า/เมนู (Item Name)", 
      "จำนวน (Qty)", 
      "หน่วยนับ (Unit)", 
      "ราคาต่อหน่วย (Unit Price)", 
      "แหล่งซื้อสินค้า (Vendor)", 
      "จำนวนเงินรวม (Total Amount)", 
      "รายละเอียด (Description)"
    ];
    csvContent += headers.join(",") + "\r\n";

    combinedLedger.forEach(item => {
      const typeStr = item.type === 'income' ? 'รายรับ (Income)' : 'รายจ่าย (Expense)';
      const itemName = item.type === 'expense' ? (item.product_name || item.category) : (item.menu_name || '-');
      const qtyStr = item.quantity !== null && item.quantity !== undefined ? item.quantity : '-';
      const unitStr = item.unit || '-';
      const uPriceStr = item.unit_price !== null && item.unit_price !== undefined ? item.unit_price : '-';
      const vendorStr = item.vendor || '-';
      const descStr = item.description || '';

      let cleanDesc = descStr;
      const isOldAutoDesc = descStr && (descStr.startsWith('ซื้อ') || descStr.includes('ร้าน:'));
      if (isOldAutoDesc) {
        cleanDesc = '';
      }

      const row = [
        formatDateDisplay(item.date),
        `"${typeStr}"`,
        `"${item.category}"`,
        `"${itemName}"`,
        qtyStr,
        `"${unitStr}"`,
        uPriceStr,
        `"${vendorStr}"`,
        item.amount,
        `"${cleanDesc.replace(/"/g, '""')}"`
      ];
      csvContent += row.join(",") + "\r\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `kruaprakhun_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// ==========================================
// 7. KITCHEN BOARD CONTROLLER
// ==========================================
const KitchenApp = {
  renderBoard() {
    const orders = db.get('orders');
    
    const activeOrders = orders.filter(o => 
      o.order_status !== 'Completed' && 
      o.order_status !== 'Cancelled'
    );

    // Columns mapping
    const containers = {
      'new': document.getElementById('kit-container-new'),
      'accepted': document.getElementById('kit-container-accepted'),
      'cooking': document.getElementById('kit-container-cooking'),
      'delivery': document.getElementById('kit-container-ready')
    };

    // Clear old HTML
    Object.values(containers).forEach(container => {
      if (container) container.innerHTML = '';
    });

    const colCounts = { new: 0, accepted: 0, cooking: 0, delivery: 0 };

    activeOrders.forEach(o => {
      let colKey = '';
      if (o.order_status === 'Paid / Waiting Verify') colKey = 'new';
      else if (o.order_status === 'Accepted') colKey = 'accepted';
      else if (o.order_status === 'Cooking') colKey = 'cooking';
      else if (o.order_status === 'Ready for Delivery' || o.order_status === 'Out for Delivery') colKey = 'delivery';

      const container = containers[colKey];
      if (!container) return;

      colCounts[colKey]++;

      // Calculate elapsed time in minutes
      const diffMs = Date.now() - new Date(o.order_datetime).getTime();
      const elapsedMin = Math.floor(diffMs / 60000);

      // Render Items list details
      let itemsHtml = '';
      o.items.forEach(item => {
        const optionDetails = Object.entries(item.selected_options)
          .map(([k, v]) => `${k}: ${v}`).join(', ');
        const toppingDetails = item.selected_toppings.map(t => t.name).join(', ');
        
        const details = [optionDetails, toppingDetails].filter(x => x).join(' | ');

        // Highlights spicy level extra in red text for chef attention
        const isSpicy = optionDetails.includes('เผ็ดมาก') ? 'style="color: var(--danger); font-weight:700;"' : '';

        itemsHtml += `
          <div class="kitchen-card-item">
            <span class="kitchen-card-item-qty" style="color:var(--accent); font-weight:700;">${item.quantity}x</span> 
            <span ${isSpicy} style="font-weight:600; color:var(--primary);">${item.menu_name}</span>
            ${details ? `<div class="kitchen-card-item-options" style="font-size:0.75rem; border-left: 2px solid var(--accent); padding-left:5px;">${details}</div>` : ''}
            ${item.item_note ? `<div class="kitchen-card-note">* Note: ${item.item_note}</div>` : ''}
          </div>
        `;
      });

      // Quick action button html
      let actionBtnHtml = '';
      if (colKey === 'new') {
        actionBtnHtml = `<button class="btn btn-secondary btn-sm btn-primary" onclick="KitchenApp.advanceStatus('${o.id}', 'Accepted')">รับคำสั่งซื้อ</button>`;
      } else if (colKey === 'accepted') {
        actionBtnHtml = `<button class="btn btn-primary btn-sm" onclick="KitchenApp.advanceStatus('${o.id}', 'Cooking')">เริ่มปรุงอาหาร</button>`;
      } else if (colKey === 'cooking') {
        actionBtnHtml = `<button class="btn btn-primary btn-sm" style="background: var(--accent); color: white;" onclick="KitchenApp.advanceStatus('${o.id}', 'Ready for Delivery')">ปรุงสำเร็จ (พร้อมส่ง)</button>`;
      } else if (colKey === 'delivery') {
        actionBtnHtml = `<button class="btn btn-secondary btn-sm" onclick="KitchenApp.advanceStatus('${o.id}', 'Completed')">ปิดออเดอร์ (จัดส่งแล้ว)</button>`;
      }

      const orderCard = document.createElement('div');
      orderCard.className = `kitchen-card`;
      orderCard.innerHTML = `
        <div class="kitchen-card-header">
          <strong>#${o.id}</strong>
          <span class="kitchen-card-time">${elapsedMin} นาทีที่แล้ว</span>
        </div>
        <div style="font-size:0.75rem; color: var(--text-secondary); margin-bottom: 8px;">
          ลูกค้า: ${o.customer_name} | <a href="tel:${o.customer_phone}" style="color:var(--accent); text-decoration:none; font-weight:700;">📞 โทรหา</a>
        </div>
        <div class="kitchen-card-items">
          ${itemsHtml}
        </div>
        <div class="kitchen-card-actions">
          ${actionBtnHtml}
        </div>
      `;

      container.appendChild(orderCard);
    });

    // Update column counters
    document.getElementById('kit-count-new').textContent = colCounts.new;
    document.getElementById('kit-count-accepted').textContent = colCounts.accepted;
    document.getElementById('kit-count-cooking').textContent = colCounts.cooking;
    document.getElementById('kit-count-ready').textContent = colCounts.delivery;

    // Track state to trigger notification chime if New order counts increased
    if (state.lastNewCount === undefined) {
      state.lastNewCount = colCounts.new;
    } else if (colCounts.new > state.lastNewCount) {
      AudioHelper.playAlert();
      state.lastNewCount = colCounts.new;
    } else {
      state.lastNewCount = colCounts.new;
    }
  },

  advanceStatus(orderId, nextStatus) {
    const updates = { order_status: nextStatus };
    if (nextStatus === 'Accepted') {
      updates.payment_status = 'Verified';
    }
    
    db.update('orders', orderId, updates);
    this.renderBoard();
    
    if (state.activeRole === 'admin') StoreAdmin.renderOverview();
  }
};

// ==========================================
// 8. MARKETING CAMPAIGN & LINK BUILDER
// ==========================================
const MarketingApp = {
  renderCampaigns() {
    const listContainer = document.getElementById('mkt-campaign-list');
    const selectCampaign = document.getElementById('gen-campaign-select');
    if (!listContainer) return;

    const campaigns = db.get('campaigns');
    let listHtml = '';
    let selectHtml = '';

    campaigns.forEach(camp => {
      listHtml += `
        <tr>
          <td><strong>${camp.id}</strong></td>
          <td><strong>${camp.name}</strong></td>
          <td>${camp.type}</td>
          <td>${camp.offer}</td>
          <td><span class="badge badge-secondary" style="background: rgba(19, 78, 30, 0.05); color: var(--primary);">${camp.status}</span></td>
        </tr>
      `;
      selectHtml += `<option value="${camp.id}">${camp.name}</option>`;
    });

    listContainer.innerHTML = listHtml;
    selectCampaign.innerHTML = selectHtml;

    this.renderSources();
  },

  renderSources() {
    const listContainer = document.getElementById('mkt-source-list');
    const selectSource = document.getElementById('gen-source-select');
    const analyticsContainer = document.getElementById('mkt-analytics-list');
    if (!listContainer) return;

    const sources = db.get('sources');
    const campaigns = db.get('campaigns');
    const orders = db.get('orders');

    let listHtml = '';
    let selectHtml = '';

    sources.forEach(src => {
      const camp = campaigns.find(c => c.id === src.campaign_id);
      const campName = camp ? camp.name : '-';

      listHtml += `
        <tr>
          <td><strong>${src.id}</strong></td>
          <td><strong>${src.name}</strong></td>
          <td>${src.type}</td>
          <td>${campName}</td>
          <td>${src.distributed_quantity || '-'}</td>
          <td>${src.cost || '0'} ฿</td>
        </tr>
      `;
      selectHtml += `<option value="${src.id}">${src.name}</option>`;
    });

    listContainer.innerHTML = listHtml;
    selectSource.innerHTML = selectHtml;

    // Render Source Conversions
    let analyticsHtml = '';
    sources.forEach(src => {
      const srcOrders = orders.filter(o => o.source_id === src.id && o.order_status !== 'Cancelled');
      const orderCount = srcOrders.length;
      const totalRev = srcOrders.reduce((acc, o) => acc + o.total_amount, 0);
      
      let conversionRate = '-';
      if (src.distributed_quantity > 0) {
        conversionRate = ((orderCount / src.distributed_quantity) * 100).toFixed(1) + '%';
      }
      
      let roi = '-';
      if (src.cost > 0) {
        roi = ((totalRev / src.cost) * 100).toFixed(0) + '%';
      } else if (orderCount > 0) {
        roi = 'Free/Infinite';
      }

      analyticsHtml += `
        <tr>
          <td><strong>${src.name}</strong></td>
          <td><span style="font-size:0.75rem; background:var(--bg-tertiary); padding:2px 6px; border-radius:4px; color:var(--primary); font-weight:600;">${src.id}</span></td>
          <td>${orderCount}</td>
          <td><strong>${totalRev.toLocaleString()} ฿</strong></td>
          <td>${conversionRate}</td>
          <td><span style="font-weight:700; color:${roi.includes('Infinite') || parseFloat(roi) > 100 ? 'var(--accent)' : 'var(--text-secondary)'}">${roi}</span></td>
        </tr>
      `;
    });
    analyticsContainer.innerHTML = analyticsHtml;
  },

  generateLink() {
    const campaignId = document.getElementById('gen-campaign-select').value;
    const sourceId = document.getElementById('gen-source-select').value;
    const utmSource = document.getElementById('gen-utm-source').value.trim();
    const utmMedium = document.getElementById('gen-utm-medium').value.trim();
    const utmCampaign = document.getElementById('gen-utm-campaign').value.trim();

    const baseUrl = window.location.origin + window.location.pathname;
    
    const queryParts = [];
    if (sourceId) queryParts.push(`source=${sourceId}`);
    if (campaignId) queryParts.push(`campaign=${campaignId}`);
    if (utmSource) queryParts.push(`utm_source=${utmSource}`);
    if (utmMedium) queryParts.push(`utm_medium=${utmMedium}`);
    if (utmCampaign) queryParts.push(`utm_campaign=${utmCampaign}`);

    if (sourceId === 'src_google_ads') {
      queryParts.push(`gclid=gcl_googleads_${Math.random().toString(36).substr(2, 9)}`);
    }

    const queryStr = queryParts.length > 0 ? '?' + queryParts.join('&') : '';
    const generatedUrl = baseUrl + queryStr;

    document.getElementById('gen-url-display').textContent = generatedUrl;
    document.getElementById('gen-link-actions-container').style.display = 'block';

    const qrWrapper = document.getElementById('gen-qr-code-img');
    qrWrapper.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(generatedUrl)}`;
  },

  copyGeneratedUrl() {
    const urlText = document.getElementById('gen-url-display').textContent;
    navigator.clipboard.writeText(urlText).then(() => {
      alert('คัดลอกลิงก์ไปยัง Clipboard แล้ว!');
    }).catch(err => {
      console.error('Failed to copy', err);
    });
  },

  simulateUrlVisit() {
    const urlText = document.getElementById('gen-url-display').textContent;
    
    Tracker.captureAttribution(urlText);
    switchRole('customer');
    
    CustomerApp.renderCircularCategories();
    CustomerApp.renderCategories();
    CustomerApp.renderMenus();
    
    alert('จำลองการสแกน QR Code/กดลิงก์สำเร็จ! ระบบอัพเดทแคมเปญด้านบนเรียบร้อย');
  }
};

// ==========================================
// 9. APP INITIALIZATION & VIEW ROUTING
// ==========================================
function switchRole(roleName) {
  // Check authorization for staff roles (admin, kitchen, marketing)
  if (roleName === 'admin' || roleName === 'kitchen' || roleName === 'marketing') {
    if (!state.authenticatedRoles[roleName]) {
      openStaffLoginModal(roleName);
      return;
    }
  }

  state.activeRole = roleName;

  // Update active state in role bar buttons
  document.querySelectorAll('.role-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.role === roleName) {
      btn.classList.add('active');
    }
  });

  // Toggle visible panels
  document.querySelectorAll('.page-container').forEach(page => {
    page.classList.remove('active');
  });

  const activePanel = document.getElementById(`${roleName}-view`);
  if (activePanel) {
    activePanel.classList.add('active');
  }

  // Load specific view data
  if (roleName === 'customer') {
    CustomerApp.renderCircularCategories();
    CustomerApp.renderCategories();
    CustomerApp.renderHeroSection();
    CustomerApp.renderFeaturedMenu();
    CustomerApp.renderMenus();
    CustomerApp.updateFloatingCart();
  } else if (roleName === 'admin') {
    StoreAdmin.renderOverview();
    StoreAdmin.renderCRM();
    StoreAdmin.renderMenuManager();
  } else if (roleName === 'kitchen') {
    KitchenApp.renderBoard();
  } else if (roleName === 'marketing') {
    MarketingApp.renderCampaigns();
  }
}

function openStaffLoginModal(roleName) {
  const overlay = document.getElementById('staff-login-modal-overlay');
  const targetRoleInput = document.getElementById('staff-login-target-role');
  const usernameInput = document.getElementById('staff-username');
  const passwordInput = document.getElementById('staff-password');
  const roleDesc = document.getElementById('staff-login-role-desc');

  if (!overlay) return;

  targetRoleInput.value = roleName;
  passwordInput.value = '';

  let roleLabel = '';
  if (roleName === 'admin') {
    roleLabel = 'Store Admin';
    usernameInput.value = 'admin';
  } else if (roleName === 'kitchen') {
    roleLabel = 'พนักงานครัว';
    usernameInput.value = 'kitchen';
  } else if (roleName === 'marketing') {
    roleLabel = 'ฝ่ายการตลาด';
    usernameInput.value = 'marketing';
  }

  roleDesc.innerHTML = `กรุณาเข้าสู่ระบบเพื่อเข้าใช้งานแผงควบคุม <strong>${roleLabel}</strong>`;
  overlay.classList.add('active');
  usernameInput.focus();
}

function submitStaffLogin() {
  const roleName = document.getElementById('staff-login-target-role').value;
  const username = document.getElementById('staff-username').value.trim();
  const password = document.getElementById('staff-password').value.trim();

  let success = false;
  let isAdminUser = (username === 'admin' && password === 'admin123');

  if (isAdminUser) {
    success = true;
    state.authenticatedRoles.admin = true;
    state.authenticatedRoles.kitchen = true;
    state.authenticatedRoles.marketing = true;
  } else if (roleName === 'kitchen' && username === 'kitchen' && password === 'kitchen123') {
    success = true;
    state.authenticatedRoles.kitchen = true;
  } else if (roleName === 'marketing' && username === 'marketing' && password === 'marketing123') {
    success = true;
    state.authenticatedRoles.marketing = true;
  }

  if (success) {
    sessionStorage.setItem('kp_staff_auth', JSON.stringify(state.authenticatedRoles));
    document.getElementById('staff-login-modal-overlay').classList.remove('active');
    switchRole(roleName);
  } else {
    alert('ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง สำหรับบทบาทนี้');
  }
}

function logoutStaff() {
  if (confirm('คุณแน่ใจว่าต้องการออกจากระบบของเจ้าหน้าที่?')) {
    state.authenticatedRoles.admin = false;
    state.authenticatedRoles.kitchen = false;
    state.authenticatedRoles.marketing = false;
    sessionStorage.setItem('kp_staff_auth', JSON.stringify(state.authenticatedRoles));
    switchRole('customer');
  }
}

// Global scope exposures for inline HTML events
window.switchRole = switchRole;
window.StoreAdmin = StoreAdmin;
window.KitchenApp = KitchenApp;
window.MarketingApp = MarketingApp;
window.CustomerApp = CustomerApp;
window.openStaffLoginModal = openStaffLoginModal;
window.submitStaffLogin = submitStaffLogin;
window.logoutStaff = logoutStaff;

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialise LINE LIFF if configured
  if (typeof liff !== 'undefined' && liffId && liffId !== "YOUR_LIFF_ID") {
    liff.init({ liffId: liffId })
      .then(() => {
        console.log('LINE LIFF initialized successfully.');
        if (liff.isLoggedIn()) {
          liff.getProfile().then(profile => {
            CustomerApp.handleLineUserAutoLogin(profile);
          }).catch(err => console.error('LIFF: Error getting profile:', err));
        } else {
          if (liff.isInClient()) {
            liff.login();
          }
        }
      })
      .catch(err => console.error('LINE LIFF initialization failed:', err));
  }

  // 2. Initialise tracking URL check
  Tracker.captureAttribution(window.location.href);

  // 3. Hide Simulator Bar on Production domains, auto-adjust sticky header top position
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === '';
  const simBar = document.getElementById('simulator-bar');
  const custHeader = document.querySelector('.cust-header-container');
  
  if (simBar) {
    if (isLocalhost) {
      simBar.style.display = 'flex';
      if (custHeader) custHeader.style.top = '58px'; // Height of simulator-bar
    } else {
      simBar.style.display = 'none';
      if (custHeader) custHeader.style.top = '0px';
    }
  }

  // 4. Default / Hash-based routing
  const routeHash = window.location.hash.replace('#', '');
  if (['admin', 'kitchen', 'marketing', 'customer'].includes(routeHash)) {
    switchRole(routeHash);
  } else {
    switchRole('customer');
  }

  // Listen to hash changes for dashboard navigation on production
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '');
    if (['admin', 'kitchen', 'marketing', 'customer'].includes(hash)) {
      switchRole(hash);
    }
  });

  // =====================================
  // EVENT LISTENERS & DOM HANDLERS
  // =====================================
  
  // Simulator Bar input manual address bar trigger
  const simUrlInput = document.getElementById('sim-url-input');
  if (simUrlInput) {
    simUrlInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        Tracker.captureAttribution(simUrlInput.value);
        if (state.activeRole === 'customer') {
          CustomerApp.renderCircularCategories();
          CustomerApp.renderCategories();
          CustomerApp.renderMenus();
        }
      }
    });
  }

  // Search input typing filter
  const searchInput = document.getElementById('cust-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      CustomerApp.renderMenus();
    });
  }

  // Today's recommended card clicks
  const featuredAddBtn = document.getElementById('featured-add-btn');
  if (featuredAddBtn) {
    featuredAddBtn.onclick = (e) => {
      e.stopPropagation();
      CustomerApp.openItemModal('menu_01');
    };
  }

  const featuredCard = document.getElementById('featured-recom-card-container');
  if (featuredCard) {
    featuredCard.onclick = () => {
      CustomerApp.openItemModal('menu_01');
    };
  }

  // Qty increment in modal
  document.getElementById('modal-qty-minus').onclick = () => CustomerApp.updateQty(-1);
  document.getElementById('modal-qty-plus').onclick = () => CustomerApp.updateQty(1);

  // Close modals clicking outside
  document.querySelectorAll('.overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
      }
    });
  });
  
  // Close buttons inside modals
  document.querySelectorAll('.modal-close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.overlay').classList.remove('active');
    });
  });

  // Add to cart click
  document.getElementById('btn-modal-add-cart').onclick = () => CustomerApp.addToCart();

  // Floating Cart click -> opens checkout panels
  document.getElementById('floating-cart-bar').onclick = () => {
    document.getElementById('checkout-flow-panel').style.display = 'block';
    document.getElementById('order-tracking-panel').style.display = 'none';
    CustomerApp.renderCheckoutPage();
    
    // Smooth scroll down to checkout
    document.getElementById('checkout-flow-panel').scrollIntoView({ behavior: 'smooth' });
  };

  // Close checkout button
  const closeCheckoutBtn = document.getElementById('btn-close-checkout');
  if (closeCheckoutBtn) {
    closeCheckoutBtn.onclick = () => {
      document.getElementById('checkout-flow-panel').style.display = 'none';
    };
  }

  // Submit Order Form
  const orderForm = document.getElementById('checkout-order-form');
  if (orderForm) {
    orderForm.onsubmit = (e) => CustomerApp.submitOrder(e);
  }

  // Slip upload handlers
  const fileInput = document.getElementById('chk-slip-file');
  if (fileInput) {
    fileInput.onchange = (e) => CustomerApp.handleSlipUpload(e);
  }

  // Edit menu image upload handler
  const editMenuFileInput = document.getElementById('edit-menu-file-input');
  if (editMenuFileInput) {
    editMenuFileInput.onchange = (e) => StoreAdmin.handleMenuImageUpload(e);
  }

  const dropzone = document.getElementById('slip-upload-dropzone');
  if (dropzone) {
    dropzone.onclick = () => fileInput.click();
    dropzone.ondragover = (e) => { e.preventDefault(); dropzone.style.borderColor = 'var(--accent)'; };
    dropzone.ondragleave = () => { dropzone.style.borderColor = 'rgba(19, 78, 30, 0.2)'; };
    dropzone.ondrop = (e) => {
      e.preventDefault();
      dropzone.style.borderColor = 'rgba(19, 78, 30, 0.2)';
      if (e.dataTransfer.files.length > 0) {
        fileInput.files = e.dataTransfer.files;
        CustomerApp.handleSlipUpload({ target: fileInput });
      }
    };
  }

  // Auth modal submit buttons
  document.getElementById('auth-submit-line').onclick = () => CustomerApp.submitAuth('line');
  document.getElementById('auth-submit-phone').onclick = () => CustomerApp.submitAuth('phone');

  // Image Zoom click close
  const zoomOverlay = document.getElementById('image-zoom-overlay');
  if (zoomOverlay) {
    zoomOverlay.onclick = () => zoomOverlay.classList.remove('active');
  }

  // Admin filter reload
  const statusFilter = document.getElementById('admin-order-status-filter');
  if (statusFilter) {
    statusFilter.onchange = () => StoreAdmin.renderOrdersTable();
  }

  // Marketing Link Generator
  const btnGenerateLink = document.getElementById('btn-marketing-generate');
  if (btnGenerateLink) {
    btnGenerateLink.onclick = () => MarketingApp.generateLink();
  }

  const btnCopyLink = document.getElementById('btn-marketing-copy');
  if (btnCopyLink) {
    btnCopyLink.onclick = () => MarketingApp.copyGeneratedUrl();
  }

  const btnSimulateLink = document.getElementById('btn-marketing-simulate');
  if (btnSimulateLink) {
    btnSimulateLink.onclick = () => MarketingApp.simulateUrlVisit();
  }

  // Kitchen Sound Toggle
  const btnSoundToggle = document.getElementById('kitchen-sound-toggle');
  if (btnSoundToggle) {
    btnSoundToggle.onclick = () => {
      state.soundEnabled = !state.soundEnabled;
      btnSoundToggle.innerHTML = state.soundEnabled 
        ? `<span>🔊</span> เปิดเสียงแจ้งเตือน` 
        : `<span>🔇</span> ปิดเสียงแจ้งเตือน`;
    };
  }
});
