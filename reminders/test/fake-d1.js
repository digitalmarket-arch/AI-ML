// A small stand-in for a Cloudflare D1 binding, on Node's built-in SQLite (node:sqlite).
// Only for the in-process unit tests; the end-to-end test runs the real D1 in wrangler dev.
// It records every statement so tests can count queries per invocation.
// fakeD1(schemaPath) starts with the tables of schema.sql; fakeD1() starts empty, as a brand-new D1 database does.

import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';

export function fakeD1(schemaPath) {
  const db = new DatabaseSync(':memory:');
  if (schemaPath) db.exec(fs.readFileSync(schemaPath, 'utf8'));
  const log = [];

  class Statement {
    constructor(sql, params = []) {
      this.sql = sql;
      this.params = params;
    }
    bind(...params) {
      return new Statement(this.sql, params);
    }
    rows() {
      log.push(this.sql.replace(/\s+/g, ' ').trim());
      return db.prepare(this.sql).all(...this.params).map((r) => ({ ...r }));
    }
    async first(column) {
      const row = this.rows()[0] || null;
      if (column === undefined) return row;
      return row ? row[column] : null;
    }
    async all() {
      return { results: this.rows(), success: true, meta: {} };
    }
    async run() {
      this.rows();
      return { success: true, meta: {} };
    }
  }

  return {
    db,
    log,
    batches: [],
    prepare(sql) {
      return new Statement(sql);
    },
    async batch(statements) {
      this.batches.push(statements.length);
      log.push('BATCH ' + statements.length);
      db.exec('BEGIN');
      try {
        const out = statements.map((s) => ({ results: s.rows(), success: true, meta: {} }));
        db.exec('COMMIT');
        return out;
      } catch (err) {
        db.exec('ROLLBACK');
        throw err;
      }
    },
  };
}
