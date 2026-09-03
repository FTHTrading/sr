// sol_verify.js - UnyKorn Sol Verify Token Compliance Auditor
const https = require('https');
const fs = require('fs');
const path = require('path');

// Reference an unmetered, public Solana Mainnet/Devnet RPC endpoint
const SOLANA_RPC_HOST = 'api.devnet.solana.com';
const LOG_OUT_PATH = path.join(__dirname, '..', 'unykorn-openrouter-cli', 'logs', 'sol_verify_audit.log');

function logAudit(msg) {
    const logLine = `[${new Date().toISOString()}] ${msg}\n`;
    console.log(`◎ [SOL VERIFY]: ${msg}`);
    try {
        const logDir = path.dirname(LOG_OUT_PATH);
        if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
        fs.appendFileSync(LOG_OUT_PATH, logLine, 'utf8');
    } catch (e) {
        console.error(`❌ Logging fail: ${e.message}`);
    }
}

// Native HTTPS JSON-RPC wrapper to avoid massive @solana/web3.js node_module overhead
function fetchTokenMintInfo(mintAddress) {
    return new Promise((resolve) => {
        logAudit(`Dispatching JSON-RPC payload to Mainnet to audit address: ${mintAddress}...`);
        
        const payload = JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "getAccountInfo",
            params: [
                mintAddress,
                { encoding: "jsonParsed" }
            ]
        });

        const options = {
            hostname: SOLANA_RPC_HOST,
            port: 443,
            path: '/',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            },
            timeout: 5000
        };

        const req = https.request(options, (res) => {
            let data = '';
            if (res.statusCode !== 200) {
                logAudit(`❌ Mainnet RPC returned non-200 status code: ${res.statusCode}`);
                res.resume();
                resolve(null);
                return;
            }
            res.on('data', (chunk) => {
                if (data.length + chunk.length > 5 * 1024 * 1024) {
                    logAudit("❌ Mainnet RPC response exceeded maximum allowed size (5MB).");
                    req.destroy();
                    resolve(null);
                    return;
                }
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve(parsed);
                } catch (e) {
                    logAudit(`❌ Failed to parse RPC response buffer: ${e.message}`);
                    resolve(null);
                }
            });
        });

        req.on('error', (err) => {
            logAudit(`⚠️ Mainnet RPC Connection Error: ${err.message}`);
            resolve(null);
        });

        req.on('timeout', () => {
            logAudit("⚠️ Mainnet RPC request timed out.");
            req.destroy();
            resolve(null);
        });

        req.write(payload);
        req.end();
    });
}

async function runTokenAudit(targetMint) {
    const result = await fetchTokenMintInfo(targetMint);
    
    if (!result || result.error) {
        logAudit(`❌ Audit failed or token address does not exist on Mainnet.`);
        if (result && result.error) {
            logAudit(`   RPC Error Details: ${JSON.stringify(result.error)}`);
        }
        return false;
    }

    logAudit("✅ RPC Response fetched. Parsing token authority layouts...");
    console.log("Raw RPC Result:", JSON.stringify(result, null, 2));
    
    // Parse target Solana account info data
    const accountInfo = result.result?.value;
    if (accountInfo) {
        logAudit(`Owner Program: ${accountInfo.owner || 'unknown'}`);
        const parsedData = accountInfo.data?.parsed?.info;
        if (parsedData) {
            const mintAuth = parsedData.mintAuthority;
            const freezeAuth = parsedData.freezeAuthority;
            
            logAudit(`[REPORT]: Mint Authority Status: ${mintAuth ? `ACTIVE Locked to [${mintAuth}]` : 'REVOKED (Fixed Supply)'}`);
            logAudit(`[REPORT]: Freeze Authority Status: ${freezeAuth ? `ACTIVE Locked to [${freezeAuth}]` : 'REVOKED (Immutable Asset)'}`);
        } else {
            // Fallback layout check for custom/un-indexed test assets or raw data
            logAudit("[COMPLIANCE WARNING]: Target address is an active account but does not match standard SPL Token layout.");
            
            let dataLen = 0;
            if (accountInfo.data) {
                if (Array.isArray(accountInfo.data)) {
                    dataLen = accountInfo.data[0] ? accountInfo.data[0].length : 0;
                } else if (typeof accountInfo.data === 'string') {
                    dataLen = accountInfo.data.length;
                } else if (typeof accountInfo.data.length === 'number') {
                    dataLen = accountInfo.data.length;
                }
            }
            logAudit("[COMPLIANCE WARNING]: Raw Data size: " + dataLen + " bytes.");
        }
    } else {
        logAudit("❌ Account not found on Mainnet.");
    }
    
    return true;
}

// Trigger audit natively using standard institutional reference tokens (e.g., Mainnet/Devnet USDC or your custom registers)
const TARGET_MINT_ADDRESS = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"; // Devnet USDC Anchor

console.clear();
logAudit("====================================================");
logAudit("  UNYKORN COCKPIT // SOL VERIFY ON-CHAIN COMPLIANCE  ");
logAudit("====================================================\n");

runTokenAudit(TARGET_MINT_ADDRESS);
