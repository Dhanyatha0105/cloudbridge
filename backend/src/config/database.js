const path = require('path');
const fs = require('fs');

// File-based persistence layer — production would swap this for PostgreSQL/MongoDB
// using the same repository interface below
const DATA_DIR = path.join(__dirname, '../../data');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const readTable = (table) => {
  const file = path.join(DATA_DIR, `${table}.json`);
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, 'utf8'));
};

const writeTable = (table, data) => {
  const file = path.join(DATA_DIR, `${table}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

const upsert = (table, record, keyField = 'id') => {
  const rows = readTable(table);
  const idx = rows.findIndex(r => r[keyField] === record[keyField]);
  if (idx >= 0) rows[idx] = { ...rows[idx], ...record, updatedAt: new Date().toISOString() };
  else rows.push({ ...record, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  writeTable(table, rows);
  return idx >= 0 ? rows[idx] : rows[rows.length - 1];
};

const findOne = (table, predicate) => readTable(table).find(predicate) || null;
const findAll = (table, predicate) => predicate ? readTable(table).filter(predicate) : readTable(table);
const deleteOne = (table, predicate) => {
  const rows = readTable(table);
  const filtered = rows.filter(r => !predicate(r));
  writeTable(table, filtered);
  return rows.length !== filtered.length;
};

module.exports = { readTable, writeTable, upsert, findOne, findAll, deleteOne };
