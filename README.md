# Lumina Bite - เว็บไซต์ระบบสั่งอาหารออนไลน์และจัดการหลังร้าน (Light Mode)

แอปพลิเคชันระบบสั่งอาหารออนไลน์หน้าเว็บบอร์ด (Customer UI) และระบบจัดการคิวอาหาร-เมนูพร้อมระบบสรุปยอดขายหลังร้าน (Admin/Staff UI) มีดีไซน์แบบพรีเมียมสีสว่างสดใส (Light Mode) ที่สะอาดตาและใช้งานง่าย

---

## 🚀 โครงสร้างเว็บไซต์ภายในโฟลเดอร์นี้

```text
📁 [หน้าแรกของ Repository บน GitHub]
├── 📄 index.html              # หน้าสั่งอาหารหลักสำหรับลูกค้า
├── 📄 tracking.html           # หน้าติดตามสถานะอาหารแบบเรียลไทม์
├── 📄 admin.html              # หน้าล็อกอินพนักงานและหน้าควบคุมหลังร้านทั้งหมด
├── 📄 receipt.html            # หน้าใบเสร็จรับเงินสำหรับสั่งพิมพ์
├── 📄 style.css               # สไตล์ชีทหลัก
├── 📄 admin.css               # สไตล์ชีทหลังร้าน
├── 📄 print-receipt.css       # สไตล์ชีทสำหรับพิมพ์ใบเสร็จ
├── 📄 config.js               # ไฟล์ตั้งค่าเชื่อมต่อฐานข้อมูล
├── 📄 database.js             # ระบบคลังข้อมูลหลัก
├── 📄 app.js                  # ตรรกะฝั่งลูกค้าระบบสั่งซื้อ
├── 📄 tracking.js             # ตรรกะหน้าติดตามออเดอร์
├── 📄 admin.js                # ตรรกะระบบจัดการหลังร้าน
└── 📄 receipt.js              # ตรรกะหน้าใบเสร็จ
```

---

## 💻 วิธีการเปิดใช้งานในเครื่องคอมพิวเตอร์ของคุณ

เนื่องจากโปรเจกต์นี้เขียนด้วย **HTML, CSS และ JavaScript แบบดั้งเดิม (Vanilla)** คุณจึงไม่จำเป็นต้องติดตั้งโปรแกรมเสริมใดๆ:
1. ดับเบิ้ลคลิกไฟล์ `index.html` เพื่อเปิดหน้าสั่งอาหารของลูกค้าในเว็บบราวเซอร์ (Chrome, Edge ฯลฯ)
2. เข้าไปสั่งอาหารเพิ่มในตะกร้า ใส่หมายเลขโต๊ะ เลือกการชำระเงิน แล้วกดสั่ง
3. ระบบจะพาไปที่หน้า `tracking.html` เพื่อติดตามสถานะ
4. ดับเบิ้ลคลิกไฟล์ `admin.html` เพื่อเข้าหลังร้าน โดยใช้รหัสทดสอบด้านล่างเพื่อเข้าทำงาน

### 🔑 บัญชีเข้าใช้งานพนักงานที่กำหนดไว้เริ่มต้น (เมื่อรันบนเครื่อง):
* **ผู้จัดการ (สิทธิ์สูงสุด):** Username: `admin` | Password: `123` *(ทำได้ทุกอย่าง เช่น สรุปยอด, จัดการเมนู, เปลี่ยนสถานะคิว)*
* **แคชเชียร์:** Username: `cashier` | Password: `123` *(จัดการคิว ยืนยันชำระเงิน ออกใบเสร็จ)*
* **พ่อครัว (ห้องครัว):** Username: `kitchen` | Password: `123` *(เห็นเฉพาะคิวทำอาหาร และอัปเดตสถานะว่ากำลังปรุงหรือปรุงเสร็จ)*

---

## 🗄️ การตั้งค่าระบบฐานข้อมูลจริงบนคลาวด์ด้วย Supabase (ฟรี!)

แอปนี้รองรับการเปลี่ยนจากระบบบันทึกในเครื่องตัวบราวเซอร์ (`localStorage`) ไปเชื่อมต่อคลาวด์จริงผ่าน **Supabase** ได้อย่างรวดเร็ว โดยทำตามขั้นตอนดังนี้:

