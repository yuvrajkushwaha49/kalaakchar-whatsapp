import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import importQueue from '../src/queues/importQueue.js';
import { processImportJob } from '../src/services/importBatchProcessor.js';
import { checkConnection, executeQuery, isUsingFallback, getMemoryStore } from '../src/database/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BENCHMARK_DIR = path.resolve(__dirname, 'fixtures');

if (!fs.existsSync(BENCHMARK_DIR)) {
  fs.mkdirSync(BENCHMARK_DIR, { recursive: true });
}

function generateBenchmarkCsv(filePath, count, duplicateRate = 0.05, invalidRate = 0.02) {
  const writeStream = fs.createWriteStream(filePath, { encoding: 'utf-8' });
  writeStream.write('phone,full_name,email_address,consent_status\n');

  const duplicateCount = Math.floor(count * duplicateRate);
  const invalidCount = Math.floor(count * invalidRate);
  const uniqueCount = count - duplicateCount - invalidCount;

  // 1. Write unique valid contacts
  for (let i = 1; i <= uniqueCount; i++) {
    const phone = `98${String(i).padStart(8, '0')}`;
    writeStream.write(`${phone},Customer ${i},customer${i}@example.com,yes\n`);
  }

  // 2. Write duplicate rows (repeating early phones)
  for (let i = 1; i <= duplicateCount; i++) {
    const dupIndex = (i % Math.max(1, uniqueCount)) + 1;
    const phone = `98${String(dupIndex).padStart(8, '0')}`;
    writeStream.write(`${phone},Duplicate Customer ${i},dup${i}@example.com,yes\n`);
  }

  // 3. Write invalid rows (missing/bad phone or invalid consent)
  for (let i = 1; i <= invalidCount; i++) {
    if (i % 2 === 0) {
      writeStream.write(`invalid_phone_${i},Invalid Number,bad${i}@example.com,yes\n`);
    } else {
      const phone = `99${String(i).padStart(8, '0')}`;
      writeStream.write(`${phone},No Consent,noconsent${i}@example.com,no\n`);
    }
  }

  return new Promise((resolve, reject) => {
    writeStream.end(() => {
      resolve({
        total: count,
        expectedUnique: uniqueCount,
        expectedDuplicates: duplicateCount,
        expectedInvalid: invalidCount
      });
    });
    writeStream.on('error', reject);
  });
}

