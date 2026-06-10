import { Router, type Request, type Response } from 'express';
import db from '../db.js';
import { checkViolation } from '../services/moderation.js';
import type { Product, ApiResponse, ProductListQuery, ProductStatus } from '../../shared/types.js';

const router = Router();

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
    status: row.status as ProductStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

router.get('/', (req: Request, res: Response): void => {
  try {
    const query = req.query as unknown as ProductListQuery;
    const where: string[] = [];
    const params: any[] = [];

    where.push(`p.status = COALESCE(?, 'on')`);
    params.push(query.status || 'on');

    if (query.categoryId) {
      where.push('p.category_id = ?');
      params.push(Number(query.categoryId));
    }
    if (query.minPrice !== undefined && query.minPrice !== null) {
      where.push('p.price >= ?');
      params.push(Number(query.minPrice));
    }
    if (query.maxPrice !== undefined && query.maxPrice !== null) {
      where.push('p.price <= ?');
      params.push(Number(query.maxPrice));
    }
    if (query.startDate) {
      where.push('p.created_at >= ?');
      params.push(query.startDate);
    }
    if (query.endDate) {
      where.push('p.created_at <= ?');
      params.push(query.endDate + ' 23:59:59');
    }
    if (query.keyword) {
      where.push('(p.title LIKE ? OR p.description LIKE ?)');
      const kw = `%${query.keyword}%`;
      params.push(kw, kw);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const countRow = db.prepare(`
      SELECT COUNT(*) as total FROM products p ${whereSql}
    `).get(...params) as { total: number };

    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Number(query.pageSize) || 20);
    const offset = (page - 1) * pageSize;

    const rows = db.prepare(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereSql}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, pageSize, offset);

    const data = rows.map(rowToProduct);
    res.json({ success: true, data, total: countRow.total } as ApiResponse<Product[]>);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '获取商品列表失败' });
  }
});

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const row = db.prepare(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.id = ?
    `).get(id);
    if (!row) {
      res.status(404).json({ success: false, message: '商品不存在' });
      return;
    }
    res.json({ success: true, data: rowToProduct(row) } as ApiResponse<Product>);
  } catch (err) {
    res.status(500).json({ success: false, message: '获取商品失败' });
  }
});

router.post('/', (req: Request, res: Response): void => {
  try {
    const { title, description, price, categoryId, images, contact, seller } = req.body;
    if (!title || price === undefined || price === null) {
      res.status(400).json({ success: false, message: '标题和价格不能为空' });
      return;
    }

    const checkText = `${title} ${description || ''}`;
    const mod = checkViolation(checkText);

    let status: ProductStatus = 'on';
    let message = '商品发布成功';
    if (mod.isViolation) {
      status = 'violation';
      message = mod.suggestion;
    }

    const imagesJson = JSON.stringify(images || []);
    const result = db.prepare(`
      INSERT INTO products (title, description, price, category_id, images, contact, seller, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      title,
      description || '',
      Number(price),
      categoryId || null,
      imagesJson,
      contact || '',
      seller || '匿名卖家',
      status
    );

    const row = db.prepare(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.id = ?
    `).get(result.lastInsertRowid);

    const responseData: any = {
      success: true,
      data: rowToProduct(row),
      message,
    };
    if (mod.isViolation) {
      responseData.moderation = mod;
      responseData.autoOff = true;
    }

    res.status(mod.isViolation ? 422 : 200).json(responseData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '发布商品失败' });
  }
});

router.put('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const { title, description, price, categoryId, images, contact, status } = req.body;
    const exists = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!exists) {
      res.status(404).json({ success: false, message: '商品不存在' });
      return;
    }

    let newStatus = status || exists.status;
    let message = '商品更新成功';

    if (title !== undefined || description !== undefined) {
      const checkText = `${title ?? exists.title} ${description ?? exists.description ?? ''}`;
      const mod = checkViolation(checkText);
      if (mod.isViolation) {
        newStatus = 'violation';
        message = mod.suggestion;
      }
    }

    const imagesJson = images ? JSON.stringify(images) : exists.images;
    db.prepare(`
      UPDATE products SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        price = COALESCE(?, price),
        category_id = COALESCE(?, category_id),
        images = ?,
        contact = COALESCE(?, contact),
        status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      title ?? null,
      description ?? null,
      price !== undefined && price !== null ? Number(price) : null,
      categoryId ?? null,
      imagesJson,
      contact ?? null,
      newStatus,
      id
    );

    const row = db.prepare(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.id = ?
    `).get(id);

    res.json({ success: true, data: rowToProduct(row), message });
  } catch (err) {
    res.status(500).json({ success: false, message: '更新商品失败' });
  }
});

router.patch('/:id/status', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['on', 'off', 'violation'].includes(status)) {
      res.status(400).json({ success: false, message: '无效的状态值' });
      return;
    }
    const exists = db.prepare('SELECT id FROM products WHERE id = ?').get(id);
    if (!exists) {
      res.status(404).json({ success: false, message: '商品不存在' });
      return;
    }
    db.prepare('UPDATE products SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);
    const statusText: Record<string, string> = {
      on: '上架成功',
      off: '下架成功',
      violation: '标记违规成功',
    };
    res.json({ success: true, message: statusText[status] || '状态更新成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: '更新状态失败' });
  }
});

router.delete('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const exists = db.prepare('SELECT id FROM products WHERE id = ?').get(id);
    if (!exists) {
      res.status(404).json({ success: false, message: '商品不存在' });
      return;
    }
    db.prepare('DELETE FROM messages WHERE product_id = ?').run(id);
    db.prepare('DELETE FROM favorites WHERE product_id = ?').run(id);
    db.prepare('DELETE FROM products WHERE id = ?').run(id);
    res.json({ success: true, message: '商品删除成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: '删除商品失败' });
  }
});

export default router;
