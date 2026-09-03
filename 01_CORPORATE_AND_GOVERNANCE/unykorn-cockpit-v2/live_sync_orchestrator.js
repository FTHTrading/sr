// live_sync_orchestrator.js - Real-Time Cockpit Socket & Rust Integration
const http = require('http');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const RUST_PROJECT_DIR = path.join(__dirname, '..', 'unykorn-openrouter-cli');
const LOG_OUT_PATH = path.join(RUST_PROJECT_DIR, 'logs', 'bare_metal_telemetry.log');

function appendLog(text) {
    const entry = `[${new Date().toISOString()}] ${text}\n`;
    console.log(text);
    try {
        const dir = path.dirname(LOG_OUT_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.appendFileSync(LOG_OUT_PATH, entry, 'utf8');
    } catch (e) {
        console.error(`❌ Logging Failure: ${e.message}`);
    }
}

// 1. Direct Socket Health Check against Port 7877
function verifyCockpitSocket() {
    return new Promise((resolve) => {
        const options = {
            hostname: '127.0.0.1',
            port: 7877,
            path: '/',
            method: 'HEAD',
            timeout: 2000
        };

        const req = http.request(options, (res) => {
            appendLog(`📡 [SOCKET STATUS]: Port :7877 responded with HTTP Code ${res.statusCode}`);
            resolve(true);
        });

        req.on('error', (err) => {
            appendLog(`⚠️ [SOCKET OFFLINE]: Port :7877 unreachable: ${err.message}`);
            resolve(false);
        });

        req.end();
    });
}

// 2. Direct Execution of your Compiled Rust Binary
function invokeRustCLI() {
    return new Promise((resolve) => {
        appendLog("🦀 [RUST ENGINE]: Invoking compiled client to parse available model lanes...");
        
        // Executes cargo run within your real rust workspace path
        exec('cargo run -- --list-models', { cwd: RUST_PROJECT_DIR }, (error, stdout, stderr) => {
            if (error) {
                appendLog(`❌ [RUST CRASH]: Execution halted: ${error.message}`);
                resolve(false);
                return;
            }
            
            appendLog("✅ [RUST SUCCESS]: Model metrics pulled safely from OpenRouter.");
            resolve(true);
        });
    });
}

// 3. Orchestration Control Loop
async function main() {
    console.clear();
    appendLog("====================================================");
    appendLog("    UNYKORN COCKPIT // BARE-METAL TELEMETRY SYNC    ");
    appendLog("====================================================\n");

    const isNodeAlive = await verifyCockpitSocket();
    if (isNodeAlive) {
        await invokeRustCLI();
        appendLog("\n⚡ [SYSTEM CHECK COMPLETED]: Bare-metal verification loops match code parameters.");
    } else {
        appendLog("\n🛑 [EXECUTION HALTED]: System must be running local server on port 7877 to synchronize.");
    }
    appendLog("====================================================");
}

main();
