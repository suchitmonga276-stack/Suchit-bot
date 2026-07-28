const { Telegraf, Markup } = require('telegraf');

const token = process.env.BOT_TOKEN;
if (!token) {
  console.error("❌ BOT_TOKEN is missing in environment variables!");
  process.exit(1);
}

const bot = new Telegraf(token);

// In-memory storage (Database simulation)
const db = {
  users: {},
  settings: {
    startText: "🔥 **Welcome to Earning Bot!**",
    menuText: "Choose an option below:",
    startImage: null,
    referBonus: 3,
    signupBonus: 5,
    minWithdraw: 15,
    withdrawStatus: true,
    botStatus: true
  },
  channels: [], // Public/Private channels for Force Sub
  tasks: [],
  giftCodes: {}
};

// Admin ID (Aap apna Telegram User ID yahan dal sakte hain ya env se le sakte hain)
const ADMIN_ID = process.env.ADMIN_ID || "1988742706";

// Middleware: Check Bot Status & Force Subscription
bot.use(async (ctx, next) => {
  if (!db.settings.botStatus && String(ctx.from?.id) !== String(ADMIN_ID)) {
    return ctx.reply("🛠 **Bot is currently under maintenance. Please try again later!**", { parse_mode: 'Markdown' });
  }
  return next();
});

// /start Command
bot.start(async (ctx) => {
  const userId = ctx.from.id;
  
  if (!db.users[userId]) {
    db.users[userId] = { balance: 0, referrals: 0, completedTasks: [] };
  }

  // Force Subscription Check (Agar channels added hain)
  if (db.channels.length > 0) {
    let notJoined = [];
    for (const ch of db.channels) {
      try {
        const member = await ctx.telegram.getChatMember(ch, userId);
        if (['left', 'kicked', 'restricted'].includes(member.status)) {
          notJoined.push(ch);
        }
      } catch (e) {
        // Ignore error if chat check fails
      }
    }

    if (notJoined.length > 0) {
      let buttons = notJoined.map(ch => [{ text: `📢 Join Channel`, url: `https://t.me/${ch.replace('@', '')}` }]);
      buttons.push([{ text: '🔄 Joined, Check Again', callback_data: 'check_sub' }]);
      return ctx.reply("❌ **You must join our channels to use this bot!**\n\nJoin the channels below and click 'Check Again':", {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: buttons }
      });
    }
  }

  const welcomeMessage = db.settings.startText;
  
  return ctx.reply(welcomeMessage, {
    parse_mode: 'Markdown',
    reply_markup: {
      keyboard: [
        [{ text: '💳 Balance' }, { text: '👥 Refer Earn' }],
        [{ text: '🎁 Bonus' }, { text: '📋 Task Earning' }],
        [{ text: '💸 Withdraw' }]
      ],
      resize_keyboard: true
    }
  });
});

// Check Subscription Callback
bot.action('check_sub', async (ctx) => {
  await ctx.answerCbQuery();
  return ctx.reply("✅ Thank you! Send /start again to open the bot menu.");
});

// Main Menu Text Handlers
bot.hears('💳 Balance', (ctx) => {
  const userId = ctx.from.id;
  const bal = db.users[userId]?.balance || 0;
  ctx.reply(`💳 **Your Current Balance:** ₹${bal}`, { parse_mode: 'Markdown' });
});

bot.hears('🎁 Bonus', (ctx) => {
  const userId = ctx.from.id;
  if (!db.users[userId]) db.users[userId] = { balance: 0, referrals: 0 };
  
  db.users[userId].balance += db.settings.signupBonus;
  ctx.reply(`🎁 **Success!** You received ₹${db.settings.signupBonus} daily bonus.\n💳 **New Balance:** ₹${db.users[userId].balance}`, { parse_mode: 'Markdown' });
});

