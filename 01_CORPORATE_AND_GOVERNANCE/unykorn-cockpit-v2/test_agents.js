const { coordinateCockpitCommand } = require('./agents');

async function test() {
    console.log("Starting agent coordination test...");
    try {
        const res = await coordinateCockpitCommand("Hello Code Forge!");
        console.log("Test succeeded! Result:", res);
    } catch (err) {
        console.error("Test failed with error:", err);
    }
}

test();
