// telegram_bridge.js - UnyKorn Cockpit Telegram Gateway Controller
const http = require('http');
const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(__dirname, 'session_state.json');
const LOG_PATH = path.join(__dirname, '..', 'unykorn-openrouter-cli', 'logs', 'telegram_bridge.log');

function logBridgeEvent(msg) {
    const entry = `[${new Date().toISOString()}] [TELEGRAM_BRIDGE]: ${msg}\n`;
    console.log(`💬 ${msg}`);
    try {
        if (!fs.existsSync(path.dirname(LOG_PATH))) {
            fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
        }
        fs.appendFileSync(LOG_PATH, entry, 'utf8');
    } catch (e) {
        console.error(`❌ Log Error: ${e.message}`);
    }
}

// 1. Core Command Parser Natively Connected to your local JSON Database
function parseTelegramCommand(rawText) {
    logBridgeEvent(`Inbound signal received via bridge: "${rawText}"`);
    
    const command = rawText.trim().toLowerCase();

    if (command === '/status') {
        if (!fs.existsSync(STATE_FILE)) return "❌ Core system state database offline.";
        try {
            const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
            const totalVectors = state.system_telemetry?.total_memory_vectors || 0;
            const platformHubStatus = state.platforms?.["Platform Hub"]?.status || "UNKNOWN";
            const solVerifyStatus = state.platforms?.["Sol Verify"]?.status || "UNKNOWN";
            const completedCards = state.kanban_queue?.completed_cards || 0;
            return `📊 [UNYKORN TELEMETRY]:\n• Session: ${state.session_id}\n• Vectors: ${totalVectors}\n• Platform Hub: ${platformHubStatus}\n• Sol Verify: ${solVerifyStatus}\n• Completed Cards: ${completedCards}`;
        } catch (err) {
            return `❌ Failed to parse state database: ${err.message}`;
        }
    } 
    
    if (command.startsWith('/stage_email')) {
        return "⚖️ [LEGAL ENGINE]: Email template staged in vault. Awaiting manual Executive Release authorization code via secure Cockpit UI.";
    }

    return `❓ Command not recognized. Active bridge listeners: \n• \`/status\` - Pull bare-metal ledger telemetry\n• \`/stage_email\` - Open secure document vault`;
}

// 2. Direct Mock Execution to verify text parser integrity on bare metal
console.clear();
logBridgeEvent("====================================================");
logBridgeEvent("   UNYKORN COCKPIT // TELEGRAM EXECUTIVE BRIDGE      ");
logBridgeEvent("====================================================\n");

logBridgeEvent("System initialized. Simulating an inbound executive status check query...");
const standardResponse = parseTelegramCommand("/status");
console.log(`\n[TELEGRAM OUTBOUND REPLY]:\n---------------------------\n${standardResponse}\n---------------------------`);
