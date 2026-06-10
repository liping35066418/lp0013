import { Router, type Request, type Response } from 'express';
import db from '../db.js';
import { checkViolation } from '../services/moderation.js';
import type { Message, ApiResponse } from '../../shared/types.js';

const router = Router();

function rowToMessage(row: any, currentUser?: string): Message {
  return {
    id: row.id,
    productId: row.product_id,
    sender: row.sender,
    content: row.content,
    createdAt: row.created_at,
    isMine: currentUser ? row.sender === currentUser : undefined,
  };
}

router.get('/product/:productId', (req: Request, res: Response): void => {
  try {
    const { productId } = req.params;
    const { user } = req.query as { user?: string };
    const { since } = req.query as { since?: string };

    let sql = `SELECT * FROM messages WHERE product_id = ?`;
    const params: any[] = [Number(productId)];

    if (since) {
      sql += ` AND created_at > ?`;
      params.push(since);
    }

    sql += ` ORDER BY created_at ASC, id ASC`;

    const rows = db.prepare(sql).all(...params);
    const data = rows.map((r: any) => rowToMessage(r, user));
    res.json({ success: true, data } as ApiResponse<Message[]>);
  } catch (err) {
    res.status(500).json({ success: false, message: '获取留言失败' });
  }
});

router.post('/', (req: Request, res: Response): void => {
  try {
    const { productId, sender, content } = req.body;
    if (!productId || !sender || !content) {
      res.status(400).json({ success: false, message: '商品ID、发送者、内容不能为空' });
      return;
    }

    const product = db.prepare('SELECT id, status FROM products WHERE id = ?').get(Number(productId));
    if (!product) {
      res.status(404).json({ success: false, message: '商品不存在' });
      return;
    }
    if (product.status !== 'on') {
      res.status(400).json({ success: false, message: '商品已下架，无法留言' });
      return;
    }

    const mod = checkViolation(content);
    if (mod.isViolation) {
      res.status(422).json({
        success: false,
        message: mod.suggestion,
        moderation: mod,
      });
      return;
    }

    const result = db.prepare(`
      INSERT INTO messages (product_id, sender, content) VALUES (?, ?, ?)
    `).run(Number(productId), sender, content);

    const row = db.prepare('SELECT * FROM messages WHERE id = ?').get(result.lastInsertRowid);
    res.json({
      success: true,
      data: rowToMessage(row, sender),
      message: '留言成功',
    } as ApiResponse<Message>);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '留言失败' });
  }
});

router.delete('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const exists = db.prepare('SELECT id FROM messages WHERE id = ?').get(id);
    if (!exists) {
      res.status(404).json({ success: false, message: '留言不存在' });
      return;
    }
    db.prepare('DELETE FROM messages WHERE id = ?').run(id);
    res.json({ success: true, message: '删除成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: '删除失败' });
  }
});

export default router;
