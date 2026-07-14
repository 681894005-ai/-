// Configuration for Restaurant Web App (Lumina Bite)

// If you want to use Supabase Cloud Database:
// 1. Create a Supabase project at https://supabase.com
// 2. Obtain your project API URL and public anon KEY.
// 3. Fill them in below.
// If left empty, the application will automatically run on Mock LocalStorage DB!
export const SUPABASE_URL = "";
export const SUPABASE_KEY = "";

// Default credentials for employee login (Mock LocalStorage fallback credentials)
export const DEFAULT_STAFF = [
  { username: "admin", password: "123", role: "admin", name: "ผู้จัดการร้าน" },
  { username: "cashier", password: "123", role: "cashier", name: "แคชเชียร์ A" },
  { username: "kitchen", password: "123", role: "kitchen", name: "เชฟหลัก" }
];

// Initial mock food menu if no items exist in database
export const DEFAULT_MENU = [
  {
    id: "m1",
    name: "ข้าวกะเพราหมูสับไข่ดาว",
    description: "ข้าวกะเพราหมูสับรสชาติจัดจ้าน พร้อมไข่ดาวกรอบนอกไข่แดงเยิ้ม",
    price: 65,
    category: "main",
    image_url: "https://images.unsplash.com/photo-1617093727343-374698b1b08d?auto=format&fit=crop&q=80&w=400",
    available: true
  },
  {
    id: "m2",
    name: "ผัดไทยกุ้งสด",
    description: "ผัดไทยเส้นเหนียวนุ่ม ผัดกับซอสมะขามสูตรเข้มข้น และกุ้งตัวโต",
    price: 85,
    category: "main",
    image_url: "https://images.unsplash.com/photo-1626804475315-9644b37a2fe4?auto=format&fit=crop&q=80&w=400",
    available: true
  },
  {
    id: "m3",
    name: "ต้มยำกุ้งน้ำข้น",
    description: "ต้มยำกุ้งรสชาติจัดจ้าน หอมเครื่องสมุนไพร ข่า ตะไคร้ ใบมะกรูด",
    price: 150,
    category: "main",
    image_url: "https://images.unsplash.com/photo-1548940740-204726a1d82f?auto=format&fit=crop&q=80&w=400",
    available: true
  },
  {
    id: "m4",
    name: "ปีกไก่ทอดน้ำปลา",
    description: "ปีกไก่ทอดกรอบๆ คลุกเคล้าน้ำปลาแท้ หอมกรุ่น ทานเล่นอร่อยมาก",
    price: 90,
    category: "appetizer",
    image_url: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&q=80&w=400",
    available: true
  },
  {
    id: "m5",
    name: "บัวลอยสามสีนมสด",
    description: "บัวลอยแป้งนุ่มหนึบหนับ ทานคู่กับนมสดรสหวานกลมกล่อม",
    price: 45,
    category: "dessert",
    image_url: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&q=80&w=400",
    available: true
  },
  {
    id: "m6",
    name: "ชาไทยเย็นโบราณ",
    description: "ชาไทยรสชาติเข้มข้น หอมชาแท้ ชงแบบดั้งเดิม หวานมันพอดี",
    price: 35,
    category: "beverage",
    image_url: "https://images.unsplash.com/photo-1553909489-cd47e0907980?auto=format&fit=crop&q=80&w=400",
    available: true
  }
];
