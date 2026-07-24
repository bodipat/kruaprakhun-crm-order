// Seed data for Krua Prakhun CRM & Order Web App (Updated with Real Menu Items & Prices)

const MOCK_CATEGORIES = [
  { id: 'cat_value', name: 'เมนูอิ่มคุ้ม', count: 3 },
  { id: 'cat_daily', name: 'เมนูกินได้ทุกวัน', count: 12 },
  { id: 'cat_seafood', name: 'เมนูทะเลสด', count: 16 },
  { id: 'cat_special', name: 'เมนูพิเศษ', count: 8 },
  { id: 'cat_drinks', name: 'เครื่องดื่ม', count: 3 }
];

const MOCK_MENUS = [
  // === 1. เมนูอิ่มคุ้ม (cat_value) ===
  {
    id: 'menu_01',
    name: 'ข้าวผัดหมู, ไก่',
    category_id: 'cat_value',
    description: 'ข้าวผัดร้อนๆ ปรุงรสกลมกล่อมสูตรครัวพระคุณ',
    image: 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=400&q=80',
    base_price: 40,
    status: 'active',
    recommended: false,
    spicy_option_available: false,
    topping_available: true,
    sort_order: 1
  },
  {
    id: 'menu_02',
    name: 'ข้าวกะเพราไก่',
    category_id: 'cat_value',
    description: 'กะเพราไก่รสจัดจ้าน ผัดแห้งหอมกลิ่นกะเพราแท้',
    image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=400&q=80',
    base_price: 40,
    status: 'active',
    recommended: true,
    spicy_option_available: true,
    topping_available: true,
    sort_order: 2
  },
  {
    id: 'menu_03',
    name: 'ข้าวไข่เจียวหมูสับ',
    category_id: 'cat_value',
    description: 'ไข่เจียวหมูสับทอดฟูกรอบ เสิร์ฟร้อนๆ บนข้าวสวยหอมมะลิ',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
    base_price: 40,
    status: 'active',
    recommended: false,
    spicy_option_available: false,
    topping_available: true,
    sort_order: 3
  },

  // === 2. เมนูกินได้ทุกวัน (cat_daily) ===
  {
    id: 'menu_04',
    name: 'ข้าวผัดพริกแกงหมู, ไก่',
    category_id: 'cat_daily',
    description: 'ผัดพริกแกงสูตรเด็ด รสชาติเผ็ดร้อน หอมสมุนไพร',
    image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=400&q=80',
    base_price: 50,
    status: 'active',
    recommended: false,
    spicy_option_available: true,
    topping_available: true,
    sort_order: 4
  },
  {
    id: 'menu_05',
    name: 'กระเพราหมูสับ',
    category_id: 'cat_daily',
    description: 'กะเพราหมูสับผัดแห้ง รสชาติเข้มข้นจัดจ้าน',
    image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=400&q=80',
    base_price: 50,
    status: 'active',
    recommended: true,
    spicy_option_available: true,
    topping_available: true,
    sort_order: 5
  },
  {
    id: 'menu_06',
    name: 'ข้าวผัดต้มยำ',
    category_id: 'cat_daily',
    description: 'ข้าวผัดเครื่องต้มยำ รสเปรี้ยว เค็ม เผ็ด ครบรส',
    image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=400&q=80',
    base_price: 60,
    status: 'active',
    recommended: false,
    spicy_option_available: true,
    topping_available: true,
    sort_order: 6
  },
  {
    id: 'menu_07',
    name: 'กระเพราเนื้อโคขุน',
    category_id: 'cat_daily',
    description: 'เนื้อโคขุนสับละเอียด ผัดกะเพราเผ็ดร้อนถึงใจ',
    image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=400&q=80',
    base_price: 60,
    status: 'active',
    recommended: true,
    spicy_option_available: true,
    topping_available: true,
    sort_order: 7
  },
  {
    id: 'menu_08',
    name: 'กระเพราหมูกรอบ',
    category_id: 'cat_daily',
    description: 'หมูกรอบเนื้อแน่นหนังกรอบ ผัดกะเพราแห้งๆ กลมกล่อม',
    image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=400&q=80',
    base_price: 60,
    status: 'active',
    recommended: true,
    spicy_option_available: true,
    topping_available: true,
    sort_order: 8
  },
  {
    id: 'menu_09',
    name: 'หมูกรอบคั่วพริกเกลือราดข้าว',
    category_id: 'cat_daily',
    description: 'หมูกรอบผัดพริกกระเทียมและเกลือ เค็มเผ็ดแห้งกรอบกำลังดี',
    image: 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=400&q=80',
    base_price: 60,
    status: 'active',
    recommended: true,
    spicy_option_available: true,
    topping_available: true,
    sort_order: 9
  },
  {
    id: 'menu_10',
    name: 'ข้าวผัดรถไฟ',
    category_id: 'cat_daily',
    description: 'ข้าวผัดซีอิ๊วดำโบราณ ใส่คะน้า มะเขือเทศ หอมใหญ่',
    image: 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=400&q=80',
    base_price: 50,
    status: 'active',
    recommended: false,
    spicy_option_available: false,
    topping_available: true,
    sort_order: 10
  },
  {
    id: 'menu_11',
    name: 'ข้าวผัดพริกแกงหน่อไม้ หมู, ไก่',
    category_id: 'cat_daily',
    description: 'พริกแกงรสจัดจ้านผัดกับหน่อไม้สดและเนื้อสัตว์ราดข้าว',
    image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=400&q=80',
    base_price: 50,
    status: 'active',
    recommended: false,
    spicy_option_available: true,
    topping_available: true,
    sort_order: 11
  },
  {
    id: 'menu_12',
    name: 'ผัดไทยโบราณ',
    category_id: 'cat_daily',
    description: 'ผัดไทยสูตรดั้งเดิม รสเปรี้ยวเค็มหวาน กลมกล่อมเหนียวนุ่ม',
    image: 'https://images.unsplash.com/photo-1626804475315-9654b4231b14?auto=format&fit=crop&w=400&q=80',
    base_price: 50,
    status: 'active',
    recommended: false,
    spicy_option_available: false,
    topping_available: false,
    sort_order: 12
  },
  {
    id: 'menu_13',
    name: 'สุกี้แห้ง, สุกี้น้ำ หมู, ไก่',
    category_id: 'cat_daily',
    description: 'สุกี้ใส่วุ้นเส้น ผักกาดขาว และน้ำจิ้มสุกี้สูตรเด็ดของร้าน',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
    base_price: 50,
    status: 'active',
    recommended: false,
    spicy_option_available: false,
    topping_available: false,
    sort_order: 13
  },
  {
    id: 'menu_14',
    name: 'สุกี้แห้ง, น้ำ รวม',
    category_id: 'cat_daily',
    description: 'สุกี้รวมมิตร หมู ไก่ และอาหารทะเลสดใหม่',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
    base_price: 60,
    status: 'active',
    recommended: false,
    spicy_option_available: false,
    topping_available: false,
    sort_order: 14
  },
  {
    id: 'menu_15',
    name: 'ยำวุ้นเส้นโบราณ',
    category_id: 'cat_daily',
    description: 'ยำวุ้นเส้นใส่หมูสับ ถั่วทอด พริกสด รสแซ่บแบบคลาสสิก',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
    base_price: 80,
    status: 'active',
    recommended: false,
    spicy_option_available: true,
    topping_available: false,
    sort_order: 15
  },

  // === 3. เมนูทะเลสด (cat_seafood) ===
  {
    id: 'menu_16',
    name: 'ข้าวผัดกุ้งสดพระคุณ',
    category_id: 'cat_seafood',
    description: 'ข้าวผัดกุ้งลายเสือตัวโต เนื้อเด้งหวานสดธรรมชาติ',
    image: 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=400&q=80',
    base_price: 60,
    status: 'active',
    recommended: true,
    spicy_option_available: false,
    topping_available: true,
    sort_order: 16
  },
  {
    id: 'menu_17',
    name: 'ข้าวกระเพราปลาหมึก',
    category_id: 'cat_seafood',
    description: 'ปลาหมึกสดชิ้นหนา ผัดใบกะเพราฉุนร้อนสะใจ',
    image: 'https://images.unsplash.com/photo-1626804475315-9654b4231b14?auto=format&fit=crop&w=400&q=80',
    base_price: 60,
    status: 'active',
    recommended: false,
    spicy_option_available: true,
    topping_available: true,
    sort_order: 17
  },
  {
    id: 'menu_18',
    name: 'ข้าวกระเพรารวมมิตรทะเล',
    category_id: 'cat_seafood',
    description: 'รวมมิตรกุ้ง หมึก และเนื้อปลา ผัดกะเพรารสเผ็ดจัดจ้าน',
    image: 'https://images.unsplash.com/photo-1626804475315-9654b4231b14?auto=format&fit=crop&w=400&q=80',
    base_price: 70,
    status: 'active',
    recommended: true,
    spicy_option_available: true,
    topping_available: true,
    sort_order: 18
  },
  {
    id: 'menu_19',
    name: 'กุ้งทอดกระเทียมราดข้าว',
    category_id: 'cat_seafood',
    description: 'กุ้งสดผัดกระเทียมโทนและพริกไทยดำ ราดข้าวหอมมะลิ',
    image: 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=400&q=80',
    base_price: 70,
    status: 'active',
    recommended: false,
    spicy_option_available: false,
    topping_available: true,
    sort_order: 19
  },
  {
    id: 'menu_20',
    name: 'ผัดไทยกุ้งทะเลสด',
    category_id: 'cat_seafood',
    description: 'ผัดไทยเส้นเหนียวนุ่ม ผัดกับกุ้งสดตัวโตและไข่เป็ด',
    image: 'https://images.unsplash.com/photo-1626804475315-9654b4231b14?auto=format&fit=crop&w=400&q=80',
    base_price: 60,
    status: 'active',
    recommended: true,
    spicy_option_available: false,
    topping_available: false,
    sort_order: 20
  },
  {
    id: 'menu_21',
    name: 'ผัดไทยทะเล',
    category_id: 'cat_seafood',
    description: 'ผัดไทยใส่กุ้งสดและปลาหมึก รสชาติครบรสกลมกล่อม',
    image: 'https://images.unsplash.com/photo-1626804475315-9654b4231b14?auto=format&fit=crop&w=400&q=80',
    base_price: 80,
    status: 'active',
    recommended: false,
    spicy_option_available: false,
    topping_available: false,
    sort_order: 21
  },
  {
    id: 'menu_22',
    name: 'หอยทอดกรอบ',
    category_id: 'cat_seafood',
    description: 'แป้งหอยทอดกรอบนุ่ม ใส่หอยแมลงภู่สด เสิร์ฟพร้อมน้ำจิ้ม',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
    base_price: 60,
    status: 'active',
    recommended: false,
    spicy_option_available: false,
    topping_available: false,
    sort_order: 22
  },
  {
    id: 'menu_23',
    name: 'ทะเลทอด',
    category_id: 'cat_seafood',
    description: 'กุ้ง หอย และปลาหมึก ชุบแป้งทอดฟูกรอบสะใจ',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
    base_price: 100,
    status: 'active',
    recommended: false,
    spicy_option_available: false,
    topping_available: false,
    sort_order: 23
  },
  {
    id: 'menu_24',
    name: 'ยำวุ้นเส้นทะเล',
    category_id: 'cat_seafood',
    description: 'วุ้นเส้นยำกับกุ้งและหมึกชิ้นโต ปรุงรสน้ำยำมะนาวสด',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
    base_price: 80,
    status: 'active',
    recommended: false,
    spicy_option_available: true,
    topping_available: false,
    sort_order: 24
  },
  {
    id: 'menu_25',
    name: 'ยำรวมมิตร',
    category_id: 'cat_seafood',
    description: 'ยำรวมเนื้อหมู ไก่ และของทะเล ลวกสดใหม่จานต่อจาน',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
    base_price: 80,
    status: 'active',
    recommended: false,
    spicy_option_available: true,
    topping_available: false,
    sort_order: 25
  },
  {
    id: 'menu_26',
    name: 'ต้มยำรวมมิตรทะเลสด',
    category_id: 'cat_seafood',
    description: 'ต้มยำน้ำข้นหรือน้ำใส ใส่กุ้ง หอย หมึก สมุนไพรจัดเต็ม',
    image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=400&q=80',
    base_price: 120,
    status: 'active',
    recommended: true,
    spicy_option_available: true,
    topping_available: false,
    sort_order: 26
  },
  {
    id: 'menu_27',
    name: 'ต้มยำกุ้งขาวทะเลสด',
    category_id: 'cat_seafood',
    description: 'ต้มยำกุ้งขาวไซส์ใหญ่ รสชาติเปรี้ยวเผ็ดร้อน กลมกล่อมเข้มข้น',
    image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=400&q=80',
    base_price: 120,
    status: 'active',
    recommended: false,
    spicy_option_available: true,
    topping_available: false,
    sort_order: 27
  },
  {
    id: 'menu_28',
    name: 'ปลากระพงนึ่งมะนาว',
    category_id: 'cat_seafood',
    description: 'ปลากระพงสดเนื้อหวาน นึ่งราดพริกกระเทียมมะนาวสุดแซ่บ',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
    base_price: 260,
    status: 'active',
    recommended: true,
    spicy_option_available: true,
    topping_available: false,
    sort_order: 28
  },
  {
    id: 'menu_29',
    name: 'ปลากระพงทอดน้ำปลา',
    category_id: 'cat_seafood',
    description: 'ปลากระพงผ่าซีกทอดกรอบ ราดน้ำปลากวนหอมหวานสูตรเฉพาะ',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
    base_price: 260,
    status: 'active',
    recommended: true,
    spicy_option_available: false,
    topping_available: false,
    sort_order: 29
  },
  {
    id: 'menu_30',
    name: 'ต้มยำปลากระพง',
    category_id: 'cat_seafood',
    description: 'เนื้อปลากระพงขาวชิ้นโต ต้มยำน้ำใสสมุนไพร ซดร้อนโล่งคอ',
    image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=400&q=80',
    base_price: 120,
    status: 'active',
    recommended: false,
    spicy_option_available: true,
    topping_available: false,
    sort_order: 30
  },
  {
    id: 'menu_31',
    name: 'หอยเชลล์ผัดฉ่า',
    category_id: 'cat_seafood',
    description: 'หอยเชลล์เนื้อนุ่มผัดฉ่าใส่กระชาย พริกไทยอ่อน และใบมะกรูด',
    image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=400&q=80',
    base_price: 150,
    status: 'active',
    recommended: false,
    spicy_option_available: true,
    topping_available: false,
    sort_order: 31
  },

  // === 4. เมนูพิเศษ (cat_special) ===
  {
    id: 'menu_32',
    name: 'ยำผักบุ้งกรอบ',
    category_id: 'cat_special',
    description: 'ผักบุ้งชุบแป้งทอดกรอบ เสิร์ฟพร้อมน้ำยำหมูสับกุ้งสดรสเข้มข้น',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
    base_price: 80,
    status: 'active',
    recommended: true,
    spicy_option_available: true,
    topping_available: false,
    sort_order: 32
  },
  {
    id: 'menu_33',
    name: 'หนุมานคลุกฝุ่น',
    category_id: 'cat_special',
    description: 'เมนูทานเล่นโบราณ รสชาติกลมกล่อมหอมข้าวคั่วและสมุนไพรทอด',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
    base_price: 80,
    status: 'active',
    recommended: false,
    spicy_option_available: true,
    topping_available: false,
    sort_order: 33
  },
  {
    id: 'menu_34',
    name: 'ข้าวราดห่อหมกทะเล',
    category_id: 'cat_special',
    description: 'ห่อหมกทะเลเครื่องแกงเข้มข้น รสชาติหวานมันเผ็ดร้อน ราดข้าวสวย',
    image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=400&q=80',
    base_price: 70,
    status: 'active',
    recommended: false,
    spicy_option_available: false,
    topping_available: true,
    sort_order: 34
  },
  {
    id: 'menu_35',
    name: 'ลาบทอด',
    category_id: 'cat_special',
    description: 'ลาบหมูสับปั้นก้อนชุบแป้งทอด กรอบนอกนุ่มใน เปรี้ยวเผ็ดเค็มแซ่บ',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
    base_price: 80,
    status: 'active',
    recommended: false,
    spicy_option_available: true,
    topping_available: false,
    sort_order: 35
  },
  {
    id: 'menu_36',
    name: 'ผัดฉ่าปลาราดข้าว',
    category_id: 'cat_special',
    description: 'เนื้อปลาชิ้นหนาผัดฉ่าสมุนไพร รสชาติเผ็ดร้อนราดข้าวสวยร้อนๆ',
    image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=400&q=80',
    base_price: 70,
    status: 'active',
    recommended: false,
    spicy_option_available: true,
    topping_available: true,
    sort_order: 36
  },
  {
    id: 'menu_37',
    name: 'ต้มจืดเต้าหู้หมูสับ',
    category_id: 'cat_special',
    description: 'แกงจืดเต้าหู้หลอด ใส่หมูสับปั้นก้อนและผักกาดขาว ซุปรสกลมกล่อม',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
    base_price: 70,
    status: 'active',
    recommended: false,
    spicy_option_available: false,
    topping_available: false,
    sort_order: 37
  },
  {
    id: 'menu_38',
    name: 'ต้มข่าไก่',
    category_id: 'cat_special',
    description: 'เนื้ออกไก่ต้มในน้ำกะทิหอมสมุนไพร ข่า ตะไคร้ ใบมะกรูด เปรี้ยวหวานมัน',
    image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=400&q=80',
    base_price: 80,
    status: 'active',
    recommended: false,
    spicy_option_available: true,
    topping_available: false,
    sort_order: 38
  },
  {
    id: 'menu_39',
    name: 'ต้มโคล้งปลา',
    category_id: 'cat_special',
    description: 'ต้มยำปลากรอบใส่สมุนไพรเผา รสชาติเปรี้ยวเค็มเผ็ดหอมกลิ่นปลาย่าง',
    image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=400&q=80',
    base_price: 100,
    status: 'active',
    recommended: false,
    spicy_option_available: true,
    topping_available: false,
    sort_order: 39
  },

  // === 5. เครื่องดื่ม (cat_drinks) ===
  {
    id: 'menu_40',
    name: 'น้ำเปล่า',
    category_id: 'cat_drinks',
    description: 'น้ำดื่มบรรจุขวดสะอาด เย็นชื่นใจ',
    image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=400&q=80',
    base_price: 10,
    status: 'active',
    recommended: false,
    spicy_option_available: false,
    topping_available: false,
    sort_order: 40
  },
  {
    id: 'menu_41',
    name: 'เป๊ปซี่',
    category_id: 'cat_drinks',
    description: 'เป๊ปซี่ขวดเย็นซ่า แก้เลี่ยนและคลายร้อน',
    image: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?auto=format&fit=crop&w=400&q=80',
    base_price: 15,
    status: 'active',
    recommended: false,
    spicy_option_available: false,
    topping_available: false,
    sort_order: 41
  },
  {
    id: 'menu_42',
    name: 'น้ำแข็ง',
    category_id: 'cat_drinks',
    description: 'น้ำแข็งแก้วเปล่าสะอาดฟรีบริการตัวเอง',
    image: 'https://images.unsplash.com/photo-1551829142-d9b812de432c?auto=format&fit=crop&w=400&q=80',
    base_price: 0,
    status: 'active',
    recommended: false,
    spicy_option_available: false,
    topping_available: false,
    sort_order: 42
  }
];

