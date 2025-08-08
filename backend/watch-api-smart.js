const chokidar = require('chokidar');
const { exec } = require('child_process');
const path = require('path');
require('dotenv').config();

// ✅ Validation
if (!process.env.POSTMAN_API_KEY || !process.env.POSTMAN_COLLECTION_ID) {
  console.error('❌ Missing POSTMAN_API_KEY or POSTMAN_COLLECTION_ID in .env');
  console.log('💡 Please check your .env file');
  process.exit(1);
}

// 🔧 Configuration
const CONFIG = {
  watchPatterns: [
    'src/controllers/**/*.js',
    'src/routes/**/*.js',
    'src/api/**/*.js',
    'controllers/**/*.js',
    'routes/**/*.js',
    'api/**/*.js',
    'app/**/*.js',
    // TypeScript support
    'src/controllers/**/*.ts',
    'src/routes/**/*.ts',
    'src/api/**/*.ts',
  ],
  
  ignored: [
    /node_modules/,
    /\.git/,
    /dist/,
    /build/,
    /coverage/,
    /\.test\./,
    /\.spec\./,
    /\.d\.ts$/
  ],
  
  debounceTime: 3000,
  verbose: true
};

// 📊 State management
let updateQueue = new Set();
let updateTimer = null;
let isUpdating = false;

console.log('🚀 Loomsky API Documentation Watcher Started!');
console.log('📁 Watching patterns:', CONFIG.watchPatterns.join(', '));
console.log('⏱️  Debounce time:', CONFIG.debounceTime + 'ms');
console.log('📋 Collection ID:', process.env.POSTMAN_COLLECTION_ID);
console.log('🔗 Collection URL: https://app.getpostman.com/collections/' + process.env.POSTMAN_COLLECTION_ID);
console.log('─'.repeat(80));

// 👂 Initialize file watcher
const watcher = chokidar.watch(CONFIG.watchPatterns, {
  ignored: CONFIG.ignored,
  persistent: true,
  ignoreInitial: true
});

// 📝 Event handlers
watcher
  .on('change', (filePath) => handleFileChange(filePath, 'modified'))
  .on('add', (filePath) => handleFileChange(filePath, 'added'))
  .on('unlink', (filePath) => handleFileChange(filePath, 'deleted'))
  .on('error', (error) => console.error('❌ Watcher error:', error))
  .on('ready', () => {
    console.log('✅ Watcher ready! Monitoring API file changes...\n');
  });

function handleFileChange(filePath, action) {
  if (isUpdating) {
    console.log('⏳ Update in progress, queueing change...');
    return;
  }
  
  console.log(`📝 [${action.toUpperCase()}] ${filePath}`);
  
  updateQueue.add({
    path: filePath,
    action: action,
    timestamp: new Date().toISOString()
  });
  
  // Reset debounce timer
  clearTimeout(updateTimer);
  updateTimer = setTimeout(() => {
    processUpdateQueue();
  }, CONFIG.debounceTime);
  
  console.log(`⏳ Update scheduled in ${CONFIG.debounceTime/1000}s (${updateQueue.size} files queued)`);
}

async function processUpdateQueue() {
  if (updateQueue.size === 0 || isUpdating) return;
  
  isUpdating = true;
  const changes = Array.from(updateQueue);
  updateQueue.clear();
  
  console.log('\n' + '='.repeat(80));
  console.log('🚀 STARTING API DOCUMENTATION UPDATE');
  console.log('='.repeat(80));
  console.log(`📊 Files changed: ${changes.length}`);
  
  // Log changes detail
  changes.forEach((change, index) => {
    const actionEmoji = {
      'added': '➕',
      'modified': '📝', 
      'deleted': '🗑️'
    };
    console.log(`${index + 1}. ${actionEmoji[change.action]} ${change.path}`);
  });
  
  console.log('\n⚙️  Analyzing changes and updating collection...');
  
  const prompt = createUpdatePrompt(changes);
  
  try {
    await executeClaudeCode(prompt);
    console.log('✅ Update completed successfully!');
  } catch (error) {
    console.error('❌ Update failed:', error.message);
    console.log('💡 You can try manual update: npm run docs:manual-update');
  } finally {
    isUpdating = false;
    console.log('\n' + '='.repeat(80));
    console.log('✅ UPDATE PROCESS COMPLETED');
    console.log('='.repeat(80));
    console.log('👂 Continuing to monitor file changes...\n');
  }
}

