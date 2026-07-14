import { db } from './database.js';

// Admin State
let currentUser = null;
let allOrders = [];
let allMenu = [];
let activeSection = 'dashboard';
let activeQueueTab = 'pending';
let editingMenuItemId = null;

// Charts instances
let salesChartInstance = null;
let categoryChartInstance = null;

// DOM Elements
const loginWrapper = document.getElementById('login-wrapper');
const adminLayout = document.getElementById('admin-layout');
const loginForm = document.getElementById('login-form');
const loginErr = document.getElementById('login-error');

const navLinks = document.querySelectorAll('.sidebar-link[data-section]');
const sections = document.querySelectorAll('.admin-section');
const staffNameEl = document.getElementById('sidebar-staff-name');
const staffRoleEl = document.getElementById('sidebar-staff-role');
const logoutBtn = document.getElementById('logout-btn');

// Metrics Elements
const revValEl = document.getElementById('metric-rev-value');
const countValEl = document.getElementById('metric-count-value');
const avgValEl = document.getElementById('metric-avg-value');
const activeValEl = document.getElementById('metric-active-value');

// Queue Elements
const queueTabs = document.querySelectorAll('.queue-tab');
const queueGrid = document.getElementById('queue-grid');

// Menu Elements
const adminMenuGrid = document.getElementById('admin-menu-grid');
const addMenuBtn = document.getElementById('add-menu-btn');
const menuModal = document.getElementById('menu-modal');
const menuForm = document.getElementById('menu-form');
const menuModalCloseBtn = document.getElementById('menu-modal-close');
const menuModalTitle = document.getElementById('menu-modal-title');
const menuIdInput = document.getElementById('menu-id');

document.addEventListener('DOMContentLoaded', () => {
  // Check session storage for existing login
  const sessionUser = sessionStorage.getItem('lumina_session');
  if (sessionUser) {
    currentUser = JSON.parse(sessionUser);
    showAdminDashboard();
  } else {
    // Show login screen
    loginWrapper.style.display = 'flex';
    adminLayout.style.display = 'none';
  }

  setupEventListeners();
});

function setupEventListeners() {
  // Login Form Submit
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const usernameInput = document.getElementById('username').value.trim();
      const passwordInput = document.getElementById('password').value.trim();

      const result = await db.loginStaff(usernameInput, passwordInput);
      if (result.success) {
        currentUser = result.user;
        sessionStorage.setItem('lumina_session', JSON.stringify(currentUser));
        loginErr.classList.remove('show');
        showAdminDashboard();
      } else {
        loginErr.textContent = result.error;
        loginErr.classList.add('show');
      }
    });
  }

  // Logout Button
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      sessionStorage.removeItem('lumina_session');
      currentUser = null;
      window.location.reload();
    });
  }

  // Sidebar navigation
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      activeSection = link.getAttribute('data-section');
      sections.forEach(sec => {
        if (sec.id === `${activeSection}-section`) {
          sec.classList.add('active');
        } else {
          sec.classList.remove('active');
        }
      });

      // Reload appropriate section data
      if (activeSection === 'dashboard') {
        loadAnalytics();
      } else if (activeSection === 'queue') {
        loadQueue();
      } else if (activeSection === 'menu') {
        loadMenuManagement();
      }
    });
  });

  // Queue Tab Filters
  queueTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      queueTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeQueueTab = tab.getAttribute('data-tab');
      renderQueueGrid();
    });
  });

  // Add Menu Item Modal Open
  if (addMenuBtn) {
    addMenuBtn.addEventListener('click', () => {
      openMenuFormModal();
    });
  }

  // Close Menu Item Modal
  if (menuModalCloseBtn) {
    menuModalCloseBtn.addEventListener('click', closeMenuFormModal);
  }

  // Menu Form Submit (Add / Edit)
  if (menuForm) {
    menuForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const id = menuIdInput.value;
      const name = document.getElementById('menu-name').value.trim();
      const description = document.getElementById('menu-description').value.trim();
      const price = parseFloat(document.getElementById('menu-price').value);
      const category = document.getElementById('menu-category').value;
      const image_url = document.getElementById('menu-image-url').value.trim() || 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?auto=format&fit=crop&q=80&w=400';
      const available = document.getElementById('menu-available').checked;

      const itemData = {
        name,
        description,
        price,
        category,
        image_url,
        available
      };

      if (id) {
        itemData.id = id;
      }

      await db.saveMenuItem(itemData);
      closeMenuFormModal();
      loadMenuManagement();
    });
  }

  // Set Interval for Order Polling (only if user is logged in and on Queue page)
  setInterval(() => {
    if (currentUser) {
      refreshOrdersData();
    }
  }, 5000);
}

