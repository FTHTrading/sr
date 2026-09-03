const { exec } = require('child_process');
const scriptPath = 'C:\\Users\\Kevan\\dev\\_scratch\\confluence_engine.py';
const pythonPath = 'C:\\Users\\Kevan\\dev\\_scratch\\godmod-obliterate\\agent\\.venv\\Scripts\\python.exe';

console.log("Triggering python execution...");
exec(`"${pythonPath}" "${scriptPath}"`, (error, stdout, stderr) => {
    console.log("Execution callback triggered!");
    if (error) {
        console.error("Error:", error);
    }
    console.log("Stdout:", stdout);
    console.log("Stderr:", stderr);
});