const MOCK_TOPPINGS = [
  { id: 'top_egg_fried', name: 'ไข่ดาว', price: 10, status: 'active' },
  { id: 'top_egg_omelette', name: 'ไข่เจียว', price: 10, status: 'active' },
  { id: 'top_extra_rice', name: 'ข้าวหอมมะลิ 100%', price: 10, status: 'active' }
];

const MOCK_OPTIONS = [
  {
    id: 'opt_spicy',
    group_name: 'ระดับความเผ็ด',
    options: ['ไม่เผ็ด', 'เผ็ดน้อย', 'เผ็ดปกติ', 'เผ็ดมาก'],
    required: true,
    status: 'active'
  },
  {
    id: 'opt_rice',
    group_name: 'ปริมาณข้าว',
    options: ['ข้าวน้อย', 'ข้าวปกติ', 'ข้าวเยอะ (+10 บาท)'],
    required: true,
    status: 'active'
  },
  {
    id: 'opt_preparation',
    group_name: 'รูปแบบเสิร์ฟ',
    options: ['ราดข้าว', 'แยกกับข้าว (+15 บาท)'],
    required: true,
    status: 'active'
  }
];

const MOCK_CAMPAIGNS = [
  {
    id: 'camp_01',
    name: 'ฉลองเปิดร้านใหม่ ครัวพระคุณ',
    type: 'Brochure',
    start_date: '2026-07-01',
    end_date: '2026-07-31',
    budget: 5000,
    status: 'active',
    offer: 'ส่งฟรีเมื่อสั่งครบ 150 บาท'
  },
  {
    id: 'camp_02',
    name: 'มื้อเที่ยงสุดคุ้มชาวออฟฟิศ',
    type: 'Office',
    start_date: '2026-07-01',
    end_date: '2026-08-31',
    budget: 3000,
    status: 'active',
    offer: 'ส่วนลด 10% ทุกเมนูราดข้าว'
  },
  {
    id: 'camp_03',
    name: 'กะเพราใกล้ฉัน 3km',
    type: 'Google Ads',
    start_date: '2026-07-10',
    end_date: '2026-08-10',
    budget: 15000,
    status: 'active',
    offer: 'แถมน้ำเก๊กฮวยเมื่อสั่งเมนูแนะนำ'
  },
  {
    id: 'camp_04',
    name: 'LINE OA สมาชิกคนพิเศษ',
    type: 'LINE OA',
    start_date: '2026-07-01',
    end_date: '2026-12-31',
    budget: 0,
    status: 'active',
    offer: 'สะสมแต้มแลกฟรีไข่ดาว'
  }
];