1. สมัครใช้งานฟรีที่ [Supabase.com](https://supabase.com)
2. สร้าง **Project** ใหม่ เลือกโซนใกล้ประเทศไทย (สิงคโปร์)
3. เข้าไปที่เมนู **SQL Editor** และรันคำสั่ง SQL ด้านล่างนี้เพื่อสร้างตารางข้อมูล:

```sql
-- 1. ตารางเมนูอาหาร (menu_items)
create table menu_items (
  id text primary key,
  name text not null,
  description text,
  price numeric not null,
  category text not null,
  image_url text,
  available boolean default true
);

-- 2. ตารางออร์เดอร์สั่งอาหาร (orders)
create table orders (
  id text primary key,
  table_number text not null,
  customer_name text,
  items jsonb not null,
  subtotal numeric not null,
  discount numeric default 0,
  total_price numeric not null,
  status text default 'pending',
  payment_method text default 'cash',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. ตารางข้อมูลพนักงาน (staff)
create table staff (
  id uuid default gen_random_uuid() primary key,
  username text unique not null,
  password text not null,
  role text not null,
  name text not null
);

-- เพิ่มข้อมูลพนักงานเริ่มต้น
insert into staff (username, password, role, name) values
('admin', '123', 'admin', 'ผู้จัดการร้าน'),
('cashier', '123', 'cashier', 'แคชเชียร์ A'),
('kitchen', '123', 'kitchen', 'เชฟหลัก');
```

4. หลังจากสร้างตารางเสร็จแล้ว ให้ไปที่หน้า **Settings > API** ในโปรเจกต์ Supabase คัดลอกค่า:
   - **Project URL**
   - **Project API Anon Key**
5. เปิดไฟล์ `assets/js/config.js` ในเครื่องคอมพิวเตอร์ของคุณ แล้ววางข้อมูลลงในช่องว่าง:
   ```javascript
   export const SUPABASE_URL = "วาง URL ของคุณที่นี่";
   export const SUPABASE_KEY = "วาง API KEY ของคุณที่นี่";
   ```
6. เมื่อบันทึกไฟล์ ระบบของแอปพลิเคชันจะสลับไปบันทึกข้อมูลและดึงข้อมูลจากคลาวด์ของ Supabase จริงทันทีโดยอัตโนมัติ!

---

## 📦 การนำข้อมูลขึ้น GitHub

หากเครื่องของคุณยังไม่ได้ลงโปรแกรม Git คุณสามารถอัปโหลดโฟลเดอร์นี้ขึ้น GitHub ได้ง่ายๆ ผ่านเว็บบราวเซอร์:
1. เข้าไปที่เว็บบอร์ดของ [GitHub.com](https://github.com) และกดสร้าง **New Repository** (ตั้งชื่อ เช่น `lumina-bite-restaurant`)
2. ในหน้า Repository ที่เพิ่งสร้างขึ้นมา ให้กดลิงก์ **"uploading an existing file"** ใกล้ด้านบนสุด
3. ลากไฟล์และโฟลเดอร์ทั้งหมดจากไดเรกทอรี `C:\Users\PC\Documents\681894005wed/` ไปวางที่เว็บบราวเซอร์ของ GitHub
4. กด **Commit Changes** ด้านล่างเพื่ออัปโหลดไฟล์เสร็จสิ้น

---

## 🌐 การนำขึ้นเผยแพร่ใช้งานจริงบน Vercel

เมื่อนำโค้ดไปเก็บบน GitHub แล้ว คุณสามารถทำเว็บให้เปิดจากนอกบ้านหรือบราวเซอร์มือถือได้ฟรีผ่าน Vercel:
1. เข้าไปที่ [Vercel.com](https://vercel.com) และลงชื่อเข้าใช้ด้วยบัญชี GitHub ของคุณ
2. คลิกปุ่ม **"Add New" > "Project"**
3. ที่หน้ารายชื่อ GitHub repository ให้ค้นหาและคลิก **"Import"** โครงการ `lumina-bite-restaurant` ที่คุณเพิ่งทำการอัปโหลด
4. ในหน้าการตั้งค่าโปรเจกต์ (Project Settings) ไม่ต้องแก้ไขค่าใดๆ ให้คลิกปุ่ม **"Deploy"** ด้านล่างสุดได้ทันที
5. รอไม่เกิน 30 วินาที เว็บไซต์ของคุณจะเปิดใช้งานผ่านลิงก์ของ Vercel เช่น `https://lumina-bite-restaurant.vercel.app` ซึ่งแชร์ให้พนักงานหรือลูกค้าเข้ามาเปิดใช้จากที่ไหนก็ได้!
