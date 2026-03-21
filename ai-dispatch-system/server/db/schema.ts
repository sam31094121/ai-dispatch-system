import type Database from 'better-sqlite3';

/**
 * ═══════════════════════════════════════════════════════
 * 12 張資料表 DDL — 對齊 PostgreSQL 生產規格
 * ═══════════════════════════════════════════════════════
 */
export function initSchema(db: Database.Database): void {
  db.exec(`
    -- ══════ 1. app_users 使用者資料表 ══════
    CREATE TABLE IF NOT EXISTS app_users (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      account         TEXT    NOT NULL UNIQUE,
      password_hash   TEXT    NOT NULL,
      display_name    TEXT    NOT NULL,
      role_name       TEXT    NOT NULL CHECK(role_name IN ('管理員','主管','一般操作員')) DEFAULT '一般操作員',
      is_enabled      INTEGER NOT NULL DEFAULT 1,
      created_at      TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
      last_login_at   TEXT
    );

    -- ══════ 2. daily_reports 每日報表主表 ══════
    CREATE TABLE IF NOT EXISTS daily_reports (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      report_date         TEXT    NOT NULL,
      platform_name       TEXT    NOT NULL CHECK(platform_name IN ('奕心','民視','公司產品')),
      report_mode         TEXT    NOT NULL CHECK(report_mode IN ('累積報表','單日報表')) DEFAULT '累積報表',
      raw_text_content    TEXT    NOT NULL,
      parse_status        TEXT    NOT NULL DEFAULT '未解析' CHECK(parse_status IN ('未解析','解析成功','解析失敗')),
      audit_status        TEXT    NOT NULL DEFAULT '未審計' CHECK(audit_status IN ('未審計','審計通過','審計失敗')),
      announcement_status TEXT    NOT NULL DEFAULT '未生成' CHECK(announcement_status IN ('未生成','已生成')),
      created_by_user_id  INTEGER NOT NULL DEFAULT 1 REFERENCES app_users(id),
      note_text           TEXT,
      created_at          TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at          TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
      UNIQUE(report_date, platform_name)
    );

    -- ══════ 3. daily_report_totals 每日報表總計表 ══════
    CREATE TABLE IF NOT EXISTS daily_report_totals (
      id                      INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id               INTEGER NOT NULL UNIQUE REFERENCES daily_reports(id) ON DELETE CASCADE,
      total_calls             INTEGER NOT NULL DEFAULT 0,
      assigned_deals_count    INTEGER NOT NULL DEFAULT 0,
      followup_deals_count    INTEGER NOT NULL DEFAULT 0,
      closing_rate_percent    REAL,
      followup_amount         INTEGER NOT NULL DEFAULT 0,
      cancelled_return_amount INTEGER NOT NULL DEFAULT 0,
      total_revenue_amount    INTEGER NOT NULL DEFAULT 0,
      created_at              TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at              TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );

    -- ══════ 4. daily_report_details 每日報表明細表 ══════
    CREATE TABLE IF NOT EXISTS daily_report_details (
      id                      INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id               INTEGER NOT NULL REFERENCES daily_reports(id) ON DELETE CASCADE,
      employee_name           TEXT    NOT NULL,
      normalized_name         TEXT    NOT NULL,
      identity_tag            TEXT    NOT NULL DEFAULT '一般' CHECK(identity_tag IN ('一般','新人','停用')),
      total_calls             INTEGER NOT NULL DEFAULT 0,
      assigned_deals_count    INTEGER NOT NULL DEFAULT 0,
      followup_deals_count    INTEGER NOT NULL DEFAULT 0,
      closing_rate_percent    REAL,
      followup_amount         INTEGER NOT NULL DEFAULT 0,
      cancelled_return_amount INTEGER NOT NULL DEFAULT 0,
      total_revenue_amount    INTEGER NOT NULL DEFAULT 0,
      raw_row_order           INTEGER NOT NULL DEFAULT 0,
      is_manually_confirmed   INTEGER NOT NULL DEFAULT 0,
      created_at              TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at              TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
      UNIQUE(report_id, normalized_name)
    );

    -- ══════ 5. ai_parse_logs 解析紀錄表 ══════
    CREATE TABLE IF NOT EXISTS ai_parse_logs (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id       INTEGER NOT NULL REFERENCES daily_reports(id) ON DELETE CASCADE,
      parse_stage     TEXT    NOT NULL CHECK(parse_stage IN ('格式清洗','結構辨識','總計提取','明細提取','姓名提取')),
      parse_result    TEXT    NOT NULL CHECK(parse_result IN ('成功','失敗','部分成功')),
      description_text TEXT,
      created_at      TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );

    -- ══════ 6. ai_auto_fix_logs 自動修正紀錄表 ══════
    CREATE TABLE IF NOT EXISTS ai_auto_fix_logs (
      id                      INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id               INTEGER NOT NULL REFERENCES daily_reports(id) ON DELETE CASCADE,
      detail_id               INTEGER REFERENCES daily_report_details(id) ON DELETE CASCADE,
      fix_level               TEXT    NOT NULL CHECK(fix_level IN ('可自動修正','建議確認','禁止自修')),
      fix_type                TEXT    NOT NULL CHECK(fix_type IN (
        '千分位修正','空白修正','全形半形修正','括號修正',
        '欄位名稱統一','新人標記統一','姓名疑似衝突',
        '日期格式建議','百分比格式修正','換行錯位重整'
      )),
      field_name              TEXT    NOT NULL,
      value_before            TEXT,
      value_after             TEXT,
      is_applied              INTEGER NOT NULL DEFAULT 0,
      requires_manual_confirm INTEGER NOT NULL DEFAULT 0,
      created_at              TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );

    -- ══════ 7. ai_audit_results 審計結果表 ══════
    CREATE TABLE IF NOT EXISTS ai_audit_results (
      id                    INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id             INTEGER NOT NULL UNIQUE REFERENCES daily_reports(id) ON DELETE CASCADE,
      consistency_result    TEXT    NOT NULL CHECK(consistency_result IN ('通過','失敗')) DEFAULT '失敗',
      logic_result          TEXT    NOT NULL CHECK(logic_result IN ('通過','失敗')) DEFAULT '失敗',
      cumulative_result     TEXT    NOT NULL CHECK(cumulative_result IN ('通過','失敗')) DEFAULT '失敗',
      final_result          TEXT    NOT NULL CHECK(final_result IN ('通過','失敗')) DEFAULT '失敗',
      can_generate_ranking  INTEGER NOT NULL DEFAULT 0,
      can_generate_dispatch INTEGER NOT NULL DEFAULT 0,
      can_generate_announce INTEGER NOT NULL DEFAULT 0,
      audit_summary         TEXT,
      created_at            TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );

    -- ══════ 8. ai_audit_issues 審計異常表 ══════
    CREATE TABLE IF NOT EXISTS ai_audit_issues (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id       INTEGER NOT NULL REFERENCES daily_reports(id) ON DELETE CASCADE,
      detail_id       INTEGER REFERENCES daily_report_details(id) ON DELETE CASCADE,
      issue_type      TEXT    NOT NULL CHECK(issue_type IN (
        '天地盤差額','成交有值業績為零','追單有值業績為零',
        '續單有值業績為零','累積倒退','欄位缺漏',
        '姓名衝突','退貨未反映','疑似少零多零'
      )),
      issue_level     TEXT    NOT NULL CHECK(issue_level IN ('警告','鎖死')),
      field_name      TEXT,
      raw_value       TEXT,
      expected_value  TEXT,
      diff_value      TEXT,
      suggestion_text TEXT,
      is_resolved     INTEGER NOT NULL DEFAULT 0,
      created_at      TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );

    -- ══════ 9. integrated_rankings 整合排名結果表 ══════
    CREATE TABLE IF NOT EXISTS integrated_rankings (
      id                    INTEGER PRIMARY KEY AUTOINCREMENT,
      report_date           TEXT    NOT NULL,
      employee_name         TEXT    NOT NULL,
      normalized_name       TEXT    NOT NULL,
      total_followup_count  INTEGER NOT NULL DEFAULT 0,
      total_followup_amount INTEGER NOT NULL DEFAULT 0,
      total_revenue_amount  INTEGER NOT NULL DEFAULT 0,
      total_actual_amount   INTEGER NOT NULL DEFAULT 0,
      total_cancel_amount   INTEGER NOT NULL DEFAULT 0,
      rank_no               INTEGER NOT NULL,
      ranking_rule_text     TEXT    NOT NULL,
      source_platform_data  TEXT    NOT NULL DEFAULT '{}',
      created_at            TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
      UNIQUE(report_date, normalized_name)
    );

    -- ══════ 10. dispatch_group_results 派單分組結果表 ══════
    CREATE TABLE IF NOT EXISTS dispatch_group_results (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      report_date       TEXT    NOT NULL,
      employee_name     TEXT    NOT NULL,
      normalized_name   TEXT    NOT NULL,
      rank_no           INTEGER NOT NULL,
      dispatch_group    TEXT    NOT NULL CHECK(dispatch_group IN ('A1','A2','B','C')),
      group_order_no    INTEGER NOT NULL,
      suggestion_text   TEXT,
      pressure_text     TEXT,
      motivation_text   TEXT,
      created_at        TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
      UNIQUE(report_date, normalized_name)
    );

    -- ══════ 11. announcement_outputs 公告輸出結果表 ══════
    CREATE TABLE IF NOT EXISTS announcement_outputs (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      report_date       TEXT    NOT NULL UNIQUE,
      full_text         TEXT,
      line_text         TEXT,
      short_text        TEXT,
      voice_text        TEXT,
      manager_text      TEXT,
      final_confirm_text TEXT,
      created_at        TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at        TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );

    -- ══════ 12. version_change_logs 版本異動紀錄表 ══════
    CREATE TABLE IF NOT EXISTS version_change_logs (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id           INTEGER NOT NULL REFERENCES daily_reports(id) ON DELETE CASCADE,
      detail_id           INTEGER REFERENCES daily_report_details(id) ON DELETE CASCADE,
      changed_field_name  TEXT    NOT NULL,
      value_before        TEXT,
      value_after         TEXT,
      change_reason       TEXT    NOT NULL,
      changed_by_user_id  INTEGER REFERENCES app_users(id),
      change_source       TEXT    NOT NULL CHECK(change_source IN ('人工','系統自動修正','套用建議')) DEFAULT '系統自動修正',
      created_at          TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );

    -- ══════ 13. dispatch_snapshots 派單結果快照表 ══════
    CREATE TABLE IF NOT EXISTS dispatch_snapshots (
      version             TEXT    PRIMARY KEY,
      report_date         TEXT    NOT NULL,
      computed_at         TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
      data_hash           TEXT    NOT NULL,
      audit_result        TEXT    NOT NULL CHECK(audit_result IN ('PASS','FAIL')),
      audit_panels        TEXT    NOT NULL DEFAULT '{}',
      total_summary       TEXT    NOT NULL DEFAULT '{}',
      ranking_list        TEXT    NOT NULL DEFAULT '[]',
      dispatch_groups     TEXT    NOT NULL DEFAULT '{}',
      announcement        TEXT    NOT NULL DEFAULT ''
    );

    -- ══════ 14. name_alias_rules 名稱標準化規則表 ══════
    CREATE TABLE IF NOT EXISTS name_alias_rules (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      wrong_name          TEXT    NOT NULL UNIQUE,
      correct_name        TEXT    NOT NULL,
      note_text           TEXT,
      created_at          TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );

    -- ══════ 索引 ══════
    CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON daily_reports(report_date);
    CREATE INDEX IF NOT EXISTS idx_details_report ON daily_report_details(report_id);
    CREATE INDEX IF NOT EXISTS idx_details_name ON daily_report_details(normalized_name);
    CREATE INDEX IF NOT EXISTS idx_parse_logs_report ON ai_parse_logs(report_id);
    CREATE INDEX IF NOT EXISTS idx_fix_logs_report ON ai_auto_fix_logs(report_id);
    CREATE INDEX IF NOT EXISTS idx_issues_report ON ai_audit_issues(report_id);
    CREATE INDEX IF NOT EXISTS idx_rankings_date ON integrated_rankings(report_date);
    CREATE INDEX IF NOT EXISTS idx_dispatch_date ON dispatch_group_results(report_date);
    CREATE INDEX IF NOT EXISTS idx_versions_report ON version_change_logs(report_id);
    CREATE INDEX IF NOT EXISTS idx_snapshots_date ON dispatch_snapshots(report_date);

    -- ══════ 預設管理員 ══════
    INSERT OR IGNORE INTO app_users (account, password_hash, display_name, role_name)
    VALUES ('admin', 'admin', '系統管理員', '管理員');

    -- ══════ 預設名稱校正規則 ══════
    INSERT OR IGNORE INTO name_alias_rules (wrong_name, correct_name, note_text)
    VALUES ('徐華好', '徐華妤', '規格書指定錯名防呆');
  `);
}
