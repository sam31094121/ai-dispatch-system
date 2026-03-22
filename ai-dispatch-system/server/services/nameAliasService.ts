import { getDb } from '../db/database.js';

export interface NameAliasRule {
  id: number;
  wrong_name: string;
  correct_name: string;
  note_text: string | null;
}

/**
 * 取得正確的標準化姓名
 * 若查無規則，則傳回原姓名
 * @param name 原始姓名
 */
export function getCorrectName(name: string): string {
  if (!name) return name;
  const db = getDb();
  const rule = db.prepare('SELECT correct_name FROM name_alias_rules WHERE wrong_name = ?').get(name.trim()) as { correct_name: string } | undefined;
  return rule ? rule.correct_name : name.trim();
}

/**
 * 檢查是否為註冊的錯誤姓名
 * @param name 姓名
 */
export function isWrongName(name: string): boolean {
  if (!name) return false;
  const db = getDb();
  const rule = db.prepare('SELECT 1 FROM name_alias_rules WHERE wrong_name = ?').get(name.trim());
  return !!rule;
}

/**
 * 新增或更新名稱校正規則
 */
export function upsertNameAliasRule(wrongName: string, correctName: string, noteText?: string): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO name_alias_rules (wrong_name, correct_name, note_text)
    VALUES (?, ?, ?)
    ON CONFLICT(wrong_name) DO UPDATE SET correct_name = excluded.correct_name, note_text = excluded.note_text
  `).run(wrongName.trim(), correctName.trim(), noteText || null);
}

/**
 * 取得所有名稱校正規則
 */
export function getAllNameAliasRules(): NameAliasRule[] {
  const db = getDb();
  return db.prepare('SELECT * FROM name_alias_rules').all() as NameAliasRule[];
}
