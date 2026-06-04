#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const migrationPath = path.join(
  root,
  'sunflower-backend/src/main/resources/db/migration/common/V8__align_wechat_lob_columns.sql',
);
const migration = fs.readFileSync(migrationPath, 'utf8').toLowerCase();

const expectedColumns = [
  ['wechat_payment_orders', 'request_snapshot'],
  ['wechat_payment_orders', 'response_snapshot'],
  ['wechat_refund_orders', 'request_snapshot'],
  ['wechat_refund_orders', 'response_snapshot'],
  ['wechat_notify_events', 'raw_headers'],
  ['wechat_notify_events', 'raw_body'],
  ['wechat_notify_events', 'decrypted_body'],
];

const missing = [];

for (const [table, column] of expectedColumns) {
  if (!migration.includes(`alter table ${table}`)) {
    missing.push(`${table}: missing ALTER TABLE`);
  }

  const columnPattern = new RegExp(`modify\\s+${column}\\s+longtext\\s+null`, 'i');
  if (!columnPattern.test(migration)) {
    missing.push(`${table}.${column}: missing LONGTEXT NULL modifier`);
  }
}

if (missing.length > 0) {
  console.error('[wechat-lob-migration] ERROR: V8 migration is incomplete');
  for (const item of missing) {
    console.error(`- ${item}`);
  }
  process.exit(1);
}

console.log(`[wechat-lob-migration] PASS: ${expectedColumns.length} WeChat payment LOB columns are aligned to LONGTEXT`);
