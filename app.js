import { db } from './database.js';

// App State
let menuItems = [];
let cart = [];
let selectedCategory = 'all';
let searchQuery = '';
let selectedItemForModal = null;

// DOM Elements
const menuGrid = document.getElementById('menu-grid');
const categoriesContainer = document.getElementById('categories-container');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');

const cartDrawer = document.getElementById('cart-drawer');
const cartOverlay = document.getElementById('cart-overlay');
const cartIconBtn = document.getElementById('cart-icon-btn');
const cartBadge = document.getElementById('cart-badge');
const closeCartBtn = document.getElementById('close-cart-btn');
const cartBody = document.getElementById('cart-body');

const subtotalEl = document.getElementById('cart-subtotal');
const taxEl = document.getElementById('cart-tax');
const totalEl = document.getElementById('cart-total');
const checkoutBtn = document.getElementById('checkout-btn');

const orderModal = document.getElementById('order-modal');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalImg = document.getElementById('modal-img');
const modalTitle = document.getElementById('modal-title');
const modalDesc = document.getElementById('modal-desc');
const modalPrice = document.getElementById('modal-price');
const modalQty = document.getElementById('modal-qty');
const modalMinusBtn = document.getElementById('modal-minus-btn');
const modalPlusBtn = document.getElementById('modal-plus-btn');
const modalNotes = document.getElementById('modal-notes');
const modalAddBtn = document.getElementById('modal-add-btn');

// Checkout Form Inputs
const tableNumInput = document.getElementById('table-number');
const custNameInput = document.getElementById('customer-name');
const paymentOptions = document.querySelectorAll('.payment-option');
const ppQrContainer = document.getElementById('promptpay-qr-container');
let selectedPaymentMethod = 'cash';

// Initialize Page
document.addEventListener('DOMContentLoaded', async () => {
  // Load menu from DB
  await refreshMenu();
  setupEventListeners();
  updateCartUI();
});

async function refreshMenu() {
  menuItems = await db.getMenu();
  renderCategories();
  renderMenu();
}

// Categories list
const CATEGORY_NAMES = {
  all: 'ทั้งหมด',
  main: 'อาหารจานหลัก',
  appetizer: 'ทานเล่น',
  dessert: 'ของหวาน',
  beverage: 'เครื่องดื่ม'
};

function renderCategories() {
  if (!categoriesContainer) return;
  
  // Find distinct categories from menu items
  const categories = ['all', ...new Set(menuItems.map(item => item.category))];
  
  categoriesContainer.innerHTML = categories.map(cat => {
    const name = CATEGORY_NAMES[cat] || cat;
    const activeClass = cat === selectedCategory ? 'active' : '';
    let icon = '🍽️';
    if (cat === 'main') icon = '🍛';
    if (cat === 'appetizer') icon = '🍗';
    if (cat === 'dessert') icon = '🍰';
    if (cat === 'beverage') icon = '🥤';
    
    return `
      <div class="category-card ${activeClass}" data-category="${cat}">
        <span>${icon}</span>
        <span>${name}</span>
      </div>
    `;
  }).join('');

  // Add click listener
  document.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('click', () => {
      selectedCategory = card.getAttribute('data-category');
      document.querySelectorAll('.category-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      renderMenu();
    });
  });
}

function renderMenu() {
  if (!menuGrid) return;

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (filteredItems.length === 0) {
    menuGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-light);">
        <p style="font-size: 18px; font-weight: 600;">ไม่พบเมนูที่คุณค้นหา</p>
        <p style="font-size: 14px;">ลองเปลี่ยนหมวดหมู่หรือคำค้นหาของคุณ</p>
      </div>
    `;
    return;
  }

  menuGrid.innerHTML = filteredItems.map(item => {
    const availabilityClass = item.available ? '' : 'menu-unavailable';
    const actionBtn = item.available 
      ? `<button class="btn-add-cart" data-id="${item.id}"><i class="fas fa-plus">+</i></button>`
      : `<span class="status-out-tag">หมดชั่วคราว</span>`;
      
    return `
      <div class="menu-card fade-in ${availabilityClass}">
        <div class="menu-image-container">
          <img class="menu-image" src="${item.image_url}" alt="${item.name}" loading="lazy">
          <span class="menu-category-tag">${CATEGORY_NAMES[item.category] || item.category}</span>
          ${!item.available ? '<span class="status-out-tag">หมด</span>' : ''}
        </div>
        <div class="menu-info">
          <h3 class="menu-title">${item.name}</h3>
          <p class="menu-desc">${item.description}</p>
          <div class="menu-footer">
            <span class="menu-price">${item.price}<span>฿</span></span>
            ${actionBtn}
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Add event listeners to "Add" button
  document.querySelectorAll('.btn-add-cart').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const itemId = btn.getAttribute('data-id');
      const item = menuItems.find(i => i.id === itemId);
      if (item) {
        openOrderModal(item);
      }
    });
  });
}

