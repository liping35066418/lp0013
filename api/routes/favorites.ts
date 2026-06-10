import { Router, type Request, type Response } from 'express';
import db from '../db.js';
import type { Favorite, ApiResponse, Product } from '../../shared/types.js';

const router = Router();

function rowToFavorite(row: any, product?: Product): Favorite {
  return {
    id: row.id,
    productId: row.product_id,
    userId: row.user_id,
    createdAt: row.created_at,
    product,
  };
}

function rowToProduct(row: any): Product {
  let images: string[] = [];
  try {
    images = typeof row.images === 'string' ? JSON.parse(row.images) : [];
  } catch {}
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    price: row.price,
    categoryId: row.category_id,
    categoryName: row.category_name,
    images,
    contact: row.contact,
    seller: row.seller,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

router.get('/:userId', (req: Request, res: Response): void => {
  try {
    const { userId } = req.params;
    const rows = db.prepare(`
      SELECT f.*, p.*, c.name as category_name
      FROM favorites f
      LEFT JOIN products p ON f.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `).all(userId);

    const data: Favorite[] = rows.map((r: any) => {
      const product = rowToProduct(r);
      return rowToFavorite(r, product);
    });

    res.json({ success: true, data } as ApiResponse<Favorite[]>);
  } catch (err) {
    res.status(500).json({ success: false, message: '获取收藏列表失败' });
  }
});

router.get('/:userId/check/:productId', (req: Request, res: Response): void => {
  try {
    const { userId, productId } = req.params;
    const row = db.prepare(`
      SELECT id FROM favorites WHERE user_id = ? AND product_id = ?
    `).get(userId, Number(productId));
    res.json({
      success: true,
      data: !!row,
    } as ApiResponse<boolean>);
  } catch (err) {
    res.status(500).json({ success: false, message: '检查收藏状态失败' });
  }
});

router.post('/', (req: Request, res: Response): void => {
  try {
    const { productId, userId } = req.body;
    if (!productId || !userId) {
      res.status(400).json({ success: false, message: '参数不完整' });
      return;
    }
    const product = db.prepare('SELECT id, status FROM products WHERE id = ?').get(Number(productId));
    if (!product) {
      res.status(404).json({ success: false, message: '商品不存在' });
      return;
    }
    const existing = db.prepare(`
      SELECT id FROM favorites WHERE user_id = ? AND product_id = ?
    `).get(userId, Number(productId));
    if (existing) {
      db.prepare('DELETE FROM favorites WHERE id = ?').run(existing.id);
      res.json({ success: true, data: { favorited: false }, message: '已取消收藏' });
      return;
    }
    const result = db.prepare(`
      INSERT INTO favorites (product_id, user_id) VALUES (?, ?)
    `).run(Number(productId), userId);
    res.json({ success: true, data: { favorited: true, id: result.lastInsertRowid }, message: '收藏成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: '操作失败' });
  }
});

router.delete('/:userId/:productId', (req: Request, res: Response): void => {
  try {
    const { userId, productId } = req.params;
    db.prepare(`
      DELETE FROM favorites WHERE user_id = ? AND product_id = ?
    `).run(userId, Number(productId));
    res.json({ success: true, message: '已取消收藏' });
  } catch (err) {
    res.status(500).json({ success: false, message: '操作失败' });
  }
});

export default router;