bot.hears('👥 Refer Earn', (ctx) => {
  const botUsername = ctx.botInfo.username;
  const userId = ctx.from.id;
  ctx.reply(`👥 **Refer & Earn System**\n\nPer Refer: ₹${db.settings.referBonus}\n\nShare this link with your friends:\nhttps://t.me/${botUsername}?start=ref_${userId}`, { parse_mode: 'Markdown' });
});

bot.hears('📋 Task Earning', (ctx) => {
  if (db.tasks.length === 0) {
    return ctx.reply("❌ **No tasks available right now!**", { parse_mode: 'Markdown' });
  }
  let msg = "📋 **Available Tasks:**\n\n";
  db.tasks.forEach((t, i) => {
    msg += `${i + 1}. ${t.title} - **₹${t.reward}**\n`;
  });
  ctx.reply(msg, { parse_mode: 'Markdown' });
});

bot.hears('💸 Withdraw', (ctx) => {
  if (!db.settings.withdrawStatus) {
    return ctx.reply("❌ **Withdrawals are currently turned OFF by admin!**", { parse_mode: 'Markdown' });
  }
  const userId = ctx.from.id;
  const bal = db.users[userId]?.balance || 0;
  ctx.reply(`💸 **Balance:** ₹${bal}\n**Min Withdraw:** ₹${db.settings.minWithdraw}\n\nSend your UPI ID to withdraw:`, { parse_mode: 'Markdown' });
});

// Professional Admin Panel Command
bot.command('admin', (ctx) => {
  if (String(ctx.from.id) !== String(ADMIN_ID)) {
    return ctx.reply("❌ **You are not authorized to use the Admin Panel!**", { parse_mode: 'Markdown' });
  }

  ctx.reply(
    `✨ **Professional Admin Panel**\n\nBot Status: ${db.settings.botStatus ? '✅ Active' : '❌ Off'}\nWithdraw Status: ${db.settings.withdrawStatus ? '✅ On' : '❌ Off'}`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📋 Manage Task', callback_data: 'adm_task' },
            { text: '📢 Broadcast', callback_data: 'adm_bc' }
          ],
          [
            { text: '➕ Add Channel', callback_data: 'adm_addch' },
            { text: '➖ Remove Channel', callback_data: 'adm_remch' }
          ],
          [
            { text: '🎁 Create Gift Code', callback_data: 'adm_gift' },
            { text: '👥 Set Refer Bonus', callback_data: 'adm_ref' }
          ],
          [
            { text: '✏️ Edit Start Msg', callback_data: 'adm_editstart' },
            { text: '💰 Set Balance', callback_data: 'adm_bal' }
          ],
          [
            { text: `🤖 Bot: ${db.settings.botStatus ? '✅ Active' : '❌ Off'}`, callback_data: 'adm_toggle_bot' },
            { text: `💸 Withdraw: ${db.settings.withdrawStatus ? '✅ On' : '❌ Off'}`, callback_data: 'adm_toggle_wd' }
          ]
        ]
      }
    }
  );
});

// Admin Panel Actions with Real Functionality
bot.action('adm_toggle_bot', async (ctx) => {
  if (String(ctx.from.id) !== String(ADMIN_ID)) return;
  db.settings.botStatus = !db.settings.botStatus;
  await ctx.answerCbQuery(`Bot status changed to ${db.settings.botStatus ? 'Active' : 'Off'}`);
  ctx.editMessageText(`✨ **Professional Admin Panel**\n\nBot Status: ${db.settings.botStatus ? '✅ Active' : '❌ Off'}\nWithdraw Status: ${db.settings.withdrawStatus ? '✅ On' : '❌ Off'}`, {
    parse_mode: 'Markdown',
    reply_markup: ctx.callbackQuery.message.reply_markup
  });
});

bot.action('adm_toggle_wd', async (ctx) => {
  if (String(ctx.from.id) !== String(ADMIN_ID)) return;
  db.settings.withdrawStatus = !db.settings.withdrawStatus;
  await ctx.answerCbQuery(`Withdraw status changed to ${db.settings.withdrawStatus ? 'On' : 'Off'}`);
  ctx.editMessageText(`✨ **Professional Admin Panel**\n\nBot Status: ${db.settings.botStatus ? '✅ Active' : '❌ Off'}\nWithdraw Status: ${db.settings.withdrawStatus ? '✅ On' : '❌ Off'}`, {
    parse_mode: 'Markdown',
    reply_markup: ctx.callbackQuery.message.reply_markup
  });
});