function createUpdatePrompt(changes) {
  const changedFiles = changes.map(c => c.path).join(', ');
  const addedFiles = changes.filter(c => c.action === 'added');
  const modifiedFiles = changes.filter(c => c.action === 'modified');
  const deletedFiles = changes.filter(c => c.action === 'deleted');
  
  return `
🎯 TASK: Smart Update Loomsky Backend API Collection

📋 COLLECTION INFO:
- Collection ID: ${process.env.POSTMAN_COLLECTION_ID}
- Update Type: Incremental Smart Merge
- Project: Loomsky Backend

📝 DETECTED CHANGES:
- Total files: ${changes.length}
- Added: ${addedFiles.length} files
- Modified: ${modifiedFiles.length} files
- Deleted: ${deletedFiles.length} files
- Changed files: ${changedFiles}

🔧 UPDATE INSTRUCTIONS:

1. 🔍 ANALYSIS PHASE:
   - Analyze changed files to identify affected API endpoints
   - Determine what changed (new routes, modified params, deleted endpoints)
   - Map changes to existing collection structure

2. 📋 COLLECTION RETRIEVAL:
   - Get current collection from Postman API using Collection ID
   - Parse existing structure and content

3. 🧠 SMART MERGE STRATEGY:
   - UPDATE only endpoints that actually changed
   - PRESERVE everything else:
     * Folder organization
     * Custom descriptions and documentation  
     * Test scripts and assertions
     * Pre-request scripts
     * Authorization configurations
     * Environment variables
     * Custom headers
     * Example responses
     * Manual customizations

4. 🔄 SPECIFIC UPDATE LOGIC:
   - For ADDED files: Create new requests in appropriate folders
   - For MODIFIED files: Update only changed endpoints
   - For DELETED files: Remove corresponding requests (with confirmation)
   - Maintain consistent naming and organization

5. ✅ VALIDATION:
   - Verify merge results are valid JSON
   - Check no breaking changes introduced
   - Ensure all endpoints have proper structure

6. 💾 APPLY UPDATES:
   - Update collection via Postman API PUT request
   - Handle API errors gracefully
   - Provide detailed success/failure feedback

7. 📝 DETAILED REPORTING:
   - Summarize what was updated/added/removed
   - List specific endpoints affected
   - Report any issues or warnings
   - Provide collection URL for verification

⚠️  CRITICAL REQUIREMENTS:
- Preserve 100% of existing customizations
- Only modify what actually needs updating
- Maintain collection organization and readability
- Handle errors gracefully with clear messages
- Log all actions for debugging

🎯 SUCCESS CRITERIA:
- Collection successfully updated
- No existing data lost
- API changes accurately reflected
- Documentation remains well-organized
- Update process logged clearly
`;
}

function executeClaudeCode(prompt) {
  return new Promise((resolve, reject) => {
    const command = `claude-code "${prompt.replace(/"/g, '\\"')}"`;
    
    console.log('🤖 Executing Claude Code...');
    
    const child = exec(command, {
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      timeout: 180000 // 3 minutes timeout
    });
    
    child.stdout.on('data', (data) => {
      process.stdout.write(data);
    });
    
    child.stderr.on('data', (data) => {
      process.stderr.write(data);
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Claude Code exited with code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

// 🛑 Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Loomsky API Watcher...');
  clearTimeout(updateTimer);
  watcher.close();
  console.log('👋 Goodbye!');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});