async function showAdminDashboard() {
  loginWrapper.style.display = 'none';
  adminLayout.style.display = 'flex';

  // Render Staff Profile Info
  if (staffNameEl) staffNameEl.textContent = currentUser.name;
  if (staffRoleEl) {
    if (currentUser.role === 'admin') staffRoleEl.textContent = 'ผู้จัดการร้าน / Admin';
    else if (currentUser.role === 'cashier') staffRoleEl.textContent = 'แคชเชียร์ / Cashier';
    else if (currentUser.role === 'kitchen') staffRoleEl.textContent = 'ฝ่ายครัว / Kitchen';
  }

  // Hide tabs based on roles for security/convenience
  if (currentUser.role === 'kitchen') {
    // Kitchen staff focuses on cooking queue
    document.querySelector('.sidebar-link[data-section="dashboard"]').style.display = 'none';
    document.querySelector('.sidebar-link[data-section="menu"]').style.display = 'none';
    // Navigate to Queue directly
    document.querySelector('.sidebar-link[data-section="queue"]').click();
  } else {
    // Admin or Cashier, show dashboard
    document.querySelector('.sidebar-link[data-section="dashboard"]').click();
  }

  // Load initial orders
  await refreshOrdersData();
}

async function refreshOrdersData() {
  allOrders = await db.getOrders();
  updateQueueBadges();
  
  if (activeSection === 'dashboard') {
    loadAnalytics();
  } else if (activeSection === 'queue') {
    renderQueueGrid();
  }
}

function updateQueueBadges() {
  const counts = {
    pending: allOrders.filter(o => o.status === 'pending').length,
    preparing: allOrders.filter(o => o.status === 'preparing').length,
    ready: allOrders.filter(o => o.status === 'ready').length,
    history: allOrders.filter(o => o.status === 'completed' || o.status === 'cancelled').length
  };

  queueTabs.forEach(tab => {
    const role = tab.getAttribute('data-tab');
    const badge = tab.querySelector('.count');
    if (badge && counts[role] !== undefined) {
      badge.textContent = counts[role];
    }
  });
}

// -----------------------------
// ANALYTICS & REPORTS PANEL
// -----------------------------
function loadAnalytics() {
  // 1. Calculate Metrics
  const completedOrders = allOrders.filter(o => o.status === 'completed');
  const activeOrders = allOrders.filter(o => o.status === 'pending' || o.status === 'preparing' || o.status === 'ready');
  
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total_price, 0);
  const totalCount = completedOrders.length;
  const avgTicket = totalCount > 0 ? Math.round(totalRevenue / totalCount) : 0;
  
  if (revValEl) revValEl.textContent = `${totalRevenue.toLocaleString()} ฿`;
  if (countValEl) countValEl.textContent = `${totalCount} ออเดอร์`;
  if (avgValEl) avgValEl.textContent = `${avgTicket} ฿`;
  if (activeValEl) activeValEl.textContent = `${activeOrders.length} ออเดอร์`;

  // 2. Render Charts
  renderSalesChart(completedOrders);
  renderCategoryChart(completedOrders);
}

function renderSalesChart(orders) {
  const ctx = document.getElementById('salesChart');
  if (!ctx) return;

  // Group sales by day (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const salesData = last7Days.map(dateStr => {
    const dayOrders = orders.filter(o => o.created_at.startsWith(dateStr));
    const revenue = dayOrders.reduce((sum, o) => sum + o.total_price, 0);
    return { date: dateStr, revenue };
  });

  const labels = salesData.map(d => {
    const parts = d.date.split('-');
    return `${parts[2]}/${parts[1]}`;
  });
  const data = salesData.map(d => d.revenue);

  if (salesChartInstance) {
    salesChartInstance.destroy();
  }

  if (window.Chart) {
    salesChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'ยอดขายรายวัน (บาท)',
          data: data,
          borderColor: '#ff782d',
          backgroundColor: 'rgba(255, 120, 45, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: '#f1f5f9' }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });
  }
}

