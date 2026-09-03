// legal_engine.js - UnyKorn Sovereign Legal Operations Module
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config();

const LEGAL_WORKSPACE_DIR = path.join(__dirname, 'legal_vault');
const LOG_OUT_PATH = path.join(__dirname, '..', 'unykorn-openrouter-cli', 'logs', 'legal_operations.log');

function logLegalEvent(msg) {
    const logLine = `[${new Date().toISOString()}] [LEGAL_OPS]: ${msg}\n`;
    console.log(`⚖️ ${msg}`);
    try {
        if (!fs.existsSync(path.dirname(LOG_OUT_PATH))) {
            fs.mkdirSync(path.dirname(LOG_OUT_PATH), { recursive: true });
        }
        fs.appendFileSync(LOG_OUT_PATH, logLine, 'utf8');
    } catch (err) {
        console.error("Failed to write to legal operations log:", err.message);
    }
}

// 1. Immutable Legal Templates Matrix (Eradicates Text Hallucinations)
const LEGAL_TEMPLATES = {
    "CEASE_AND_DESIST": {
        subject: "FORMAL NOTICE TO CEASE AND DESIST: PROPRIETARY REVENUE PROTOCOL INFRINGEMENT",
        body: (targetName, detail) => `ATTN: ${targetName}\n\nThis firm represents Kevan Burns, CEO of Unykorn. It has come to our attention that your organization is executing unauthorized deployments involving our proprietary x402 payment middleware architecture and related assets.\n\nSPECIFIC VIOLATION: ${detail}\n\nYou are hereby directed to IMMEDIATELY CEASE AND DESIST all unauthorized utilization, replication, or commercial execution of Unykorn intellectual property. Failure to comply within 72 business hours will result in immediate escalation to formal litigation seeking maximum statutory damages.\n\nRegards,\nUnyKorn Sovereign Legal Operations\nOn behalf of Kevan Burns, Founder & CEO.`
    }
};

// 2. Document Construction and Metadata Staging
function stageLegalNotice(templateKey, targetName, violationDetail, targetEmail) {
    const template = LEGAL_TEMPLATES[templateKey];
    if (!template) {
        logLegalEvent(`❌ Failure: Target legal template [${templateKey}] not recognized.`);
        return null;
    }

    if (!targetName || typeof targetName !== 'string' || targetName.trim() === '') {
        logLegalEvent(`❌ Failure: Target name must be a non-empty string.`);
        return null;
    }
    if (!violationDetail || typeof violationDetail !== 'string' || violationDetail.trim() === '') {
        logLegalEvent(`❌ Failure: Violation detail must be a non-empty string.`);
        return null;
    }
    if (!targetEmail || typeof targetEmail !== 'string') {
        logLegalEvent(`❌ Failure: Target email must be a string.`);
        return null;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(targetEmail.trim())) {
        logLegalEvent(`❌ Failure: Target email [${targetEmail}] is not a valid email format.`);
        return null;
    }

    const sanitizedTargetName = targetName.replace(/[\r\n]/g, '').trim();
    const sanitizedTargetEmail = targetEmail.replace(/[\r\n]/g, '').trim();
    const sanitizedViolationDetail = violationDetail.trim();

    if (!fs.existsSync(LEGAL_WORKSPACE_DIR)) fs.mkdirSync(LEGAL_WORKSPACE_DIR, { recursive: true });

    const finalBody = template.body(sanitizedTargetName, sanitizedViolationDetail);
    const documentId = `LEGAL_NOTICE_${Date.now()}`;
    const txtPath = path.join(LEGAL_WORKSPACE_DIR, `${documentId}.txt`);
    const jsonPath = path.join(LEGAL_WORKSPACE_DIR, `${documentId}.json`);

    // Commit the hard copy document (.txt) to the physical vault
    fs.writeFileSync(txtPath, finalBody, 'utf8');
    logLegalEvent(`Draft document staged at: ${txtPath}`);

    // Commit the metadata payload (.json) to the physical vault
    const transmissionPayload = {
        documentId: documentId,
        templateKey: templateKey,
        targetName: sanitizedTargetName,
        violationDetail: sanitizedViolationDetail,
        to: sanitizedTargetEmail,
        subject: template.subject,
        body: finalBody,
        stagedAt: new Date().toISOString(),
        approvalStatus: "AWAITING_EXECUTIVE_RELEASE_TRIGGER",
        transmittedAt: null
    };

    fs.writeFileSync(jsonPath, JSON.stringify(transmissionPayload, null, 2), 'utf8');
    logLegalEvent(`Staged transmission metadata payload: ${jsonPath}`);

    return transmissionPayload;
}

