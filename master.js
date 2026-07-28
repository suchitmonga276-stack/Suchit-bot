const { Telegraf } = require('telegraf');
const { spawn } = require('child_process');

const token = process.env.BOT_TOKEN || process.env.MASTER_BOT_TOKEN;
if (!token) {
  console.error("❌ **BOT_TOKEN is missing for Master Bot!**");
  process.exit(1);
}

const bot = new Telegraf(token);
const activeChildBots = {};

bot.start((ctx) => {
  ctx.reply(
    `🔥 **Welcome to Master Bot Manager!**\n\n**Send your child bot token and admin ID to launch:**\n\`/launch TOKEN ADMIN_ID\``,
    { parse_mode: 'Markdown' }
  );
});

// Function to spawn child bot with Auto-Restart mechanism
function launchChild(childToken, adminId, ctx = null) {
  if (activeChildBots[childToken]) {
    if (ctx) ctx.reply('⚠️ **This child bot is already running and auto-restart is active!**', { parse_mode: 'Markdown' });
    return;
  }

  console.log(`🚀 **Launching Child Bot:** ${childToken}`);
  const childProcess = spawn('node', ['child.js', childToken, adminId]);
  
  activeChildBots[childToken] = childProcess;

  childProcess.stdout.on('data', (data) => {
    console.log(`[Child Bot Log]: ${data}`);
  });

  childProcess.stderr.on('data', (data) => {
    console.error(`[Child Bot Error]: ${data}`);
  });

  // **Instant Restart Logic on Crash/Kill**
  childProcess.on('close', (code) => {
    console.log(`⚠️ **Child Bot exited with code ${code}. Restarting instantly...**`);
    delete activeChildBots[childToken];
    
    // Auto restart after 2 seconds
    setTimeout(() => {
      launchChild(childToken, adminId);
    }, 2000);
  });

  if (ctx) {
    ctx.reply(`✅ **Child Bot Launched Successfully with Auto-Restart!** 🚀\n\n**Token:** \`${childToken}\`\n**Admin ID:** \`${adminId}\``, { parse_mode: 'Markdown' });
  }
}

bot.command('launch', (ctx) => {
  const text = ctx.message.text;
  const parts = text.split(' ');

  if (parts.length < 3) {
    return ctx.reply('❌ **Invalid format!**\n\n**Use:** \`/launch TOKEN ADMIN_ID\`', { parse_mode: 'Markdown' });
  }

  const childToken = parts[1];
  const adminId = parts[2];

  launchChild(childToken, adminId, ctx);
});

bot.launch();
console.log('🚀 **Master Bot is running smoothly with Auto-Respawner...**');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