// Modal management
function openOrderModal(item) {
  selectedItemForModal = item;
  modalImg.src = item.image_url;
  modalTitle.textContent = item.name;
  modalDesc.textContent = item.description;
  modalPrice.textContent = `${item.price} ฿`;
  modalQty.textContent = '1';
  modalNotes.value = '';
  
  orderModal.classList.add('open');
}

function closeOrderModal() {
  orderModal.classList.remove('open');
  selectedItemForModal = null;
}

// Cart Drawer Management
function toggleCart(open) {
  if (open) {
    cartDrawer.classList.add('open');
    cartOverlay.classList.add('open');
  } else {
    cartDrawer.classList.remove('open');
    cartOverlay.classList.remove('open');
  }
}

// Add Item to Cart
function addToCart(item, quantity, notes) {
  const existingItemIndex = cart.findIndex(i => i.id === item.id && i.notes === notes);
  
  if (existingItemIndex > -1) {
    cart[existingItemIndex].quantity += quantity;
  } else {
    cart.push({
      id: item.id,
      name: item.name,
      price: item.price,
      image_url: item.image_url,
      quantity: quantity,
      notes: notes
    });
  }
  
  updateCartUI();
  toggleCart(true); // Open drawer immediately on add
}

function updateCartUI() {
  // Update badge count
  const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (cartBadge) {
    cartBadge.textContent = totalQty;
    cartBadge.style.display = totalQty > 0 ? 'flex' : 'none';
  }

  if (cart.length === 0) {
    cartBody.innerHTML = `
      <div class="cart-empty-state">
        <span style="font-size: 40px; display: block; margin-bottom: 12px;">🛒</span>
        <p>ยังไม่มีอาหารในตะกร้าของคุณ</p>
        <p style="font-size: 12px;">เลือกอาหารที่คุณชื่นชอบลงในตะกร้าได้เลย!</p>
      </div>
    `;
    subtotalEl.textContent = '0 ฿';
    taxEl.textContent = '0 ฿';
    totalEl.textContent = '0 ฿';
    checkoutBtn.disabled = true;
    checkoutBtn.style.opacity = '0.5';
    return;
  }

  checkoutBtn.disabled = false;
  checkoutBtn.style.opacity = '1';

  // Render items
  cartBody.innerHTML = cart.map((item, index) => {
    return `
      <div class="cart-item">
        <img class="cart-item-img" src="${item.image_url}" alt="${item.name}">
        <div class="cart-item-details">
          <h4 class="cart-item-title">${item.name}</h4>
          ${item.notes ? `<span class="cart-item-notes"><i class="fas fa-edit"></i> ${item.notes}</span>` : ''}
          <div class="cart-item-price">${item.price * item.quantity} ฿</div>
        </div>
        <div class="cart-item-controls">
          <button class="btn-remove-item" data-index="${index}"><i class="fas fa-trash-alt"> ลบ</i></button>
          <div class="quantity-control">
            <button class="cart-minus-btn" data-index="${index}">-</button>
            <span>${item.quantity}</span>
            <button class="cart-plus-btn" data-index="${index}">+</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Add event listeners inside cart
  document.querySelectorAll('.btn-remove-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.getAttribute('data-index'));
      cart.splice(index, 1);
      updateCartUI();
    });
  });

  document.querySelectorAll('.cart-minus-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.getAttribute('data-index'));
      if (cart[index].quantity > 1) {
        cart[index].quantity--;
      } else {
        cart.splice(index, 1);
      }
      updateCartUI();
    });
  });

  document.querySelectorAll('.cart-plus-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.getAttribute('data-index'));
      cart[index].quantity++;
      updateCartUI();
    });
  });

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = Math.round(subtotal * 0.07); // 7% VAT
  const total = subtotal + tax;

  subtotalEl.textContent = `${subtotal} ฿`;
  taxEl.textContent = `${tax} ฿`;
  totalEl.textContent = `${total} ฿`;
}

// Checkout Submit
async function handleCheckout() {
  const table = tableNumInput.value.trim();
  const customer = custNameInput.value.trim() || 'ลูกค้าทั่วไป';

  if (!table) {
    alert("กรุณากรอกหมายเลขโต๊ะ หรือระบุรับกลับบ้าน");
    tableNumInput.focus();
    return;
  }

  checkoutBtn.disabled = true;
  checkoutBtn.textContent = 'กำลังส่งออเดอร์...';

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = Math.round(subtotal * 0.07);
  const total = subtotal + tax;

  const orderData = {
    table_number: table,
    customer_name: customer,
    items: cart.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      special_instructions: item.notes
    })),
    subtotal: subtotal,
    discount: 0,
    total_price: total,
    payment_method: selectedPaymentMethod
  };

  try {
    const createdOrder = await db.createOrder(orderData);
    if (createdOrder) {
      // Clear Cart
      cart = [];
      updateCartUI();
      toggleCart(false);
      
      // Redirect to tracking page
      window.location.href = `tracking.html?orderId=${createdOrder.id}`;
    } else {
      alert("เกิดข้อผิดพลาดในการสั่งซื้อ กรุณาลองใหม่อีกครั้ง");
      checkoutBtn.disabled = false;
      checkoutBtn.textContent = 'ยืนยันสั่งอาหาร';
    }
  } catch (err) {
    console.error("Checkout submit error:", err);
    alert("ระบบเกิดความผิดพลาดในการส่งคำสั่งซื้อ");
    checkoutBtn.disabled = false;
    checkoutBtn.textContent = 'ยืนยันสั่งอาหาร';
  }
}

// Event Listeners Registration
function setupEventListeners() {
  // Search
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      searchQuery = searchInput.value;
      renderMenu();
    });
  }
  if (searchInput) {
    searchInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        searchQuery = searchInput.value;
        renderMenu();
      }
    });
  }

  // Cart open/close
  if (cartIconBtn) {
    cartIconBtn.addEventListener('click', () => toggleCart(true));
  }
  if (closeCartBtn) {
    closeCartBtn.addEventListener('click', () => toggleCart(false));
  }
  if (cartOverlay) {
    cartOverlay.addEventListener('click', () => toggleCart(false));
  }

  // Modal actions
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeOrderModal);
  }
  
  if (modalMinusBtn && modalPlusBtn) {
    modalMinusBtn.addEventListener('click', () => {
      let qty = parseInt(modalQty.textContent);
      if (qty > 1) {
        modalQty.textContent = qty - 1;
      }
    });
    modalPlusBtn.addEventListener('click', () => {
      let qty = parseInt(modalQty.textContent);
      modalQty.textContent = qty + 1;
    });
  }

  if (modalAddBtn) {
    modalAddBtn.addEventListener('click', () => {
      if (selectedItemForModal) {
        const qty = parseInt(modalQty.textContent);
        const notes = modalNotes.value.trim();
        addToCart(selectedItemForModal, qty, notes);
        closeOrderModal();
      }
    });
  }

  // Payment Options
  paymentOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      paymentOptions.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      selectedPaymentMethod = opt.getAttribute('data-method');
      
      // If PromptPay, show QR simulation container
      if (selectedPaymentMethod === 'promptpay') {
        ppQrContainer.classList.add('show');
      } else {
        ppQrContainer.classList.remove('show');
      }
    });
  });

  // Checkout submission
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', handleCheckout);
  }
}