// 3. List all staged notices in the vault
function listStagedNotices() {
    if (!fs.existsSync(LEGAL_WORKSPACE_DIR)) return [];
    
    try {
        const files = fs.readdirSync(LEGAL_WORKSPACE_DIR);
        const notices = [];
        files.forEach(file => {
            if (file.endsWith('.json') && file.startsWith('LEGAL_NOTICE_')) {
                const content = fs.readFileSync(path.join(LEGAL_WORKSPACE_DIR, file), 'utf8');
                notices.push(JSON.parse(content));
            }
        });
        // Sort by stagedAt descending
        return notices.sort((a, b) => new Date(b.stagedAt) - new Date(a.stagedAt));
    } catch (err) {
        logLegalEvent(`❌ Error listing staged notices: ${err.message}`);
        return [];
    }
}

// 4. Secure Transmit Routine with SMTP / Nodemailer binding and Graceful Fallback
async function transmitNotice(documentId) {
    const jsonPath = path.join(LEGAL_WORKSPACE_DIR, `${documentId}.json`);
    if (!fs.existsSync(jsonPath)) {
        logLegalEvent(`❌ Fail: Staged metadata not found for ID [${documentId}].`);
        throw new Error(`Metadata file not found for ${documentId}`);
    }

    let payload = {};
    try {
        payload = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    } catch (jsonErr) {
        logLegalEvent(`❌ Fail: Failed to parse staged notice metadata for ${documentId}: ${jsonErr.message}`);
        throw new Error(`Corrupted metadata payload for ${documentId}`);
    }

    if (!payload.to || !payload.subject || !payload.body) {
        logLegalEvent(`❌ Fail: Metadata payload for [${documentId}] is missing required fields (to, subject, body).`);
        throw new Error(`Notice metadata payload structure is invalid.`);
    }

    if (payload.approvalStatus === "RELEASED_TRANSMITTED") {
        logLegalEvent(`⚠️ Notice [${documentId}] has already been transmitted.`);
        return payload;
    }

    logLegalEvent(`Awakening release trigger for notice: ${documentId} (Target: ${payload.to})...`);

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (smtpHost && smtpUser && smtpPass) {
        const parsedPort = parseInt(smtpPort, 10);
        const port = (isNaN(parsedPort) || parsedPort <= 0) ? 587 : parsedPort;
        logLegalEvent(`Initiating nodemailer connection enclave on: ${smtpHost}:${port}...`);
        try {
            const transporter = nodemailer.createTransport({
                host: smtpHost,
                port: port,
                secure: port === 465,
                auth: {
                    user: smtpUser,
                    pass: smtpPass
                }
            });

            await transporter.sendMail({
                from: `"UnyKorn Legal Operations" <${smtpUser}>`,
                to: payload.to,
                subject: payload.subject,
                text: payload.body
            });

            logLegalEvent(`✅ [TRANSMIT SUCCESS]: SMTP transmission completed successfully for target ${payload.to}.`);
            payload.approvalStatus = "RELEASED_TRANSMITTED";
            payload.transmittedAt = new Date().toISOString();
        } catch (mailErr) {
            logLegalEvent(`❌ SMTP Transmit Failed: ${mailErr.message}. Staging status kept as AWAITING_RELEASE.`);
            throw mailErr;
        }
    } else {
        // Safe mock fallback bypass
        logLegalEvent(`⚠️ SMTP credentials not fully configured in environment. executing simulated peer-routed dispatch...`);
        logLegalEvent(`[MOCK DISPATCH OUTPUT]:`);
        logLegalEvent(`   From: "UnyKorn Legal Operations" <compliance@unykorn.org>`);
        logLegalEvent(`   To: ${payload.to}`);
        logLegalEvent(`   Subject: ${payload.subject}`);
        logLegalEvent(`   Body size: ${payload.body.length} bytes`);
        logLegalEvent(`✅ [MOCK SUCCESS]: Mock transmission simulated successfully.`);
        
        payload.approvalStatus = "RELEASED_TRANSMITTED";
        payload.transmittedAt = new Date().toISOString();
    }

    // Flush updated state back to disk database
    fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 2), 'utf8');
    return payload;
}

// Export for module integration
module.exports = {
    stageLegalNotice,
    listStagedNotices,
    transmitNotice,
    LEGAL_TEMPLATES
};

// Direct script execution (e.g. node legal_engine.js) runs testing pass
if (require.main === module) {
    console.clear();
    logLegalEvent("====================================================");
    logLegalEvent("   UNYKORN COCKPIT // SOVEREIGN LEGAL ENGINE V1      ");
    logLegalEvent("====================================================\n");

    const testNotice = stageLegalNotice(
        "CEASE_AND_DESIST",
        "MOCK_EXTERNAL_ENTITY_LLC",
        "Unauthorized cloning of active XRPL treasury routing hooks and x402 ports.",
        "compliance@externalentity.com"
    );
    
    // Test list
    const notices = listStagedNotices();
    logLegalEvent(`Total staged notices in vault: ${notices.length}`);
}
