// indexer.js - UnyKorn Cockpit Absolute Workspace Indexer
const fs = require('fs');
const path = require('path');

// 1. Define the exact locations where your files are scattered
const TARGET_SEARCH_PATHS = [
    'C:\\Users\\Kevan\\.gemini\\antigravity-ide\\scratch\\unykorn-cockpit-v2',
    'C:\\Users\\Kevan\\.gemini\\antigravity-ide\\scratch\\unykorn-openrouter-cli',
    'C:\\Users\\Kevan\\dev\\_scratch',
    'C:\\Users\\Kevan\\Template_Logs'
];

const MASTER_INDEX_PATH = path.join(__dirname, 'master_system_index.json');
let systemCatalog = {};

function scanDirectory(targetDir) {
    console.log(`🔍 Crawling bare-metal directory: ${targetDir}`);
    try {
        if (!fs.existsSync(targetDir)) return;
        const items = fs.readdirSync(targetDir);

        items.forEach(item => {
            const fullPath = path.join(targetDir, item);
            const stats = fs.statSync(fullPath);

            if (stats.isDirectory()) {
                // Recursive step to handle nested project folders
                if (!item.includes('node_modules') && !item.includes('.git') && !item.includes('target')) {
                    scanDirectory(fullPath);
                }
            } else if (stats.isFile()) {
                const ext = path.extname(item);
                // Index code files, configurations, and text logs
                if (['.js', '.rs', '.json', '.txt', '.log', '.md', '.env'].includes(ext)) {
                    systemCatalog[item] = {
                        absolute_path: fullPath,
                        size_bytes: stats.size,
                        last_modified: stats.mtime.toISOString(),
                        file_extension: ext
                    };
                }
            }
        });
    } catch (err) {
        console.error(`⚠️ Access Denied or Path Error at [${targetDir}]: ${err.message}`);
    }
}

function runMasterIndex() {
    console.clear();
    console.log("====================================================");
    console.log("  UNYKORN COCKPIT // GLOBAL SYSTEM DISK INDEXER     ");
    console.log("====================================================\n");

    TARGET_SEARCH_PATHS.forEach(dirPath => {
        scanDirectory(dirPath);
    });

    // Write the unified file map directly to your local storage drive
    fs.writeFileSync(MASTER_INDEX_PATH, JSON.stringify(systemCatalog, null, 2), 'utf8');

    const totalFilesFound = Object.keys(systemCatalog).length;
    console.log("\n----------------------------------------------------");
    console.log(`✅ [INDEX COMPLETED]: Unified system catalog successfully committed to disk.`);
    console.log(`   ↳ Target Storage Node: ${MASTER_INDEX_PATH}`);
    console.log(`   ↳ Total Unique Assets Indexed: ${totalFilesFound} active system nodes.`);
    console.log("====================================================");
}

runMasterIndex();