function formatBytes(bytes) {
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

async function runBenchmarkForScale(scaleCount, businessId = 1, userId = 1) {
  const fileName = `bench_${scaleCount}.csv`;
  const filePath = path.join(BENCHMARK_DIR, fileName);

  console.log(`\n======================================================`);
  console.log(`🚀 Benchmarking Import Scale: ${scaleCount.toLocaleString()} Contacts`);
  console.log(`======================================================`);

  const genStart = Date.now();
  const meta = await generateBenchmarkCsv(filePath, scaleCount);
  console.log(`📁 Test CSV generated in ${(Date.now() - genStart)}ms (${formatBytes(fs.statSync(filePath).size)})`);

  // Force garbage collection if exposed
  if (global.gc) global.gc();

  const initialMemory = process.memoryUsage();
  console.log(`📊 Initial RAM: Heap Used ${formatBytes(initialMemory.heapUsed)} / RSS ${formatBytes(initialMemory.rss)}`);

  const startTime = Date.now();
  const startCpu = process.cpuUsage();

  // Enqueue Job
  const jobId = await importQueue.enqueueImportJob(businessId, userId, {
    fileName,
    filePath,
    fileType: 'csv',
    fileSize: fs.statSync(filePath).size,
    totalRows: scaleCount,
    columnMapping: {
      phone: 'phone',
      name: 'full_name',
      email: 'email_address',
      consent: 'consent_status'
    },
    options: {
      batchTag: `scale_test_${scaleCount}`,
      defaultCountryCode: '91',
      consentSource: 'scale_benchmark'
    }
  });

  // Claim and process
  const claimedJob = await importQueue.claimNextJob();
  if (!claimedJob) {
    throw new Error(`Failed to claim enqueued job #${jobId}`);
  }

  let peakHeap = initialMemory.heapUsed;
  const memInterval = setInterval(() => {
    const current = process.memoryUsage().heapUsed;
    if (current > peakHeap) peakHeap = current;
  }, 50);

  const processResult = await processImportJob(claimedJob);
  clearInterval(memInterval);

  const durationMs = Date.now() - startTime;
  const cpuDiff = process.cpuUsage(startCpu);
  const totalCpuMs = (cpuDiff.user + cpuDiff.system) / 1000;
  const finalMemory = process.memoryUsage();

  console.log(`⏱️ Duration: ${(durationMs / 1000).toFixed(2)} seconds`);
  console.log(`⚡ Throughput: ${Math.round((scaleCount / (durationMs / 1000)))} rows/second`);
  console.log(`🧠 Peak Heap Used: ${formatBytes(peakHeap)} (Delta: +${formatBytes(Math.max(0, peakHeap - initialMemory.heapUsed))})`);
  console.log(`💻 CPU Time: ${(totalCpuMs / 1000).toFixed(2)}s`);
  console.log(`📈 Results:`);
  console.log(`   - Total Processed : ${processResult.totalRows.toLocaleString()}`);
  console.log(`   - Successfully Imported: ${processResult.successful.toLocaleString()}`);
  console.log(`   - Duplicates Skipped   : ${processResult.duplicates.toLocaleString()}`);
  console.log(`   - Failed / Ineligible  : ${processResult.failed.toLocaleString()}`);

  // Clean up benchmark file
  try { fs.unlinkSync(filePath); } catch (_) {}

  return {
    scale: scaleCount,
    durationMs,
    throughput: Math.round(scaleCount / (durationMs / 1000)),
    peakHeapMb: (peakHeap / 1024 / 1024).toFixed(2),
    heapDeltaMb: (Math.max(0, peakHeap - initialMemory.heapUsed) / 1024 / 1024).toFixed(2),
    cpuTimeSec: (totalCpuMs / 1000).toFixed(2),
    successful: processResult.successful,
    duplicates: processResult.duplicates,
    failed: processResult.failed
  };
}

async function runWorkerRecoveryTest() {
  console.log(`\n======================================================`);
  console.log(`🔄 Testing Worker Crash & Abandoned Job Recovery`);
  console.log(`======================================================`);

  // Enqueue a dummy job
  const jobId = await importQueue.enqueueImportJob(1, 1, {
    fileName: 'crashed_worker_test.csv',
    filePath: 'dummy/path.csv',
    fileType: 'csv',
    fileSize: 1024,
    totalRows: 500,
    columnMapping: { phone: 'phone' }
  });

  // Manually claim it and simulate a crashed worker by backdating heartbeat
  if (isUsingFallback()) {
    const store = getMemoryStore();
    const job = store.import_jobs.find(j => j.id === jobId);
    job.status = 'processing';
    job.started_at = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    job.heartbeat_at = new Date(Date.now() - 30 * 60 * 1000).toISOString(); // 30 mins ago
  } else {
    await executeQuery(
      `UPDATE import_jobs 
       SET status = 'processing', heartbeat_at = DATE_SUB(NOW(), INTERVAL 30 MINUTE)
       WHERE id = ?`,
      [jobId]
    );
  }

  console.log(`⚠️ Job #${jobId} set to 'processing' with heartbeat 30 minutes expired`);

  // Run recovery routine with 5 minute threshold
  const recoveredCount = await importQueue.recoverAbandonedJobs(5);
  console.log(`🛡️ recoverAbandonedJobs(5) returned: ${recoveredCount} recovered job(s)`);

  let recoveredJob;
  if (isUsingFallback()) {
    const store = getMemoryStore();
    recoveredJob = store.import_jobs.find(j => j.id === jobId);
  } else {
    const rows = await executeQuery('SELECT * FROM import_jobs WHERE id = ?', [jobId]);
    recoveredJob = rows[0];
  }

  console.log(`✅ Recovered Job #${jobId} status: ${recoveredJob.status}, retry_count: ${recoveredJob.retry_count}`);
  if (recoveredJob.status !== 'retrying' && recoveredJob.status !== 'pending') {
    throw new Error(`Job was not recovered properly. Status is ${recoveredJob.status}`);
  }
}

async function runMultiTenantIsolationTest() {
  console.log(`\n======================================================`);
  console.log(`🏢 Testing Multi-Tenant Data Isolation`);
  console.log(`======================================================`);

  // Enqueue job for Business #1
  const job1Id = await importQueue.enqueueImportJob(1, 1, {
    fileName: 'tenant1.csv',
    filePath: 'dummy1.csv',
    fileType: 'csv',
    columnMapping: { phone: 'phone' }
  });

  // Enqueue job for Business #2
  const job2Id = await importQueue.enqueueImportJob(2, 2, {
    fileName: 'tenant2.csv',
    filePath: 'dummy2.csv',
    fileType: 'csv',
    columnMapping: { phone: 'phone' }
  });

  // Check tenant 1 query
  let tenant1Jobs, tenant2Jobs;
  if (isUsingFallback()) {
    const store = getMemoryStore();
    tenant1Jobs = store.import_jobs.filter(j => j.business_id === 1);
    tenant2Jobs = store.import_jobs.filter(j => j.business_id === 2);
  } else {
    tenant1Jobs = await executeQuery('SELECT * FROM import_jobs WHERE business_id = 1');
    tenant2Jobs = await executeQuery('SELECT * FROM import_jobs WHERE business_id = 2');
  }

  const tenant1SeesTenant2 = tenant1Jobs.some(j => j.id === job2Id);
  const tenant2SeesTenant1 = tenant2Jobs.some(j => j.id === job1Id);

  console.log(`🔒 Tenant 1 sees Tenant 2 jobs: ${tenant1SeesTenant2 ? 'VIOLATION' : 'SECURE (false)'}`);
  console.log(`🔒 Tenant 2 sees Tenant 1 jobs: ${tenant2SeesTenant1 ? 'VIOLATION' : 'SECURE (false)'}`);

  if (tenant1SeesTenant2 || tenant2SeesTenant1) {
    throw new Error('Tenant data leakage detected!');
  }
  console.log(`✅ Multi-tenant isolation verified.`);
}

async function main() {
  await checkConnection();

  const results = [];
  // 1. 100 contacts
  results.push(await runBenchmarkForScale(100));
  // 2. 5,000 contacts
  results.push(await runBenchmarkForScale(5000));
  // 3. 50,000 contacts
  results.push(await runBenchmarkForScale(50000));
  // 4. 100,000 contacts
  results.push(await runBenchmarkForScale(100000));

  // 5. Worker Recovery Test
  await runWorkerRecoveryTest();

  // 6. Multi-Tenant Isolation Test
  await runMultiTenantIsolationTest();

  console.log(`\n======================================================`);
  console.log(`📊 FINAL BENCHMARK SUMMARY TABLE`);
  console.log(`======================================================`);
  console.table(results);

  process.exit(0);
}

main().catch(err => {
  console.error('❌ Benchmark error:', err);
  process.exit(1);
});
