import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const hash = crypto.randomBytes(12).toString('hex');
    cb(null, `${Date.now()}_${hash}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|bmp/i;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = allowed.test(file.mimetype);
    if (extOk && mimeOk) {
      cb(null, true);
    } else {
      cb(new Error('仅支持图片格式文件 (jpg, png, gif, webp)'));
    }
  },
});

const router = Router();

router.post('/image', upload.single('file'), (req: Request, res: Response): void => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: '请选择文件' });
      return;
    }
    const filename = req.file.filename;
    const url = `/uploads/${filename}`;
    res.json({
      success: true,
      data: { url, filename, originalName: req.file.originalname },
      message: '上传成功',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: '上传失败' });
  }
});

router.post('/images', upload.array('files', 9), (req: Request, res: Response): void => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      res.status(400).json({ success: false, message: '请选择文件' });
      return;
    }
    const urls = req.files.map((f: Express.Multer.File) => ({
      url: `/uploads/${f.filename}`,
      filename: f.filename,
      originalName: f.originalname,
    }));
    res.json({
      success: true,
      data: urls,
      message: `成功上传 ${urls.length} 张图片`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: '上传失败' });
  }
});

export default router;
