import { db } from './database.js';

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('orderId');

  if (!orderId) {
    alert("ไม่พบข้อมูลออเดอร์");
    return;
  }

  const order = await db.getOrderById(orderId);
  if (!order) {
    alert("ไม่พบรหัสออเดอร์ในระบบ");
    return;
  }

  // Render text data
  document.getElementById('receipt-order-id').textContent = order.id;
  document.getElementById('receipt-table').textContent = order.table_number;
  document.getElementById('receipt-customer').textContent = order.customer_name;
  
  const orderDate = new Date(order.created_at);
  document.getElementById('receipt-date').textContent = orderDate.toLocaleDateString('th-TH') + ' ' + orderDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
  
  // Render payment method
  const PAYMENT_METHODS = {
    cash: 'เงินสด',
    promptpay: 'พร้อมเพย์ (PromptPay)'
  };
  document.getElementById('receipt-payment').textContent = PAYMENT_METHODS[order.payment_method] || order.payment_method;

  // Render items table
  const itemsBody = document.getElementById('receipt-items-body');
  if (itemsBody) {
    itemsBody.innerHTML = order.items.map(item => {
      let rowHtml = `
        <tr>
          <td>${item.name}</td>
          <td style="text-align: center;">${item.quantity}</td>
          <td style="text-align: right;">${(item.price * item.quantity).toLocaleString()}</td>
        </tr>
      `;
      if (item.special_instructions) {
        rowHtml += `
          <tr class="item-notes">
            <td colspan="3">* ${item.special_instructions}</td>
          </tr>
        `;
      }
      return rowHtml;
    }).join('');
  }

  // Render totals
  const subtotal = order.subtotal;
  const tax = Math.round(subtotal * 0.07);
  const total = subtotal + tax;

  document.getElementById('receipt-subtotal').textContent = `${subtotal.toLocaleString()} ฿`;
  document.getElementById('receipt-tax').textContent = `${tax.toLocaleString()} ฿`;
  document.getElementById('receipt-total').textContent = `${total.toLocaleString()} ฿`;

  // Print button click handler
  const printBtn = document.getElementById('print-btn');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }
});