bot.action('adm_editstart', async (ctx) => {
  await ctx.answerCbQuery();
  ctx.reply("✍️ Send the new start message text using format:\n`/setstart Your new message here`", { parse_mode: 'Markdown' });
});

bot.command('setstart', (ctx) => {
  if (String(ctx.from.id) !== String(ADMIN_ID)) return;
  const newText = ctx.message.text.replace('/setstart', '').trim();
  if (!newText) return ctx.reply("❌ Please provide text!");
  db.settings.startText = newText;
  ctx.reply("✅ **Start message updated successfully!**", { parse_mode: 'Markdown' });
});

bot.action('adm_addch', async (ctx) => {
  await ctx.answerCbQuery();
  ctx.reply("➕ Send channel username/ID to add for Force Subscription:\n`/addchannel @channelusername`", { parse_mode: 'Markdown' });
});

bot.command('addchannel', (ctx) => {
  if (String(ctx.from.id) !== String(ADMIN_ID)) return;
  const ch = ctx.message.text.replace('/addchannel', '').trim();
  if (!ch) return ctx.reply("❌ Provide channel username!");
  if (!db.channels.includes(ch)) db.channels.push(ch);
  ctx.reply(`✅ **Channel ${ch} added to Force Subscription list!**`, { parse_mode: 'Markdown' });
});

bot.action('adm_remch', async (ctx) => {
  await ctx.answerCbQuery();
  ctx.reply(`🗑 Current Channels: ${db.channels.join(', ') || 'None'}\n\nSend to remove:\n\`/remchannel @username\``, { parse_mode: 'Markdown' });
});

bot.command('remchannel', (ctx) => {
  if (String(ctx.from.id) !== String(ADMIN_ID)) return;
  const ch = ctx.message.text.replace('/remchannel', '').trim();
  db.channels = db.channels.filter(item => item !== ch);
  ctx.reply(`✅ **Channel removed successfully!**`, { parse_mode: 'Markdown' });
});

bot.action('adm_gift', async (ctx) => {
  await ctx.answerCbQuery();
  ctx.reply("🎁 Create a gift code using format:\n`/creategift CODE AMOUNT`", { parse_mode: 'Markdown' });
});

bot.command('creategift', (ctx) => {
  if (String(ctx.from.id) !== String(ADMIN_ID)) return;
  const parts = ctx.message.text.split(' ');
  if (parts.length < 3) return ctx.reply("❌ Format: `/creategift CODE AMOUNT`", { parse_mode: 'Markdown' });
  db.giftCodes[parts[1]] = parseInt(parts[2]);
  ctx.reply(`✅ **Gift Code created!** Code: \`${parts[1]}\`, Amount: \`₹${parts[2]}\``, { parse_mode: 'Markdown' });
});

// Gift code claim command for users
bot.command('gift', (ctx) => {
  const parts = ctx.message.text.split(' ');
  if (parts.length < 2) return ctx.reply("❌ Use: `/gift CODE`", { parse_mode: 'Markdown' });
  const code = parts[1];
  const userId = ctx.from.id;

  if (!db.giftCodes[code]) {
    return ctx.reply("❌ **Invalid or expired gift code!**", { parse_mode: 'Markdown' });
  }

  if (!db.users[userId]) db.users[userId] = { balance: 0, referrals: 0 };
  db.users[userId].balance += db.giftCodes[code];
  const amt = db.giftCodes[code];
  delete db.giftCodes[code]; // Code single use

  ctx.reply(`🎉 **Gift Code Claimed Successfully!**\n💳 Added: ₹${amt}`, { parse_mode: 'Markdown' });
});

bot.launch();
console.log('Bot is running successfully with full features...');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
