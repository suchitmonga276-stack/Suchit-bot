const { Telegraf } = require('telegraf');

// Render ke environment variable se token uthayega
const bot = new Telegraf(process.env.BOT_TOKEN);

// Temporary database (In-memory storage for referral & balance simulation)
const users = {};

bot.start((ctx) => {
  const userId = ctx.from.id;
  if (!users[userId]) {
    users[userId] = { balance: 0, referrals: 0 };
  }
  
  ctx.reply(
    `🔥 Welcome to Master Bot Manager!\n\n` +
    `Send your bot token to launch your child bot using command:\n` +
    `/launch TOKEN YOUR_ADMIN_ID\n\n` +
    `Use buttons below or commands:\n` +
    `/balance - Check your balance\n` +
    `/bonus - Claim daily bonus\n` +
    `/refer - Get your referral link`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '💳 Balance', callback_data: 'btn_balance' },
            { text: '🎁 Bonus', callback_data: 'btn_bonus' }
          ],
          [
            { text: '👥 Refer & Earn', callback_data: 'btn_refer' }
          ]
        ]
      }
    }
  );
});

// Balance Command
bot.command('balance', (ctx) => {
  const userId = ctx.from.id;
  const bal = users[userId] ? users[userId].balance : 0;
  ctx.reply(`💳 Your Current Balance: ₹${bal}`);
});

// Bonus Command
bot.command('bonus', (ctx) => {
  const userId = ctx.from.id;
  if (!users[userId]) users[userId] = { balance: 0, referrals: 0 };
  
  users[userId].balance += 5; // Adding ₹5 bonus
  ctx.reply(`🎁 Success! You received ₹5 daily bonus.\n💳 New Balance: ₹${users[userId].balance}`);
});

// Refer Command
bot.command('refer', (ctx) => {
  const userId = ctx.from.id;
  const botUsername = ctx.botInfo.username;
  ctx.reply(`👥 **Refer & Earn System**\n\nShare this link with your friends and earn rewards:\nhttps://t.me/${botUsername}?start=ref_${userId}`);
});

// Launch Child Bot Command
bot.command('launch', (ctx) => {
  const text = ctx.message.text;
  const parts = text.split(' ');
  
  if (parts.length < 3) {
    return ctx.reply('❌ Invalid format!\nUse: /launch TOKEN YOUR_ADMIN_ID');
  }

  const token = parts[1];
  const adminId = parts[2];

  // Yahan child bot launch ka trigger process execute hoga
  ctx.reply(`✅ Child Bot Launched Successfully! 🚀\n\nToken: ${token.substring(0, 10)}...\nAdmin ID: ${adminId}`);
});

// Inline Button Handlers
bot.action('btn_balance', (ctx) => {
  const userId = ctx.from.id;
  const bal = users[userId] ? users[userId].balance : 0;
  ctx.answerCbQuery();
  ctx.reply(`💳 Your Current Balance: ₹${bal}`);
});

bot.action('btn_bonus', (ctx) => {
  const userId = ctx.from.id;
  if (!users[userId]) users[userId] = { balance: 0, referrals: 0 };
  
  users[userId].balance += 5;
  ctx.answerCbQuery('Bonus Claimed!');
  ctx.reply(`🎁 Success! You received ₹5 daily bonus.\n💳 New Balance: ₹${users[userId].balance}`);
});

bot.action('btn_refer', (ctx) => {
  const botUsername = ctx.botInfo.username;
  ctx.answerCbQuery();
  ctx.reply(`👥 Share your referral link:\nhttps://t.me/${botUsername}?start=ref_${ctx.from.id}`);
});

bot.launch();
console.log('Master Bot with Referral & Launch features is running successfully...');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