const MOCK_SOURCES = [
  {
    id: 'src_pst_a',
    name: 'คอนโด PST อาคาร A (โบรชัวร์)',
    type: 'Condo',
    campaign_id: 'camp_01',
    note: 'แจกโบรชัวร์ตามกล่องจดหมาย คอนโด PST อาคาร A จำนวน 500 ใบ',
    distributed_quantity: 500,
    cost: 1500,
    status: 'active'
  },
  {
    id: 'src_pst_b',
    name: 'คอนโด PST อาคาร B (โบรชัวร์)',
    type: 'Condo',
    campaign_id: 'camp_01',
    note: 'แจกโบรชัวร์ตามกล่องจดหมาย คอนโด PST อาคาร B จำนวน 500 ใบ',
    distributed_quantity: 500,
    cost: 1500,
    status: 'active'
  },
  {
    id: 'src_abc_hr',
    name: 'บริษัท ABC (อีเมล HR)',
    type: 'Office',
    campaign_id: 'camp_02',
    note: 'ดีลส่งชุดอาหารเที่ยง คอนแทคผ่าน HR ส่งอีเมลข่าวสารภายในบริษัท',
    distributed_quantity: 200,
    cost: 0,
    status: 'active'
  },
  {
    id: 'src_google_ads',
    name: 'Google CPC Search Ads',
    type: 'Google Ads',
    campaign_id: 'camp_03',
    note: 'ยิงโฆษณาพิกัดร้าน รัศมี 3 กม. คีย์เวิร์ด อาหารตามสั่งใกล้ฉัน, กะเพรา',
    distributed_quantity: 0,
    cost: 4500,
    status: 'active'
  },
  {
    id: 'src_line_qr',
    name: 'QR Code หน้าถุงอาหารเดลิเวอรี',
    type: 'Delivery Insert Card',
    campaign_id: 'camp_04',
    note: 'การ์ดสแกน QR เพิ่มเพื่อนในถุง เพื่อรับออเดอร์ตรงลดพึ่งพา GP',
    distributed_quantity: 1000,
    cost: 800,
    status: 'active'
  }
];

