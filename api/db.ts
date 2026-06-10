import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'market.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) NOT NULL,
    icon VARCHAR(50),
    sort INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    category_id INTEGER,
    images TEXT,
    contact VARCHAR(100),
    seller VARCHAR(50) DEFAULT '匿名卖家',
    status VARCHAR(20) DEFAULT 'on',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    sender VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    user_id VARCHAR(50) NOT NULL DEFAULT 'guest',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    UNIQUE(product_id, user_id)
  );

  CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
  CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
  CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
  CREATE INDEX IF NOT EXISTS idx_messages_product ON messages(product_id);
  CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
`);

const catCount = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };
if (catCount.count === 0) {
  const insertCat = db.prepare(`
    INSERT INTO categories (name, icon, sort) VALUES (?, ?, ?)
  `);
  const cats = [
    ['数码电子', 'Smartphone', 1],
    ['服饰鞋包', 'Shirt', 2],
    ['家居生活', 'Home', 3],
    ['图书音像', 'BookOpen', 4],
    ['运动户外', 'Dumbbell', 5],
    ['母婴玩具', 'Baby', 6],
    ['美妆个护', 'Sparkles', 7],
    ['汽车用品', 'Car', 8],
  ];
  const tx = db.transaction(() => {
    for (const c of cats) insertCat.run(...c);
  });
  tx();
}

const prodCount = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
if (prodCount.count === 0) {
  const insertProd = db.prepare(`
    INSERT INTO products (title, description, price, category_id, images, contact, seller, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const products = [
    [
      'iPhone 13 Pro 256G 远峰蓝',
      '自用9成新，电池健康92%，无磕碰划痕，原装配件齐全，带官方AC+到2025年。支持当面验货，非诚勿扰。',
      5200.00, 1,
      '["https://images.unsplash.com/photo-1632633173522-47456de71b76?w=800","https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800"]',
      '138****8888', '数码达人', 'on'
    ],
    [
      'MacBook Air M2 午夜色',
      '2022款，8G+256G，外观完美无瑕疵，循环次数仅86次，带原装充电器和包装盒。因为换了Pro所以出掉。',
      6800.00, 1,
      '["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800","https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800"]',
      'wang@email.com', '小王同学', 'on'
    ],
    [
      '全新未拆 AirPods Pro 2',
      '公司年会抽奖奖品，全新未拆封未激活，官网可查验证，支持当面验货。便宜出了！',
      1399.00, 1,
      '["https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800"]',
      '微信airpods2', '幸运锦鲤', 'on'
    ],
    [
      '优衣库羽绒服 男款L码',
      '去年冬天买的，穿了一次就闲置了，保暖性很好，灰色百搭款，原价599购入。',
      200.00, 2,
      '["https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800"]',
      '135****6666', '闲置买家', 'on'
    ],
    [
      'Nike Air Jordan 1 芝加哥',
      '42码，穿过3次，鞋底轻微磨损，鞋盒配件齐全，收藏级配色。可小刀，屠龙刀勿扰。',
      2800.00, 2,
      '["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800","https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800"]',
      'sneaker_cole', '球鞋收藏家', 'on'
    ],
    [
      'IKEA宜家马尔姆双人床架',
      '搬家急出！1.8x2米白色，9成新无损坏，需要同城自提，购买送价值200元纯棉床笠一套。',
      500.00, 3,
      '["https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800"]',
      '同城自提', '搬家小哥', 'on'
    ],
    [
      '戴森V10吸尘器 九成新',
      '购于京东自营两年前，配件齐全吸力依旧强劲，因换新款出掉。送全新过滤芯2个+清洁刷。',
      1999.00, 3,
      '["https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800"]',
      'dyson_user', '品质生活家', 'on'
    ],
    [
      '索尼WH-1000XM4 降噪耳机',
      '黑色头戴式，顶级降噪效果，音质出色，续航30小时。使用爱惜，耳罩无破损。',
      1599.00, 1,
      '["https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800"]',
      'music_lover', '音乐发烧友', 'on'
    ],
    [
      '《三体》全集典藏版',
      '刘慈欣代表作，1-3册全套精装典藏版，带书盒，书脊完好无笔记。科幻迷必备收藏品。',
      128.00, 4,
      '["https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800"]',
      'book_seller', '旧书铺老板', 'on'
    ],
    [
      '迪卡侬登山背包 40L',
      '防水专业登山包，承重好，多隔层设计，带防雨罩。用过2次短途徒步，成色很新。',
      260.00, 5,
      '["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800"]',
      'hiker001', '户外爱好者', 'on'
    ],
    [
      '乐高城市系列 警察局套装',
      '已拼好，零件齐全无缺失，带原装说明书。孩子大了不玩了，转给有缘人。同城优先。',
      380.00, 6,
      '["https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800"]',
      'mom_seller', '闲置宝妈', 'on'
    ],
    [
      'SK-II神仙水 230ml',
      '专柜购买保真，只用过三次，因为肤质不适合转卖。购买凭证可查，保质期到2026年。',
      1100.00, 7,
      '["https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800"]',
      'beauty_queen', '美妆达人', 'on'
    ],
  ];
  const tx = db.transaction(() => {
    for (const p of products) insertProd.run(...p);
  });
  tx();

  const insertMsg = db.prepare(`
    INSERT INTO messages (product_id, sender, content) VALUES (?, ?, ?)
  `);
  const msgs = [
    [1, '买家小明', '你好，手机还在吗？能便宜点吗？'],
    [1, '数码达人', '在的，诚心要可小刀。'],
    [1, '买家小明', '4800包邮可以吗？'],
    [2, '程序员A', '请问电池循环次数确认是86次吗？有发票吗？'],
  ];
  const tx2 = db.transaction(() => {
    for (const m of msgs) insertMsg.run(...m);
  });
  tx2();
}

export default db;
