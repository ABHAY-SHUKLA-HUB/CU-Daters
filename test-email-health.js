import { getEmailServiceHealth } from './utils/emailService.js';

console.log('\n' + '='.repeat(80));
console.log('📧 EMAIL SERVICE HEALTH CHECK');
console.log('='.repeat(80));

const health = getEmailServiceHealth();

console.log(JSON.stringify(health, null, 2));

console.log('='.repeat(80));
console.log('Summary:');
console.log('  Configured:', health.configured ? '✅ YES' : '❌ NO');
console.log('  Mode:', health.mode);
console.log('  SMTP:', health.smtp);
console.log('  Last Error Code:', health.lastErrorCode || 'NONE');
console.log('  Last Error Message:', health.lastErrorMessage || 'NONE');
console.log('  Consecutive Failures:', health.counters.consecutiveFailures);
console.log('='.repeat(80) + '\n');

process.exit(0);