// Historical Customers for CRM
const MOCK_CUSTOMERS = [
  {
    id: 'cust_01',
    name: 'สมชาย ใจมั่น',
    phone: '0812345678',
    line_user_id: 'U1234567890abcdef1234567890abcdef',
    line_display_name: 'Somchai_JaiMan',
    email: 'somchai@gmail.com',
    default_address: 'อาคารสาทรทาวเวอร์ ชั้น 18 ห้อง 1804 แขวงสีลม เขตบางรัก กรุงเทพฯ',
    first_source: 'src_pst_a',
    latest_source: 'src_line_qr',
    created_at: '2026-07-02T11:20:00+07:00',
    last_order_at: '2026-07-16T12:30:00+07:00',
    consent_marketing: true,
    consent_timestamp: '2026-07-02T11:20:00+07:00'
  }
];

// Historical Orders to populate dashboard
const MOCK_ORDERS = [
  {
    id: 'ord_1001',
    customer_id: 'cust_01',
    customer_name: 'สมชาย ใจมั่น',
    customer_phone: '0812345678',
    order_datetime: '2026-07-02T12:05:00+07:00',
    order_status: 'Completed',
    payment_status: 'Verified',
    subtotal: 80,
    delivery_fee: 10,
    discount: 8, // 10% coupon
    total_amount: 82,
    source_id: 'src_abc_hr',
    campaign_id: 'camp_02',
    utm_source: null,
    utm_campaign: null,
    delivery_address: 'อาคารสาทรทาวเวอร์ ชั้น 18 ห้อง 1804 แขวงสีลม เขตบางรัก กรุงเทพฯ',
    rider_note: 'ส่งที่ชั้น 18 วางไว้บนโต๊ะรับอาหารหน้ารายการติดต่อประชาสัมพันธ์',
    slip_url: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&w=300&q=80',
    items: [
      {
        order_item_id: 'item_1001_1',
        menu_id: 'menu_02',
        menu_name: 'ข้าวกระเพรากระเพราไก่',
        quantity: 2,
        base_price: 40,
        selected_options: {
          'ระดับความเผ็ด': 'เผ็ดมาก',
          'ปริมาณข้าว': 'ข้าวปกติ',
          'รูปแบบเสิร์ฟ': 'ราดข้าว'
        },
        selected_toppings: [],
        item_note: 'ขอไข่ดาวเพิ่มด้วยครับ',
        total_item_price: 80
      }
    ]
  }
];

