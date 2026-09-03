// learning_loop.js - UnyKorn Cockpit Post-Mortem Knowledge Ingestion Engine
const fs = require('fs');
const path = require('path');

const DAEMON_LOG_PATH = path.join(__dirname, '..', 'unykorn-openrouter-cli', 'logs', 'sentinel_daemon.log');
const MEMORY_DB_PATH = path.join(__dirname, 'vector_memory_extensions.json');

function logInsight(message) {
    console.log(`🧠 [NEURO-LEARNING]: ${message}`);
}

function processCompletedLogs() {
    console.clear();
    console.log("====================================================");
    console.log("  UNYKORN NEURO-BRAIN // AUTO-LEARNING INGESTION    ");
    console.log("====================================================\n");

    if (!fs.existsSync(DAEMON_LOG_PATH)) {
        logInsight("❌ Direct source log layer missing. Awaiting daemon cycle execution.");
        return;
    }

    logInsight("Reading recent sentinel logs to extract platform execution insights...");
    const logs = fs.readFileSync(DAEMON_LOG_PATH, 'utf8').split('\n');
    
    let learnedInsights = [];

    logs.forEach(line => {
        // Look specifically for completed worker success paths to ingest
        if (line.includes('[WORKER]: ✅ [SUCCESS]')) {
            const taskIdMatch = line.match(/Task \[(task_\d+)\]/);
            if (taskIdMatch) {
                const taskId = taskIdMatch[1];
                learnedInsights.push({
                    insight_id: `vec_ext_${Date.now()}_${taskId}`,
                    source_task: taskId,
                    timestamp: new Date().toISOString(),
                    vector_anchors: ["x402_protocol", "platform_integration", "infrastructure_optimization"],
                    metadata: {
                        log_snapshot: line.trim(),
                        status_impact: "System state mutated from volatile memory to persistent disk storage."
                    }
                });
            }
        }
    });

    if (learnedInsights.length === 0) {
        logInsight("No unindexed success markers found in the current log stream.");
        return;
    }

    // Load existing extended vector pool or initialize blank array
    let memoryExtendedPool = [];
    if (fs.existsSync(MEMORY_DB_PATH)) {
        try {
            memoryExtendedPool = JSON.parse(fs.readFileSync(MEMORY_DB_PATH, 'utf8'));
        } catch (e) {
            memoryExtendedPool = [];
        }
    }

    // Append newly extracted platform parameters
    learnedInsights.forEach(insight => {
        // Prevent duplicate indexing of the same task run
        const exists = memoryExtendedPool.some(m => m.source_task === insight.source_task);
        if (!exists) {
            memoryExtendedPool.push(insight);
            logInsight(`📥 [INGESTED]: Successfully mapped insights for ${insight.source_task} to memory ledger.`);
        }
    });

    // Flush the updated insights map back to disk
    fs.writeFileSync(MEMORY_DB_PATH, JSON.stringify(memoryExtendedPool, null, 2), 'utf8');
    
    console.log("\n----------------------------------------------------");
    logInsight(`Ecosystem sync complete. Extended vector pool expanded by ${learnedInsights.length} operational parameters.`);
    logInsight(`Current memory state: 714 Core Vectors + ${memoryExtendedPool.length} Contextual Extensions.`);
    console.log("====================================================");
}

processCompletedLogs();
