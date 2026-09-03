// app.js - Anti-Gravity Engine Runtime
const express = require('express');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { coordinateCockpitCommand } = require('./agents');
const { stageLegalNotice, listStagedNotices, transmitNotice } = require('./legal_engine');

// Global error handlers for debugging
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err.stack || err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason.stack || reason);
});

const app = express();
app.use(express.json());

// Enable CORS for external developer portals and local testing
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Handle malformed JSON parsing errors gracefully
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        console.error('Malformed JSON received:', err.message);
        return res.status(400).json({ success: false, error: 'Malformed JSON payload.' });
    }
    next(err);
});

app.use(express.static('public')); // Serves the index.html above

// Dedicated route alias for developer portal
app.get('/developer', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'developer', 'index.html'));
});
app.get('/docs', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'developer', 'index.html'));
});



app.post('/api/cockpit/chat', async (req, res) => {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
        return res.status(400).json({ success: false, error: "Prompt must be a non-empty string." });
    }
    if (prompt.length > 8000) {
        return res.status(400).json({ success: false, error: "Prompt exceeds maximum length of 8000 characters." });
    }

    try {
        const result = await coordinateCockpitCommand(prompt);
        if (result && result.output) {
            res.json({ 
                success: true, 
                reply: `**[Agent Handled: ${result.agentUsed}]** *(${result.model})*\n\n${result.output}` 
            });
        } else {
            res.status(500).json({ success: false, error: "Multi-agent dispatcher returned empty response." });
        }
    } catch (error) {
        console.error("Multi-Agent Dispatcher Error:", error.stack || error.message);
        res.status(500).json({ success: false, error: "Compute relay failed." });
    }
});

// GET /api/legal/staged
app.get('/api/legal/staged', (req, res) => {
    try {
        const notices = listStagedNotices();
        res.json({ success: true, notices: notices });
    } catch (err) {
        console.error("Error fetching staged notices:", err);
        res.status(500).json({ success: false, error: "Failed to list staged notices." });
    }
});

// POST /api/legal/stage
app.post('/api/legal/stage', (req, res) => {
    const { templateKey, targetName, violationDetail, targetEmail } = req.body;
    try {
        const payload = stageLegalNotice(templateKey, targetName, violationDetail, targetEmail);
        if (payload) {
            res.json({ success: true, notice: payload });
        } else {
            res.status(400).json({ success: false, error: "Staging failed. Verify parameters." });
        }
    } catch (err) {
        console.error("Error staging notice:", err);
        res.status(500).json({ success: false, error: "Internal server error during staging." });
    }
});

// POST /api/legal/transmit
app.post('/api/legal/transmit', async (req, res) => {
    const { documentId } = req.body;
    try {
        const payload = await transmitNotice(documentId);
        res.json({ success: true, notice: payload });
    } catch (err) {
        console.error("Error transmitting notice:", err);
        res.status(500).json({ success: false, error: err.message || "Failed to transmit notice." });
    }
});

// GET /api/cockpit/status
app.get('/api/cockpit/status', (req, res) => {
    try {
        const statePath = path.join(__dirname, 'session_state.json');
        const extPath = path.join(__dirname, 'vector_memory_extensions.json');
        
        let state = {};
        if (fs.existsSync(statePath)) {
            try {
                state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
            } catch (jsonErr) {
                console.error("Malformed session_state.json:", jsonErr);
                state = { error: "State file corrupted or empty." };
            }
        }
        
        let extCount = 0;
        if (fs.existsSync(extPath)) {
            try {
                const ext = JSON.parse(fs.readFileSync(extPath, 'utf8'));
                if (Array.isArray(ext)) {
                    extCount = ext.length;
                }
            } catch (jsonErr) {
                console.error("Malformed vector_memory_extensions.json:", jsonErr);
            }
        }
        
        res.json({
            success: true,
            state: state,
            extensionsCount: extCount
        });
    } catch (err) {
        console.error("Error reading cockpit status:", err);
        res.status(500).json({ success: false, error: "Failed to load status." });
    }
});

