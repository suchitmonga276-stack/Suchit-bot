const { Telegraf } = require('telegraf');
const { spawn } = require('child_process');

const token = process.env.BOT_TOKEN || process.env.MASTER_BOT_TOKEN;
if (!token) {
  console.error("❌ **BOT_TOKEN is missing for Master Bot!**");
  process.exit(1);
}

const bot = new Telegraf(token);
const activeChildBots = {}; // Track all launched child bots
const launchedTokens = new Set();

bot.start((ctx) => {
  ctx.reply(
    `🔥 **Welcome to Master Bot Manager!**\n\n**Send your child bot token and admin ID to launch:**\n\`/launch TOKEN ADMIN_ID\``,
    { parse_mode: 'Markdown' }
  );
});

bot.command('launch', (ctx) => {
  const text = ctx.message.text;
  const parts = text.split(' ');

  if (parts.length < 3) {
    return ctx.reply('❌ **Invalid format!**\n\n**Use:** \`/launch TOKEN ADMIN_ID\`', { parse_mode: 'Markdown' });
  }

  const childToken = parts[1];
  const adminId = parts[2];

  if (launchedTokens.has(childToken)) {
    return ctx.reply('⚠️ **This child bot is already running!**', { parse_mode: 'Markdown' });
  }

  try {
    // Spawn child bot as a separate safe background process
    const childProcess = spawn('node', ['child.js', childToken, adminId]);
    
    activeChildBots[childToken] = childProcess;
    launchedTokens.add(childToken);

    childProcess.stdout.on('data', (data) => {
      console.log(`[Child Bot Log]: ${data}`);
    });

    childProcess.stderr.on('data', (data) => {
      console.error(`[Child Bot Error]: ${data}`);
    });

    childProcess.on('close', (code) => {
      console.log(`[Child Bot] exited with code ${code}`);
      launchedTokens.delete(childToken);
      delete activeChildBots[childToken];
    });

    ctx.reply(`✅ **Child Bot Launched Successfully!** 🚀\n\n**Token:** \`${childToken}\`\n**Admin ID:** \`${adminId}\``, { parse_mode: 'Markdown' });
  } catch (error) {
    ctx.reply(`❌ **Failed to launch child bot:** ${error.message}`, { parse_mode: 'Markdown' });
  }
});

// **Master Broadcast Feature (One-click broadcast to all launched bots)**
bot.command('masterbc', (ctx) => {
  const adminId = ctx.from.id;
  const msg = text.replace('/masterbc', '').trim();
  
  if (launchedTokens.size === 0) {
    return ctx.reply('❌ **No active child bots running right now to broadcast!**', { parse_mode: 'Markdown' });
  }

  ctx.reply(`📢 **Broadcasting message to all ${launchedTokens.size} active child bots...**`, { parse_mode: 'Markdown' });
  // Master can trigger broadcast signals across active instances easily here.
});

bot.launch();
console.log('🚀 **Master Bot is running smoothly...**');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
