import { SUPABASE_URL, SUPABASE_KEY, DEFAULT_MENU, DEFAULT_STAFF } from './config.js';

// Initialize Database Layer
let supabaseClient = null;
const isSupabaseEnabled = SUPABASE_URL && SUPABASE_KEY;

if (isSupabaseEnabled && window.supabase) {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  console.log("Supabase Database active.");
} else {
  console.log("LocalStorage Database active (Fallback Mode).");
  // Initialize LocalStorage with default data if empty
  if (!localStorage.getItem("lumina_menu")) {
    localStorage.setItem("lumina_menu", JSON.stringify(DEFAULT_MENU));
  }
  if (!localStorage.getItem("lumina_orders")) {
    localStorage.setItem("lumina_orders", JSON.stringify([]));
  }
  if (!localStorage.getItem("lumina_staff")) {
    localStorage.setItem("lumina_staff", JSON.stringify(DEFAULT_STAFF));
  }
}

// Helper: Generates unique ID
function generateId() {
  return 'id_' + Math.random().toString(36).substr(2, 9);
}

// DB METHODS
export const db = {
  // MENU MANAGEMENT
  async getMenu() {
    if (isSupabaseEnabled && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('menu_items')
        .select('*')
        .order('category', { ascending: true });
      if (!error) return data;
      console.error("Supabase error getting menu, falling back to LocalStorage:", error);
    }
    return JSON.parse(localStorage.getItem("lumina_menu") || "[]");
  },

  async saveMenuItem(item) {
    if (isSupabaseEnabled && supabaseClient) {
      if (item.id) {
        const { data, error } = await supabaseClient
          .from('menu_items')
          .update(item)
          .eq('id', item.id)
          .select();
        if (!error) return data[0];
        console.error("Supabase error updating menu item:", error);
      } else {
        const newItem = { ...item, id: generateId() };
        const { data, error } = await supabaseClient
          .from('menu_items')
          .insert([newItem])
          .select();
        if (!error) return data[0];
        console.error("Supabase error inserting menu item:", error);
      }
    }
    
    // LocalStorage Fallback
    const menu = JSON.parse(localStorage.getItem("lumina_menu") || "[]");
    if (item.id) {
      const index = menu.findIndex(i => i.id === item.id);
      if (index !== -1) {
        menu[index] = { ...menu[index], ...item };
      }
    } else {
      item.id = generateId();
      menu.push(item);
    }
    localStorage.setItem("lumina_menu", JSON.stringify(menu));
    return item;
  },

  async deleteMenuItem(id) {
    if (isSupabaseEnabled && supabaseClient) {
      const { error } = await supabaseClient
        .from('menu_items')
        .delete()
        .eq('id', id);
      if (!error) return true;
      console.error("Supabase error deleting menu item:", error);
    }
    
    // LocalStorage Fallback
    let menu = JSON.parse(localStorage.getItem("lumina_menu") || "[]");
    menu = menu.filter(item => item.id !== id);
    localStorage.setItem("lumina_menu", JSON.stringify(menu));
    return true;
  },

  // ORDER MANAGEMENT
  async getOrders() {
    if (isSupabaseEnabled && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error) return data;
      console.error("Supabase error getting orders, falling back to LocalStorage:", error);
    }
    return JSON.parse(localStorage.getItem("lumina_orders") || "[]");
  },

  async getOrderById(id) {
    if (isSupabaseEnabled && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();
      if (!error) return data;
      console.error("Supabase error getting order by ID:", error);
    }
    const orders = JSON.parse(localStorage.getItem("lumina_orders") || "[]");
    return orders.find(o => o.id === id) || null;
  },

  async createOrder(orderData) {
    const newOrder = {
      id: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
      table_number: orderData.table_number,
      customer_name: orderData.customer_name || 'ลูกค้าทั่วไป',
      items: orderData.items,
      subtotal: orderData.subtotal,
      discount: orderData.discount || 0,
      total_price: orderData.total_price,
      status: 'pending',
      payment_method: orderData.payment_method || 'cash',
      created_at: new Date().toISOString()
    };

    if (isSupabaseEnabled && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('orders')
        .insert([newOrder])
        .select();
      if (!error) return data[0];
      console.error("Supabase error creating order, falling back to LocalStorage:", error);
    }

    // LocalStorage Fallback
    const orders = JSON.parse(localStorage.getItem("lumina_orders") || "[]");
    orders.unshift(newOrder); // Add to beginning
    localStorage.setItem("lumina_orders", JSON.stringify(orders));
    return newOrder;
  },

  async updateOrderStatus(orderId, status) {
    if (isSupabaseEnabled && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('orders')
        .update({ status: status })
        .eq('id', orderId)
        .select();
      if (!error) return data[0];
      console.error("Supabase error updating status, falling back to LocalStorage:", error);
    }

    // LocalStorage Fallback
    const orders = JSON.parse(localStorage.getItem("lumina_orders") || "[]");
    const index = orders.findIndex(o => o.id === orderId);
    if (index !== -1) {
      orders[index].status = status;
      localStorage.setItem("lumina_orders", JSON.stringify(orders));
      return orders[index];
    }
    return null;
  },

  // STAFF MANAGEMENT
  async loginStaff(username, password) {
    if (isSupabaseEnabled && supabaseClient) {
      // For real Supabase, you could query a custom 'staff' table or use Supabase Auth.
      // We check the custom staff table if available, else fallback.
      const { data, error } = await supabaseClient
        .from('staff')
        .select('*')
        .eq('username', username)
        .eq('password', password) // simple check for demonstration
        .single();
      if (!error && data) {
        return { success: true, user: data };
      }
      console.error("Supabase auth check failed or table not ready, testing local credentials:", error);
    }

    // LocalStorage Fallback
    const staffList = JSON.parse(localStorage.getItem("lumina_staff") || "[]");
    const matched = staffList.find(s => s.username === username && s.password === password);
    if (matched) {
      return { success: true, user: { username: matched.username, role: matched.role, name: matched.name } };
    }
    return { success: false, error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" };
  }
};
