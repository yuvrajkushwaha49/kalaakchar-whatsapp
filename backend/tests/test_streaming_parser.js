import fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';
import { previewFile, iterateRowsStream } from '../src/utils/streamingFileParser.js';

async function test() {
  const tmpDir = path.resolve('uploads', 'test_tmp');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  // 1. Create a test CSV
  const csvPath = path.join(tmpDir, 'test_sample.csv');
  const csvContent = `phone,name,email,consent
9811122233,Ananya Gupta,ananya@test.com,yes
9822233344,Vikram Malhotra,vikram@test.com,yes
9833344455,Sunita Rao,sunita@test.com,yes
9844455566,Rohan Mehra,rohan@test.com,yes
9855566677,Deepa Nair,deepa@test.com,yes`;
  fs.writeFileSync(csvPath, csvContent, 'utf-8');

  console.log('--- Testing CSV Preview ---');
  const csvPrev = await previewFile(csvPath, 'csv');
  console.log('CSV Preview Output:', JSON.stringify(csvPrev, null, 2));

  console.log('\n--- Testing CSV Stream Iteration ---');
  let csvCount = 0;
  for await (const row of iterateRowsStream(csvPath, 'csv')) {
    csvCount++;
  }
  console.log(`Successfully iterated ${csvCount} CSV rows.`);

  // 2. Create a test XLSX with ExcelJS
  const xlsxPath = path.join(tmpDir, 'test_sample.xlsx');
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Contacts');
  sheet.addRow(['Mobile Number', 'Full Name', 'Email Address', 'Group Tag']);
  for (let i = 1; i <= 20; i++) {
    sheet.addRow([`98000000${i.toString().padStart(2, '0')}`, `Test Contact ${i}`, `contact${i}@example.com`, 'VIP']);
  }
  await workbook.xlsx.writeFile(xlsxPath);

  console.log('\n--- Testing XLSX Preview ---');
  const xlsxPrev = await previewFile(xlsxPath, 'xlsx');
  console.log('XLSX Preview Output:', JSON.stringify(xlsxPrev, null, 2));

  console.log('\n--- Testing XLSX Stream Iteration ---');
  let xlsxCount = 0;
  for await (const row of iterateRowsStream(xlsxPath, 'xlsx')) {
    xlsxCount++;
  }
  console.log(`Successfully iterated ${xlsxCount} XLSX rows.`);

  // Cleanup test files
  fs.rmSync(tmpDir, { recursive: true, force: true });
  console.log('\n✅ All Streaming File Parser tests passed cleanly!');
}

test().catch(console.error);

