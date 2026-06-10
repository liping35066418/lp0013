import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'api', 'data', 'market.db');
console.log('数据库路径:', dbPath);
const db = new Database(dbPath);

console.log('=== 违规内容检测验证 ===');
// 最新3条商品
const products = db.prepare('SELECT id, title, status, created_at FROM products ORDER BY id DESC LIMIT 3').all();
console.log('\n最新3条商品:');
products.forEach(p => {
  console.log(`  ID=${p.id} | status=${p.status}`);
  console.log(`    title: ${p.title}`);
  console.log(`    created: ${p.created_at}`);
});

const total = db.prepare('SELECT COUNT(*) as total FROM products').get();
console.log('\n总商品数:', total.total);

// 分类数量统计
const catStats = db.prepare('SELECT c.name, COUNT(p.id) as cnt FROM categories c LEFT JOIN products p ON c.id = p.category_id GROUP BY c.id').all();
console.log('\n分类统计:');
catStats.forEach(c => console.log(`  ${c.name}: ${c.cnt} 件`));

db.close();
