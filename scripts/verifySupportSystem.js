#!/usr/bin/env node

/**
 * Verification Script for Live Chat Support System
 * Checks all components are correctly integrated
 * Run with: node scripts/verifySupportSystem.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const files = {
  models: [
    'models/SupportTicket.js',
    'models/SupportMessage.js',
    'models/SupportCategory.js'
  ],
  routes: [
    'routes/support.js',
  ],
  socket: [
    'socket/supportSocket.js'
  ],
  utils: [
    'utils/supportAutoReject.js',
    'utils/initSupportCategories.js'
  ],
  components: [
    'src/components/support/SupportWidget.jsx',
    'src/components/support/SupportWidget.css',
    'src/components/admin/AdminSupportDashboard.jsx',
    'src/components/admin/AdminSupportDashboard.css',
    'src/components/admin/AdminSupportChat.jsx',
    'src/components/admin/AdminSupportChat.css'
  ],
  scripts: [
    'scripts/setupSupport.js',
    'scripts/verifySupportSystem.js'
  ],
  docs: [
    'SUPPORT_INTEGRATION_GUIDE.md',
    'SUPPORT_DEPLOYMENT_CHECKLIST.md'
  ]
};

console.log('\n🔍 Verifying Live Chat Support System Integration\n');
console.log('='.repeat(60));

let allExist = true;
let categoryCount = 0;

for (const [category, fileList] of Object.entries(files)) {
  console.log(`\n📁 ${category.toUpperCase()}:`);
  
  for (const file of fileList) {
    const fullPath = path.join(projectRoot, file);
    const exists = fs.existsSync(fullPath);
    const status = exists ? '✅' : '❌';
    console.log(`  ${status} ${file}`);
    
    if (!exists) {
      allExist = false;
    } else {
      categoryCount++;
    }
  }
}

console.log('\n' + '='.repeat(60));
console.log(`\n📊 Summary: ${categoryCount}/${Object.values(files).flat().length} files found\n`);

// Check server.js integrations
console.log('🔌 Checking server.js integrations:\n');

const serverPath = path.join(projectRoot, 'server.js');
const serverContent = fs.readFileSync(serverPath, 'utf-8');

const checks = [
  {
    name: 'supportRoutes import',
    regex: /import supportRoutes from '\.\/routes\/support\.js'/
  },
  {
    name: 'registerSupportSocket import',
    regex: /import \{ registerSupportSocket \} from '\.\/socket\/supportSocket\.js'/
  },
  {
    name: 'supportAutoReject import',
    regex: /import \{ startSupportAutoRejectInterval \} from '\.\/utils\/supportAutoReject\.js'/
  },
  {
    name: 'supportRoutes registration',
    regex: /app\.use\('\/api\/support', supportRoutes\)/
  },
  {
    name: 'registerSupportSocket call',
    regex: /registerSupportSocket\(io\)/
  },
  {
    name: 'startSupportAutoRejectInterval call',
    regex: /startSupportAutoRejectInterval\(\)/
  }
];

let integrationCount = 0;
for (const check of checks) {
  const exists = check.regex.test(serverContent);
  const status = exists ? '✅' : '❌';
  console.log(`  ${status} ${check.name}`);
  if (exists) integrationCount++;
}

// Check admin routes
console.log('\n🔌 Checking admin.js integrations:\n');

const adminPath = path.join(projectRoot, 'routes/admin.js');
const adminContent = fs.readFileSync(adminPath, 'utf-8');

const adminChecks = [
  {
    name: 'GET /support/requests endpoint',
    regex: /router\.get\('\/support\/requests'/
  },
  {
    name: 'POST /support/request/:id/accept endpoint',
    regex: /router\.post\('\/support\/request\/:requestId\/accept'/
  },
  {
    name: 'POST /support/request/:id/reject endpoint',
    regex: /router\.post\('\/support\/request\/:requestId\/reject'/
  },
  {
    name: 'POST /support/request/:id/message endpoint',
    regex: /router\.post\('\/support\/request\/:requestId\/message'/
  },
  {
    name: 'POST /support/request/:id/close endpoint',
    regex: /router\.post\('\/support\/request\/:requestId\/close'/
  },
  {
    name: 'POST /support/categories endpoint',
    regex: /router\.post\('\/support\/categories'/
  }
];

let adminIntegrationCount = 0;
for (const check of adminChecks) {
  const exists = check.regex.test(adminContent);
  const status = exists ? '✅' : '❌';
  console.log(`  ${status} ${check.name}`);
  if (exists) adminIntegrationCount++;
}

// Final result
console.log('\n' + '='.repeat(60));

if (allExist && integrationCount === 6 && adminIntegrationCount === 6) {
  console.log('\n✅ ALL SYSTEMS OPERATIONAL!\n');
  console.log('✅ All files present');
  console.log('✅ All server integrations complete');
  console.log('✅ All admin routes configured');
  console.log('\n🚀 Ready for deployment!\n');
  process.exit(0);
} else {
  console.log('\n⚠️  VERIFICATION ISSUES:\n');
  if (!allExist) console.log('  - Some files are missing');
  if (integrationCount < 6) console.log(`  - Server integrations incomplete (${integrationCount}/6)`);
  if (adminIntegrationCount < 6) console.log(`  - Admin routes incomplete (${adminIntegrationCount}/6)`);
  console.log('\n');
  process.exit(1);
}
