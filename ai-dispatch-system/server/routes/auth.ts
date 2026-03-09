import { Router } from 'express';
import { getDb } from '../db/database.js';

const router = Router();

// POST /api/v1/auth/login
router.post('/login', (req, res) => {
  const { account, password } = req.body;
  if (!account || !password) {
    return res.status(400).json({ success: false, message: '帳號和密碼不可空白', data: null, error_code: 'MISSING_FIELDS' });
  }
  const db = getDb();
  const user = db.prepare('SELECT id, account, display_name, role_name, is_enabled FROM app_users WHERE account = ? AND password_hash = ?')
    .get(account, password) as any;
  if (!user) {
    return res.status(401).json({ success: false, message: '帳號或密碼錯誤', data: null, error_code: 'AUTH_FAILED' });
  }
  if (!user.is_enabled) {
    return res.status(403).json({ success: false, message: '帳號已停用', data: null, error_code: 'ACCOUNT_DISABLED' });
  }
  db.prepare('UPDATE app_users SET last_login_at = datetime("now","localtime") WHERE id = ?').run(user.id);
  return res.json({
    success: true,
    message: '登入成功',
    data: {
      user: { id: user.id, account: user.account, display_name: user.display_name, role_name: user.role_name },
      token: `jwt_placeholder_${user.id}_${Date.now()}`,
    },
    error_code: null,
  });
});

// POST /api/v1/auth/logout
router.post('/logout', (_req, res) => {
  res.json({ success: true, message: '登出成功', data: null, error_code: null });
});

export default router;
