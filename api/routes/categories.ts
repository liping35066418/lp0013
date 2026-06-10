import { Router, type Request, type Response } from 'express';
import db from '../db.js';
import type { Category, ApiResponse } from '../../shared/types.js';

const router = Router();

function rowToCategory(row: any): Category {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    sort: row.sort,
    createdAt: row.created_at,
  };
}

router.get('/', (req: Request, res: Response): void => {
  try {
    const rows = db.prepare(`
      SELECT * FROM categories ORDER BY sort ASC, id ASC
    `).all();
    const data = rows.map(rowToCategory);
    res.json({ success: true, data } as ApiResponse<Category[]>);
  } catch (err) {
    res.status(500).json({ success: false, message: '获取分类失败' });
  }
});

router.post('/', (req: Request, res: Response): void => {
  try {
    const { name, icon, sort } = req.body;
    if (!name) {
      res.status(400).json({ success: false, message: '分类名称不能为空' });
      return;
    }
    const result = db.prepare(`
      INSERT INTO categories (name, icon, sort) VALUES (?, ?, ?)
    `).run(name, icon || null, sort || 0);
    const row = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
    res.json({ success: true, data: rowToCategory(row), message: '分类创建成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: '创建分类失败' });
  }
});

router.put('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const { name, icon, sort } = req.body;
    const exists = db.prepare('SELECT id FROM categories WHERE id = ?').get(id);
    if (!exists) {
      res.status(404).json({ success: false, message: '分类不存在' });
      return;
    }
    db.prepare(`
      UPDATE categories SET name = COALESCE(?, name), icon = COALESCE(?, icon), sort = COALESCE(?, sort) WHERE id = ?
    `).run(name || null, icon || null, sort ?? null, id);
    const row = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    res.json({ success: true, data: rowToCategory(row), message: '分类更新成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: '更新分类失败' });
  }
});

router.delete('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const exists = db.prepare('SELECT id FROM categories WHERE id = ?').get(id);
    if (!exists) {
      res.status(404).json({ success: false, message: '分类不存在' });
      return;
    }
    const inUse = db.prepare('SELECT COUNT(*) as cnt FROM products WHERE category_id = ?').get(id) as { cnt: number };
    if (inUse.cnt > 0) {
      res.status(400).json({ success: false, message: '该分类下还有商品，无法删除' });
      return;
    }
    db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    res.json({ success: true, message: '分类删除成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: '删除分类失败' });
  }
});

export default router;