// POST /api/cockpit/run-task
app.post('/api/cockpit/run-task', async (req, res) => {
    try {
        const statePath = path.join(__dirname, 'session_state.json');
        if (!fs.existsSync(statePath)) {
            return res.status(404).json({ success: false, error: "Session state file not found." });
        }
        
        let state = {};
        try {
            state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
        } catch (jsonErr) {
            console.error("Malformed session_state.json during task execution:", jsonErr);
            return res.status(500).json({ success: false, error: "Session state file contains malformed JSON." });
        }
        
        if (!state.kanban_queue || !Array.isArray(state.kanban_queue.pending_queue)) {
            return res.status(500).json({ success: false, error: "Kanban queue structure is invalid in session state." });
        }
        const queue = state.kanban_queue.pending_queue;
        
        if (queue.length === 0) {
            return res.json({ success: true, message: "Queue is empty. No tasks to process.", state: state });
        }
        
        // Pop the top task
        const activeTask = queue.shift();
        state.kanban_queue.current_execution_lock = activeTask.task_id;
        
        try {
            fs.writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf8');
        } catch (writeErr) {
            console.error("Error updating execution lock:", writeErr);
        }
        
        // Dynamic state resolution depending on the lane target (matching queue_worker.js)
        if (state.platforms) {
            if (activeTask.lane === 'forensic' && state.platforms["Sol Verify"]) {
                state.platforms["Sol Verify"].status = "VERIFIED_ACTIVE";
            } else if (activeTask.lane === 'infrastructure') {
                if (state.platforms["Platform Hub"]) state.platforms["Platform Hub"].status = "LOCAL_NIM_CONNECTED";
                if (state.platforms["BP Blueprint"]) state.platforms["BP Blueprint"].status = "STABLE";
            } else if (activeTask.lane === 'revenue' && state.platforms["XRPL Loans"]) {
                state.platforms["XRPL Loans"].status = "MIDDLEWARE_PATCHED";
            }
        }
        
        // Finalize task status
        state.kanban_queue.completed_cards = (state.kanban_queue.completed_cards || 0) + 1;
        state.kanban_queue.current_execution_lock = null;
        state.last_sync_timestamp = new Date().toISOString();
        
        fs.writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf8');
        
        res.json({
            success: true,
            message: `Task ${activeTask.task_id} processed successfully.`,
            processedTask: activeTask,
            state: state
        });
    } catch (err) {
        console.error("Error processing task:", err);
        res.status(500).json({ success: false, error: "Failed to process task." });
    }
});

// GET /api/predictive/metrics
app.get('/api/predictive/metrics', async (req, res) => {
    try {
        const dataPath = 'C:\\Users\\Kevan\\.openclaw\\predictive_codex_data.json';
        if (fs.existsSync(dataPath)) {
            const fileData = fs.readFileSync(dataPath, 'utf8');
            return res.json(JSON.parse(fileData));
        }
        const { getPredictiveCodexMetrics } = require('./predictive_engine');
        const metrics = await getPredictiveCodexMetrics();
        res.json(metrics);
    } catch (err) {
        console.error("Error fetching predictive metrics:", err);
        res.status(500).json({ success: false, error: "Internal server error loading predictions." });
    }
});

// GET /api/predictive/confluence
app.get('/api/predictive/confluence', (req, res) => {
    const { exec } = require('child_process');
    const scriptPath = 'C:\\Users\\Kevan\\dev\\_scratch\\confluence_engine.py';
    const pythonPath = 'C:\\Users\\Kevan\\dev\\_scratch\\godmod-obliterate\\agent\\.venv\\Scripts\\python.exe';
    
    exec(`"${pythonPath}" "${scriptPath}"`, (error, stdout, stderr) => {
        if (error) {
            console.error(`[COMPUTATION ERROR] Engine thread failed: ${error.message}`);
            return res.status(500).json({ error: "Internal analytical model calculation timeout" });
        }
        try {
            const parsedCodexData = JSON.parse(stdout);
            res.status(200).json(parsedCodexData);
        } catch (parseError) {
            res.status(500).json({ error: "Failed to parse system computation response payload" });
        }
    });
});

// POST /api/ops/execution-trigger
app.post('/api/ops/execution-trigger', (req, res) => {
    const { action_directive, telemetry, timestamp_utc } = req.body;
    
    console.log(`\n[🚨 CRITICAL OPERATIONAL SIGNAL] Received at ${timestamp_utc}`);
    console.log(`DIRECTIVE: ${action_directive}`);
    console.log(`SPI VALUATION: ${telemetry.sovereign_predictive_index} | WIN PROBABILITY: ${telemetry.historical_hit_rate_probability * 100}%`);
    
    res.status(200).json({
        acknowledged: true,
        action_enforced: action_directive,
        node_status: "ROUTED_TO_EXECUTION_LAYER"
    });
});

const PORT = process.env.PORT || 7877;
const server = app.listen(PORT, () => console.log(`🚀 Anti-Gravity Cockpit floating on port ${PORT}`));

server.on('error', (err) => {
    console.error('Server error:', err);
});

process.on('SIGTERM', () => {
    console.log('Received SIGTERM. Exiting...');
    process.exit(143);
});

process.on('SIGINT', () => {
    console.log('Received SIGINT. Exiting...');
    process.exit(130);
});

process.on('exit', (code) => {
    console.log(`Process exit event called with code: ${code}`);
});



