const { exec } = require('child_process');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Master Bot Server is Running!');
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

// Yahan se child bot / actual bot process background mein chalega
function startMasterBot() {
  console.log("Starting Master Bot process...");
  
  // Agar teri main bot file ka naam 'bot.js' ya kuch aur hai toh yahan change kar sakta hai
  const child = exec('node bot.js', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
      return;
    }
    console.log(`Stdout: ${stdout}`);
  });

  child.on('exit', (code) => {
    console.log(`Bot process exited with code ${code}, restarting...`);
    setTimeout(startMasterBot, 5000); // Agar band ho toh 5 second mein apne aap restart ho jayega
  });
}

startMasterBot();
