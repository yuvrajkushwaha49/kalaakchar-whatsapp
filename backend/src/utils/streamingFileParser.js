import fs from 'fs';
import path from 'path';
import readline from 'readline';
import csvParser from 'csv-parser';
import ExcelJS from 'exceljs';

/**
 * Clean and normalize header strings
 */
function cleanHeader(header) {
  if (header === null || header === undefined) return '';
  return String(header)
    .replace(/^\uFEFF/, '') // Strip UTF-8 BOM
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Preview file with streaming: reads only first few rows for instant UI feedback
 * Returns headers, sample rows, estimated total rows, and suggested mappings
 */
export async function previewFile(filePath, fileType = 'csv') {
  const ext = fileType || path.extname(filePath).replace('.', '').toLowerCase();
  
  if (ext === 'xlsx' || ext === 'xls') {
    return previewXlsx(filePath);
  }
  return previewCsv(filePath);
}

/**
 * Stream-based CSV preview
 */
async function previewCsv(filePath) {
  return new Promise((resolve, reject) => {
    let headers = [];
    const sampleRows = [];
    let totalRows = 0;
    let isHeaderProcessed = false;

    const stream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: stream,
      crlfDelay: Infinity
    });

    rl.on('line', (line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      if (!isHeaderProcessed) {
        // Parse CSV line for headers
        headers = parseCsvLine(trimmed).map(cleanHeader);
        isHeaderProcessed = true;
      } else {
        const values = parseCsvLine(trimmed);
        const hasData = values.some(v => v !== undefined && v !== null && String(v).trim() !== '');
        if (!hasData) return; // Skip completely empty CSV lines

        totalRows++;
        if (sampleRows.length < 5) {
          const rowObj = {};
          headers.forEach((h, idx) => {
            rowObj[h] = values[idx] !== undefined ? values[idx].trim() : '';
          });
          sampleRows.push(rowObj);
        }
      }
    });

    rl.on('close', () => {
      const mappingSuggestions = generateMappingSuggestions(headers);
      resolve({
        headers,
        sampleRows,
        totalEstimatedRows: totalRows,
        mappingSuggestions,
        fileType: 'csv'
      });
    });

    rl.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Preview XLSX file using ExcelJS
 */
async function previewXlsx(filePath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.worksheets[0];

  if (!worksheet) {
    return {
      headers: [],
      sampleRows: [],
      totalEstimatedRows: 0,
      mappingSuggestions: {},
      fileType: 'xlsx'
    };
  }

  let headers = [];
  const sampleRows = [];
  let isHeaderProcessed = false;
  let totalRows = 0;

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    const rawValues = Array.isArray(row.values) ? row.values.slice(1) : [];
    if (rawValues.length === 0) return;
    const hasData = rawValues.some(v => {
      if (v === null || v === undefined) return false;
      const s = String(v.text || v.result || v).trim();
      return s.length > 0;
    });
    if (!hasData) return;

    if (!isHeaderProcessed) {
      headers = rawValues.map(v => cleanHeader(v ? (v.text || v.result || v) : ''));
      isHeaderProcessed = true;
    } else {
      totalRows++;
      if (sampleRows.length < 5) {
        const rowObj = {};
        headers.forEach((h, idx) => {
          const val = rawValues[idx];
          rowObj[h] = val !== undefined && val !== null ? String(val.text || val.result || val).trim() : '';
        });
        sampleRows.push(rowObj);
      }
    }
  });

  const mappingSuggestions = generateMappingSuggestions(headers);
  return {
    headers,
    sampleRows,
    totalEstimatedRows: totalRows,
    mappingSuggestions,
    fileType: 'xlsx'
  };
}

/**
 * Suggest column mappings based on common header names
 */
function generateMappingSuggestions(headers) {
  const mapping = {
    phone: '',
    name: '',
    email: '',
    tag: '',
    consent: ''
  };

  headers.forEach(h => {
    const lower = h.toLowerCase();
    if (!mapping.phone && (lower.includes('phone') || lower.includes('mobile') || lower.includes('whatsapp') || lower.includes('number') || lower.includes('contact'))) {
      mapping.phone = h;
    } else if (!mapping.name && (lower.includes('name') || lower.includes('customer') || lower.includes('client'))) {
      mapping.name = h;
    } else if (!mapping.email && lower.includes('email')) {
      mapping.email = h;
    } else if (!mapping.tag && (lower.includes('tag') || lower.includes('group') || lower.includes('segment') || lower.includes('category'))) {
      mapping.tag = h;
    } else if (!mapping.consent && (lower.includes('consent') || lower.includes('optin') || lower.includes('opt-in'))) {
      mapping.consent = h;
    }
  });

  return mapping;
}

/**
 * Fast RFC-compliant CSV line parser
 */
function parseCsvLine(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result;
}

/**
 * Async generator for streaming rows from CSV or XLSX files
 * Yields: { rowNumber: number, data: object }
 */
export async function* iterateRowsStream(filePath, fileType = 'csv', columnMapping = {}) {
  const ext = fileType || path.extname(filePath).replace('.', '').toLowerCase();

  if (ext === 'xlsx' || ext === 'xls') {
    yield* iterateXlsxRows(filePath, columnMapping);
  } else {
    yield* iterateCsvRows(filePath, columnMapping);
  }
}

/**
 * CSV streaming row iterator
 */
async function* iterateCsvRows(filePath, columnMapping) {
  const stream = fs.createReadStream(filePath);
  const parser = stream.pipe(csvParser({
    mapHeaders: ({ header }) => cleanHeader(header)
  }));

  let rowNumber = 1; // 1-based data row number (excluding header)
  for await (const row of parser) {
    const values = Object.values(row);
    const hasData = values.some(v => v !== null && v !== undefined && String(v).trim() !== '');
    if (!hasData) continue; // Skip blank CSV lines

    yield {
      rowNumber: rowNumber++,
      data: row
    };
  }
}

/**
 * XLSX row iterator using ExcelJS
 */
async function* iterateXlsxRows(filePath, columnMapping) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.worksheets[0];

  if (!worksheet) return;

  let headers = [];
  let isHeaderProcessed = false;
  let rowNumber = 1;

  for (let i = 1; i <= worksheet.rowCount; i++) {
    const row = worksheet.getRow(i);
    if (!row || !row.values) continue;
    const rawValues = Array.isArray(row.values) ? row.values.slice(1) : [];
    if (rawValues.length === 0) continue;

    const hasData = rawValues.some(v => {
      if (v === null || v === undefined) return false;
      const s = String(v.text || v.result || v).trim();
      return s.length > 0;
    });
    if (!hasData) continue; // Skip ghost empty Excel rows

    if (!isHeaderProcessed) {
      headers = rawValues.map(v => cleanHeader(v ? (v.text || v.result || v) : ''));
      isHeaderProcessed = true;
    } else {
      const rowObj = {};
      let rowHasNonEmptyCell = false;
      headers.forEach((h, idx) => {
        const val = rawValues[idx];
        const cellStr = val !== undefined && val !== null ? String(val.text || val.result || val).trim() : '';
        rowObj[h] = cellStr;
        if (cellStr !== '') rowHasNonEmptyCell = true;
      });

      if (!rowHasNonEmptyCell) continue;

      yield {
        rowNumber: rowNumber++,
        data: rowObj
      };
    }
  }
}

export default {
  previewFile,
  iterateRowsStream
};
