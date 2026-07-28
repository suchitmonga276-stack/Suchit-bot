const { Telegraf } = require('telegraf');

// Render ke environment variable se token uthayega
const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => {
  ctx.reply('🔥 Welcome to Master Bot Manager!\n\nSend your bot token to launch your child bot using command:\n/launch TOKEN YOUR_ADMIN_ID');
});

bot.command('launch', (ctx) => {
  const text = ctx.message.text;
  // Yahan tera launch logic aayega
  ctx.reply('✅ Child Bot Launched Successfully! 🚀');
});

bot.launch();
console.log('Bot is running successfully...');

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
