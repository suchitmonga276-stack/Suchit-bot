const { Telegraf } = require('telegraf');
const { spawn } = require('child_process');

const bot = new Telegraf(process.env.MASTER_BOT_TOKEN);
const activeChildBots = {};

bot.start((ctx) => {
  ctx.reply(
    `🔥 **Welcome to Master Bot Manager!**\n\n` +
    `Send your child bot token and admin ID to launch:\n` +
    `/launch TOKEN YOUR_ADMIN_ID`,
    { parse_mode: 'Markdown' }
  );
});

bot.command('launch', (ctx) => {
  const text = ctx.message.text;
  const parts = text.split(' ');
  
  if (parts.length < 3) {
    return ctx.reply('❌ **Invalid format!**\nUse: `/launch TOKEN YOUR_ADMIN_ID`', { parse_mode: 'Markdown' });
  }

  const token = parts[1];
  const adminId = parts[2];

  try {
    // Child bot ko background process mein alag se run karna
    const childProcess = spawn('node', ['child.js', token, adminId]);

    activeChildBots[token] = childProcess;

    childProcess.stdout.on('data', (data) => {
      console.log(`[Child Bot]: ${data}`);
    });

    childProcess.stderr.on('data', (data) => {
      console.error(`[Child Bot Error]: ${data}`);
    });

    ctx.reply(`✅ **Child Bot Launched Successfully!** 🚀\n\nToken: \`${token.substring(0, 10)}...\`\nAdmin ID: \`${adminId}\``, { parse_mode: 'Markdown' });
  } catch (error) {
    ctx.reply(`❌ **Failed to launch:** ${error.message}`, { parse_mode: 'Markdown' });
  }
});

bot.launch();
console.log('Master Bot is running...');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
