// backup_daemon.js - UnyKorn Registry Automated Backup Daemon
const fs = require('fs');
const path = require('path');

const BACKUP_INTERVAL_MS = 3600000; // 1 Hour
const MAX_BACKUPS = 5;

const FILES_TO_BACKUP = [
    {
        name: 'master_system_index.json',
        src: path.join(__dirname, 'master_system_index.json')
    },
    {
        name: 'session_state.json',
        src: path.join(__dirname, 'session_state.json')
    },
    {
        name: 'repo_registry.json',
        src: 'C:\\Users\\Kevan\\dev\\repo_registry.json'
    }
];

const BACKUP_DIR = 'C:\\Users\\Kevan\\.openclaw\\backups\\unykorn-registry';
const LOG_PATH = 'C:\\Users\\Kevan\\Template_Logs\\registry_backup.log';

function logEvent(msg) {
    const logLine = `[${new Date().toISOString()}] [BACKUP_DAEMON]: ${msg}\n`;
    console.log(`📂 ${msg}`);
    try {
        const logDir = path.dirname(LOG_PATH);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        fs.appendFileSync(LOG_PATH, logLine, 'utf8');
    } catch (err) {
        console.error("Failed to write to backup log:", err.message);
    }
}

function runBackupCycle() {
    logEvent("Starting registry backup cycle...");

    if (!fs.existsSync(BACKUP_DIR)) {
        try {
            fs.mkdirSync(BACKUP_DIR, { recursive: true });
        } catch (err) {
            logEvent(`❌ Error creating backup directory: ${err.message}`);
            return;
        }
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const cycleSubdir = path.join(BACKUP_DIR, `backup-${timestamp}`);

    try {
        fs.mkdirSync(cycleSubdir, { recursive: true });
    } catch (err) {
        logEvent(`❌ Error creating cycle subdirectory: ${err.message}`);
        return;
    }

    // Copy each configured registry file
    let successCount = 0;
    FILES_TO_BACKUP.forEach(fileDef => {
        if (fs.existsSync(fileDef.src)) {
            try {
                const destPath = path.join(cycleSubdir, fileDef.name);
                fs.copyFileSync(fileDef.src, destPath);
                successCount++;
            } catch (err) {
                logEvent(`❌ Error copying ${fileDef.name}: ${err.message}`);
            }
        } else {
            logEvent(`⚠️ Warning: Source file not found: ${fileDef.src}`);
        }
    });

    logEvent(`Backup cycle completed. Successfully copied ${successCount}/${FILES_TO_BACKUP.length} files.`);

    // Perform retention rotation
    pruneOldBackups();
}

function pruneOldBackups() {
    try {
        const items = fs.readdirSync(BACKUP_DIR);
        // Filter folders matching our backup naming pattern
        const backupDirs = items
            .map(item => path.join(BACKUP_DIR, item))
            .filter(itemPath => {
                const stat = fs.statSync(itemPath);
                return stat.isDirectory() && path.basename(itemPath).startsWith('backup-');
            });

        // Sort backup directories by creation time (newest first)
        backupDirs.sort((a, b) => {
            return fs.statSync(b).mtime - fs.statSync(a).mtime;
        });

        if (backupDirs.length > MAX_BACKUPS) {
            logEvent(`Total backups (${backupDirs.length}) exceeds retention limit (${MAX_BACKUPS}). Pruning...`);
            const toPrune = backupDirs.slice(MAX_BACKUPS);
            toPrune.forEach(dirPath => {
                try {
                    // Recursively remove directory files
                    const files = fs.readdirSync(dirPath);
                    files.forEach(file => fs.unlinkSync(path.join(dirPath, file)));
                    fs.rmdirSync(dirPath);
                    logEvent(`Pruned old backup folder: ${path.basename(dirPath)}`);
                } catch (err) {
                    logEvent(`❌ Failed to prune folder ${path.basename(dirPath)}: ${err.message}`);
                }
            });
        }
    } catch (err) {
        logEvent(`❌ Error during backup pruning: ${err.message}`);
    }
}

// Lifecycle Handlers
const args = process.argv.slice(2);
if (args.includes('--run-once')) {
    runBackupCycle();
    process.exit(0);
}

logEvent("Daemon loop initialized. Running first backup cycle...");
runBackupCycle();

const interval = setInterval(runBackupCycle, BACKUP_INTERVAL_MS);

process.on('SIGTERM', () => {
    logEvent("SIGTERM received. Cleaning up interval and exiting gracefully.");
    clearInterval(interval);
    process.exit(0);
});

process.on('SIGINT', () => {
    logEvent("SIGINT received. Cleaning up interval and exiting gracefully.");
    clearInterval(interval);
    process.exit(0);
});