function renderCategoryChart(orders) {
  const ctx = document.getElementById('categoryChart');
  if (!ctx) return;

  // Count item categories sold
  const catCounts = { main: 0, appetizer: 0, dessert: 0, beverage: 0 };
  
  orders.forEach(order => {
    order.items.forEach(item => {
      // Find category of item from default menu
      const match = allMenu.find(m => m.id === item.id);
      const cat = match ? match.category : 'main';
      if (catCounts[cat] !== undefined) {
        catCounts[cat] += item.quantity;
      }
    });
  });

  const CATEGORY_LABELS = {
    main: 'อาหารหลัก',
    appetizer: 'ทานเล่น',
    dessert: 'ของหวาน',
    beverage: 'เครื่องดื่ม'
  };

  const labels = Object.keys(catCounts).map(k => CATEGORY_LABELS[k]);
  const data = Object.values(catCounts);

  if (categoryChartInstance) {
    categoryChartInstance.destroy();
  }

  if (window.Chart) {
    categoryChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: ['#ff782d', '#3b82f6', '#10b981', '#8b5cf6'],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 12, font: { size: 11 } }
          }
        }
      }
    });
  }
}

// -----------------------------
// ORDER QUEUE MANAGEMENT PANEL
// -----------------------------
function loadQueue() {
  renderQueueGrid();
}

