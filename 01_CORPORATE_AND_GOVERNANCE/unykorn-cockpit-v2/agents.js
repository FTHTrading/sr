// agents.js - UnyKorn Cockpit Multi-Agent Dispatcher
const axios = require('axios');
require('dotenv').config();

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// 1. Define your specialized Agent Fleet
const AGENT_FLEET = {
    ROUTER: {
        model: "google/gemini-2.5-flash", 
        system: "You are the UnyKorn Cockpit Router. Classify the user's input into exactly one of these destinations: [CODE, BLOCKCHAIN, MEMORY, LEGAL]. Respond with ONLY the single word uppercase label."
    },
    CODE: {
        model: "moonshotai/kimi-k2.7-code",
        system: "You are Code Forge Alpha. You have full access to the local Rust runtimes and Gateway 7877 configuration files. Fix degraded systems."
    },
    BLOCKCHAIN: {
        // Cheap default — was Claude 3.5 Sonnet (credit burn). Opt into Sonnet only with COCKPIT_PREMIUM=1
        model: process.env.COCKPIT_PREMIUM === '1' ? "anthropic/claude-3.5-sonnet" : "google/gemini-2.5-flash",
        system: "You are the UnyKorn Ledger Agent. You monitor the XRPL, Stellar, and EVM Treasury wallets, Sol Verify hooks, and the x402 revenue rails."
    },
    MEMORY: {
        model: "google/gemini-2.5-flash",
        system: "You are PersonaPlex Core. You parse and maintain the 653 vector memory context."
    },
    LEGAL: {
        model: process.env.COCKPIT_PREMIUM === '1' ? "anthropic/claude-3.5-sonnet" : "google/gemini-2.5-flash",
        system: "You are the UnyKorn Senior Legal Ops Counsel. You generate legal notices, Cease and Desist templates, and advise on intellectual property violation. You speak in a highly professional, authoritative legal tone."
    }
};

async function queryOpenRouter(model, systemPrompt, userContent) {
    try {
        const response = await axios.post(OPENROUTER_URL, {
            model: model,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userContent }
            ]
        }, {
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "HTTP-Referer": "https://platform.unykorn.org",
                "X-Title": "UnyKorn Multi-Agent Fabric"
            }
        });
        if (response.data && response.data.choices && response.data.choices[0] && response.data.choices[0].message && response.data.choices[0].message.content) {
            return response.data.choices[0].message.content.trim();
        } else {
            console.error("Unexpected response structure:", response.data);
            return null;
        }
    } catch (err) {
        console.error(`Agent invocation error on model ${model}:`, err.message);
        return null;
    }
}

// 2. The Coordination Loop
async function coordinateCockpitCommand(userCommand) {
    console.log(`[Cockpit] Routing command: "${userCommand}"`);

    // Step A: Router determines intent
    let targetDestination = await queryOpenRouter(
        AGENT_FLEET.ROUTER.model, 
        AGENT_FLEET.ROUTER.system, 
        userCommand
    );

    // Clean response in case LLM added extra formatting or reasoning
    targetDestination = targetDestination.replace(/[^A-Z]/g, '').trim();
    console.log(`[Router] Intent classified as: -> ${targetDestination}`);

    // Step B: Handoff execution to the selected specialist
    let specialist = AGENT_FLEET[targetDestination];
    if (!specialist) {
        console.log("[System] Fallback to general Memory Agent.");
        specialist = AGENT_FLEET.MEMORY;
        targetDestination = 'MEMORY';
    }

    console.log(`[System] Awakening ${specialist.model}...`);
    const executionResult = await queryOpenRouter(specialist.model, specialist.system, userCommand);
    
    return {
        agentUsed: targetDestination,
        model: specialist.model,
        output: executionResult
    };
}

module.exports = { coordinateCockpitCommand };
