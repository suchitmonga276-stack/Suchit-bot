const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Bhai Suchit ka Bot Live Hai! 🚀');
});

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
  console.log("Master Bot is running successfully...");
});
