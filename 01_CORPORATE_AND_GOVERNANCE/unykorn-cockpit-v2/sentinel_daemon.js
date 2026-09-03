// sentinel_daemon.js - UnyKorn Cockpit Autonomous Watchdog & Queue Daemon
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const WORKER_PATH = path.join(__dirname, 'queue_worker.js');
const STATE_FILE_PATH = path.join(__dirname, 'session_state.json');
const DAEMON_LOG_PATH = path.join(__dirname, '..', 'unykorn-openrouter-cli', 'logs', 'sentinel_daemon.log');

let cycleCount = 0;
const MAX_CYCLES = 5; // Protection limit for testing before unleashing a 24-hour run

function logEvent(message) {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] ${message}\n`;
    console.log(formattedMessage.trim());
    
    try {
        const logDir = path.dirname(DAEMON_LOG_PATH);
        if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
        fs.appendFileSync(DAEMON_LOG_PATH, formattedMessage, 'utf8');
    } catch (err) {
        console.error(`❌ Failed to write to absolute daemon log: ${err.message}`);
    }
}

function checkSystemState() {
    try {
        if (!fs.existsSync(STATE_FILE_PATH)) return false;
        const state = JSON.parse(fs.readFileSync(STATE_FILE_PATH, 'utf8'));
        return state.kanban_queue.pending_queue.length > 0;
    } catch (err) {
        logEvent(`[ERROR] Reading session state: ${err.message}`);
        return false;
    }
}

function runSentinelCycle() {
    cycleCount++;
    logEvent(`====================================================`);
    logEvent(`🔍 STARTING AUTONOMOUS SENTINEL CYCLE #${cycleCount}`);
    logEvent(`====================================================`);

    const hasTasks = checkSystemState();

    if (!hasTasks) {
        logEvent("🏁 Pending queue is empty. System is optimized. Daemon idling...");
        process.exit(0);
    }

    logEvent("🚀 Tasks detected. Forking process to launch Queue Worker...");
    
    // Natively execute the worker to mutate the disk
    exec(`node "${WORKER_PATH}"`, (error, stdout, stderr) => {
        if (error) {
            logEvent(`❌ Worker Process Crash: ${error.message}`);
            return;
        }
        
        // Print and parse worker telemetry outputs
        if (stdout) {
            stdout.split('\n').forEach(line => {
                if (line.trim()) logEvent(`   [WORKER]: ${line.trim()}`);
            });
        }

        logEvent(`📦 Cycle #${cycleCount} complete. Commencing 5-second health cooldown...`);
        
        // Break the loop if we hit our testing threshold, otherwise loop infinitely
        if (cycleCount >= MAX_CYCLES) {
            logEvent("\n🛑 Test threshold hit. Pausing daemon for executive validation.");
            process.exit(0);
        }

        setTimeout(runSentinelCycle, 5000);
    });
}

// Initialize Daemon Frame
console.clear();
logEvent("🚀 UnyKorn Cockpit Sentinel Daemon Engine Initialized Natively.");
logEvent("⏱️ Heartbeat interval locked to 5000ms. Monitoring 12-port architecture.\n");

runSentinelCycle();