function renderQueueGrid() {
  if (!queueGrid) return;

  const filteredOrders = allOrders.filter(order => {
    if (activeQueueTab === 'pending') return order.status === 'pending';
    if (activeQueueTab === 'preparing') return order.status === 'preparing';
    if (activeQueueTab === 'ready') return order.status === 'ready';
    if (activeQueueTab === 'history') return order.status === 'completed' || order.status === 'cancelled';
    return false;
  });

  if (filteredOrders.length === 0) {
    queueGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 60px; background: white; border-radius: var(--radius-md); border: 1.5px solid var(--border); color: var(--text-light);">
        <span style="font-size: 40px; display: block; margin-bottom: 12px;">📂</span>
        <p style="font-weight: 600;">ไม่มีรายการคำสั่งซื้อในหน้านี้</p>
      </div>
    `;
    return;
  }

  queueGrid.innerHTML = filteredOrders.map(order => {
    const formattedDate = new Date(order.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
    const itemsListHtml = order.items.map(item => `
      <div class="order-card-item">
        <span><span class="qty">${item.quantity}x</span> ${item.name}</span>
        ${item.special_instructions ? `<span class="notes"><i class="fas fa-edit"></i> ${item.special_instructions}</span>` : ''}
      </div>
    `).join('');

    // Actions block depending on status & roles
    let actionButtons = '';
    if (order.status === 'pending') {
      if (currentUser.role === 'admin' || currentUser.role === 'cashier') {
        actionButtons += `<button class="btn-action-sm primary btn-advance" data-id="${order.id}" data-next="preparing">ปรุงอาหาร</button>`;
      }
      if (currentUser.role === 'admin' || currentUser.role === 'cashier') {
        actionButtons += `<button class="btn-action-sm neutral btn-cancel" data-id="${order.id}">ยกเลิก</button>`;
      }
    } else if (order.status === 'preparing') {
      actionButtons += `<button class="btn-action-sm success btn-advance" data-id="${order.id}" data-next="ready">ปรุงเสร็จแล้ว</button>`;
    } else if (order.status === 'ready') {
      if (currentUser.role === 'admin' || currentUser.role === 'cashier') {
        actionButtons += `<button class="btn-action-sm primary btn-advance" data-id="${order.id}" data-next="completed">ชำระเงิน/เสร็จสิ้น</button>`;
      }
    }

    // Invoice button (can be printed any time)
    const printReceiptBtn = `<a href="receipt.html?orderId=${order.id}" target="_blank" class="btn-action-sm neutral"><i class="fas fa-print"></i> บิล</a>`;

    return `
      <div class="order-card fade-in">
        <div class="order-card-header">
          <div>
            <span class="order-card-id">${order.id}</span>
            <div class="order-card-time">${formattedDate}</div>
          </div>
          <span class="status-badge ${order.status}">
            ${order.status === 'pending' ? 'รอปรุง' : 
              order.status === 'preparing' ? 'กำลังทำ' : 
              order.status === 'ready' ? 'รอเสิร์ฟ' : 
              order.status === 'completed' ? 'เสร็จสิ้น' : 'ยกเลิก'}
          </span>
        </div>
        <div class="order-card-meta">
          <span>โต๊ะ: <span class="table-tag">${order.table_number}</span></span>
          <span style="color: var(--text-muted);">${order.customer_name}</span>
        </div>
        <div class="order-card-items">
          ${itemsListHtml}
        </div>
        <div class="order-card-footer">
          <div class="order-card-total">
            <span style="font-size: 11px; font-weight: normal; color: var(--text-muted); display: block;">ยอดชำระ</span>
            ${order.total_price} ฿
          </div>
          <div class="order-card-actions">
            ${actionButtons}
            ${printReceiptBtn}
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Add click listeners to advancement triggers
  document.querySelectorAll('.btn-advance').forEach(btn => {
    btn.addEventListener('click', async () => {
      const orderId = btn.getAttribute('data-id');
      const nextStatus = btn.getAttribute('data-next');
      btn.disabled = true;
      btn.textContent = '...';
      
      await db.updateOrderStatus(orderId, nextStatus);
      refreshOrdersData();
    });
  });

  // Cancel order click trigger
  document.querySelectorAll('.btn-cancel').forEach(btn => {
    btn.addEventListener('click', async () => {
      const orderId = btn.getAttribute('data-id');
      if (confirm(`คุณต้องการยกเลิกคำสั่งซื้อ ${orderId} ใช่หรือไม่?`)) {
        btn.disabled = true;
        await db.updateOrderStatus(orderId, 'cancelled');
        refreshOrdersData();
      }
    });
  });
}

// -----------------------------
// MENU MANAGEMENT PANEL
// -----------------------------
async function loadMenuManagement() {
  allMenu = await db.getMenu();
  renderAdminMenuGrid();
}

function renderAdminMenuGrid() {
  if (!adminMenuGrid) return;

  adminMenuGrid.innerHTML = allMenu.map(item => {
    return `
      <div class="admin-menu-card fade-in">
        <div class="menu-image-container" style="height: 140px;">
          <img class="menu-image" src="${item.image_url}" alt="${item.name}">
        </div>
        <div class="admin-menu-info">
          <h4 style="font-size: 15px; margin-bottom: 4px;">${item.name}</h4>
          <div style="font-size: 11px; background: var(--bg-main); padding: 2px 6px; border-radius: 4px; display: inline-block; margin-bottom: 8px;">
            ${CATEGORY_NAMES[item.category] || item.category}
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 700; color: var(--primary);">${item.price} ฿</span>
            <span style="font-size: 12px; color: ${item.available ? 'var(--accent)' : '#ef4444'}; font-weight: 600;">
              ${item.available ? '● พร้อมเสิร์ฟ' : '● หมด'}
            </span>
          </div>
        </div>
        <div class="admin-menu-actions">
          <button class="btn-edit-item" data-id="${item.id}"><i class="fas fa-pen"></i> แก้ไข</button>
          <button class="btn-delete-item" data-id="${item.id}"><i class="fas fa-trash"></i> ลบ</button>
        </div>
      </div>
    `;
  }).join('');

  // Add click listeners to Edit Item
  document.querySelectorAll('.btn-edit-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const item = allMenu.find(m => m.id === id);
      if (item) {
        openMenuFormModal(item);
      }
    });
  });

  // Add click listeners to Delete Item
  document.querySelectorAll('.btn-delete-item').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      if (confirm("คุณแน่ใจว่าต้องการลบเมนูนี้อย่างถาวรใช่หรือไม่?")) {
        await db.deleteMenuItem(id);
        loadMenuManagement();
      }
    });
  });
}

// Open/Close Menu Form Modal
function openMenuFormModal(item = null) {
  if (item) {
    // Mode: Edit
    menuModalTitle.textContent = 'แก้ไขเมนูอาหาร';
    menuIdInput.value = item.id;
    document.getElementById('menu-name').value = item.name;
    document.getElementById('menu-description').value = item.description;
    document.getElementById('menu-price').value = item.price;
    document.getElementById('menu-category').value = item.category;
    document.getElementById('menu-image-url').value = item.image_url;
    document.getElementById('menu-available').checked = item.available;
  } else {
    // Mode: Add New
    menuModalTitle.textContent = 'เพิ่มเมนูอาหารใหม่';
    menuIdInput.value = '';
    menuForm.reset();
    document.getElementById('menu-available').checked = true;
  }
  menuModal.classList.add('open');
}

function closeMenuFormModal() {
  menuModal.classList.remove('open');
}

// Localized Categories
const CATEGORY_NAMES = {
  all: 'ทั้งหมด',
  main: 'อาหารจานหลัก',
  appetizer: 'ทานเล่น',
  dessert: 'ของหวาน',
  beverage: 'เครื่องดื่ม'
};
