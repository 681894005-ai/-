import { db } from './database.js';

// DOM Elements
const orderIdText = document.getElementById('order-id-text');
const trackingTime = document.getElementById('tracking-time');
const tableNumText = document.getElementById('table-number-text');
const totalPriceText = document.getElementById('total-price-text');
const receiptLink = document.getElementById('receipt-link');

const stepPending = document.getElementById('step-pending');
const stepPreparing = document.getElementById('step-preparing');
const stepReady = document.getElementById('step-ready');
const stepCompleted = document.getElementById('step-completed');
const trackingContainer = document.getElementById('tracking-container');

let orderId = '';
let currentStatus = '';

document.addEventListener('DOMContentLoaded', () => {
  // Extract orderId from URL query string
  const urlParams = new URLSearchParams(window.location.search);
  orderId = urlParams.get('orderId');

  if (!orderId) {
    showError("ไม่พบรหัสออเดอร์ กรุณาตรวจสอบลิงก์ใหม่อีกครั้ง");
    return;
  }

  // Initial Load
  loadOrderStatus();

  // Setup Poll Interval (Check database updates every 4 seconds)
  setInterval(loadOrderStatus, 4000);
});

async function loadOrderStatus() {
  try {
    const order = await db.getOrderById(orderId);
    if (!order) {
      showError("ไม่พบข้อมูลออเดอร์หมายเลข " + orderId);
      return;
    }

    // Render Order Meta
    if (orderIdText) orderIdText.textContent = order.id;
    if (tableNumText) tableNumText.textContent = order.table_number;
    if (totalPriceText) totalPriceText.textContent = `${order.total_price} ฿`;
    
    if (trackingTime) {
      const orderDate = new Date(order.created_at);
      trackingTime.textContent = orderDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
    }

    if (receiptLink) {
      receiptLink.href = `receipt.html?orderId=${order.id}`;
    }

    // Only update DOM if status has actually changed to prevent visual flickers
    if (order.status !== currentStatus) {
      currentStatus = order.status;
      updateTimelineUI(currentStatus);
    }
  } catch (err) {
    console.error("Error loading order status:", err);
  }
}

function updateTimelineUI(status) {
  // Reset all steps classes
  const steps = [
    { el: stepPending, name: 'pending', val: 1 },
    { el: stepPreparing, name: 'preparing', val: 2 },
    { el: stepReady, name: 'ready', val: 3 },
    { el: stepCompleted, name: 'completed', val: 4 }
  ];

  let currentStepVal = 0;
  if (status === 'pending') currentStepVal = 1;
  else if (status === 'preparing') currentStepVal = 2;
  else if (status === 'ready') currentStepVal = 3;
  else if (status === 'completed') currentStepVal = 4;
  else if (status === 'cancelled') currentStepVal = -1; // special case

  steps.forEach(step => {
    if (!step.el) return;
    
    // Clear previous states
    step.el.classList.remove('active', 'completed');
    
    if (currentStepVal === -1) {
      // If cancelled, show warning or style differently
      const desc = step.el.querySelector('.timeline-desc');
      if (step.name === 'pending') {
        step.el.classList.add('active');
        step.el.querySelector('.timeline-title').textContent = 'ออเดอร์ถูกยกเลิก';
        if (desc) desc.textContent = 'คำสั่งซื้อนี้ถูกปฏิเสธหรือยกเลิกโดยทางร้าน';
      }
    } else {
      if (step.val < currentStepVal) {
        step.el.classList.add('completed');
      } else if (step.val === currentStepVal) {
        step.el.classList.add('active');
      }
    }
  });

  // Update dynamic connection line height if needed
  const line = document.getElementById('progress-line');
  if (line) {
    let percent = '0%';
    if (currentStepVal === 2) percent = '33%';
    else if (currentStepVal === 3) percent = '66%';
    else if (currentStepVal === 4) percent = '100%';
    else if (currentStepVal === -1) percent = '0%';
    
    line.style.height = percent;
  }
}

function showError(msg) {
  if (trackingContainer) {
    trackingContainer.innerHTML = `
      <div class="tracking-card" style="border-color: #fee2e2;">
        <span style="font-size: 48px; color: #ef4444; display: block; margin-bottom: 16px;">⚠️</span>
        <h2 style="color: #b91c1c; margin-bottom: 12px;">เกิดข้อผิดพลาด</h2>
        <p style="color: var(--text-muted); margin-bottom: 24px;">${msg}</p>
        <a href="index.html" class="btn-secondary-outline" style="display: inline-flex; justify-content: center; margin: 0 auto;">กลับสู่หน้าหลัก</a>
      </div>
    `;
  }
}
