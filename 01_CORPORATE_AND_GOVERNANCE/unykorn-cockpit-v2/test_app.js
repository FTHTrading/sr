const { spawn } = require('child_process');
const axios = require('axios');

async function testApp() {
    console.log("Launching node app.js...");
    const child = spawn('node', ['app.js'], {
        cwd: __dirname,
        env: { ...process.env, PORT: '7890' } // use port 7890 for testing
    });

    child.stdout.on('data', (data) => {
        console.log(`[Server STDOUT]: ${data.toString().trim()}`);
    });

    child.stderr.on('data', (data) => {
        console.error(`[Server STDERR]: ${data.toString().trim()}`);
    });

    child.on('close', (code) => {
        console.log(`[Server EXIT] Code: ${code}`);
    });

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log("Sending POST request to /api/cockpit/chat...");
    try {
        const res = await axios.post('http://localhost:7890/api/cockpit/chat', {
            prompt: 'Hello Code Forge!'
        });
        console.log("Response:", res.data);
    } catch (err) {
        console.error("Request failed:", err.response ? err.response.data : err.message);
    }

    // Kill server and exit
    console.log("Terminating server...");
    child.kill();
    process.exit(0);
}

testApp();