const MOCK_LEDGER = [
  {
    id: 'led_1',
    date: '2026-07-20',
    type: 'expense',
    category: 'เนื้อสัตว์',
    menu_id: null,
    menu_name: null,
    quantity: null,
    amount: 1250,
    description: 'ซื้ออกไก่ 10 กก. และเนื้อหมูสับ 5 กก. จากตลาดสด'
  },
  {
    id: 'led_2',
    date: '2026-07-20',
    type: 'expense',
    category: 'ผัก',
    menu_id: null,
    menu_name: null,
    quantity: null,
    amount: 320,
    description: 'ซื้อใบกะเพรา พริกขี้หนู และกระเทียม'
  },
  {
    id: 'led_3',
    date: '2026-07-21',
    type: 'expense',
    category: 'Packaging',
    menu_id: null,
    menu_name: null,
    quantity: null,
    amount: 450,
    description: 'ซื้อกล่องอาหารกระดาษย่อยสลายได้ 100 ใบ'
  },
  {
    id: 'led_4',
    date: '2026-07-21',
    type: 'income',
    category: 'ขายอาหาร',
    menu_id: 'menu_02',
    menu_name: 'ข้าวกะเพราไก่',
    quantity: 12,
    amount: 480,
    description: 'บันทึกยอดขาย ข้าวกะเพราไก่ จำนวน 12 จาน (จากสมุดจด)'
  },
  {
    id: 'led_5',
    date: '2026-07-22',
    type: 'income',
    category: 'ขายอาหาร',
    menu_id: 'menu_05',
    menu_name: 'กะเพราหมูสับ',
    quantity: 15,
    amount: 750,
    description: 'บันทึกยอดขาย กะเพราหมูสับ จำนวน 15 จาน (จากสมุดจด)'
  },
  {
    id: 'led_6',
    date: '2026-07-22',
    type: 'expense',
    category: 'ค่าเช่า',
    menu_id: null,
    menu_name: null,
    quantity: null,
    amount: 2500,
    description: 'ค่าเช่าแผงร้านอาหารรายสัปดาห์'
  }
];

// Export to window object for availability in browser script
window.KruaPrakhunSeedData = {
  MOCK_CATEGORIES,
  MOCK_MENUS,
  MOCK_TOPPINGS,
  MOCK_OPTIONS,
  MOCK_CAMPAIGNS,
  MOCK_SOURCES,
  MOCK_CUSTOMERS,
  MOCK_ORDERS,
  MOCK_LEDGER
};
