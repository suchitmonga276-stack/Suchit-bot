const { Telegraf, Markup } = require('telegraf');

const childToken = process.argv[2];
const adminId = process.argv[3];

if (!childToken) {
  console.error("❌ **Child Bot Token not provided!**");
  process.exit(1);
}

const bot = new Telegraf(childToken);

// **In-Memory Earning Database & Dynamic Settings**
const db = {
  users: {},
  settings: {
    startText: "🔥 **Welcome to the Ultimate UPI Earning Bot! Complete tasks, refer friends, and earn daily cash directly to your UPI.**",
    startImage: "https://files.catbox.moe/example.jpg", // Change to your image URL
    referBonus: 5,
    signupBonus: 10,
    minWithdraw: 20,
    withdrawStatus: true,
    botStatus: true
  },
  channels: [] // Format: { id: '@channel', type: 'public' } or invite links for private
};

// **Maintenance & Status Check**
bot.use(async (ctx, next) => {
  if (!db.settings.botStatus && String(ctx.from?.id) !== String(adminId)) {
    return ctx.reply("🛠 **Bot is currently under maintenance by Admin. Please check back later!**", { parse_mode: 'Markdown' });
  }
  return next();
});

// **Start Command with Image & Force Join**
bot.start(async (ctx) => {
  const userId = ctx.from.id;

  if (!db.users[userId]) {
    db.users[userId] = { balance: 0, referrals: 0 };
    db.users[userId].balance += db.settings.signupBonus; // Signup bonus
  }

  // **Force Join Check**
  if (db.channels.length > 0) {
    let notJoined = [];
    for (const ch of db.channels) {
      try {
        const member = await ctx.telegram.getChatMember(ch.id, userId);
        if (['left', 'kicked', 'restricted'].includes(member.status)) {
          notJoined.push(ch);
        }
      } catch (e) {
        notJoined.push(ch);
      }
    }

    if (notJoined.length > 0) {
      let buttons = notJoined.map(ch => [{ text: `📢 **Join Channel**`, url: ch.url }]);
      buttons.push([{ text: '🔄 **Joined, Check Again**', callback_data: 'check_sub' }]);
      return ctx.reply("❌ **You must join our update channels to use this bot!**\n\n**Join below and click check again:**", {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: buttons }
      });
    }
  }

  // **Send Start Image and Text (All Bold)**
  await ctx.replyWithPhoto(db.settings.startImage, {
    caption: db.settings.startText,
    parse_mode: 'Markdown',
    reply_markup: {
      keyboard: [
        [{ text: '💳 **Balance**' }, { text: '👥 **Refer Earn**' }],
        [{ text: '🎁 **Daily Bonus**' }, { text: '📋 **Task Earning**' }],
        [{ text: '💸 **Withdraw**' }]
      ],
      resize_keyboard: true
    }
  });
});

bot.action('check_sub', async (ctx) => {
  await ctx.answerCbQuery();
  return ctx.reply("✅ **Thank you for joining! Send /start again to open the main menu.**", { parse_mode: 'Markdown' });
});

// **User Menu Handlers (All Bold)**
bot.hears('💳 **Balance**', (ctx) => {
  const userId = ctx.from.id;
  const bal = db.users[userId]?.balance || 0;
  ctx.reply(`💳 **Your Current Wallet Balance:** ₹${bal}`, { parse_mode: 'Markdown' });
});

bot.hears('🎁 **Daily Bonus**', (ctx) => {
  const userId = ctx.from.id;
  if (!db.users[userId]) db.users[userId] = { balance: 0 };
  
  db.users[userId].balance += 2; // Daily bonus amount
  ctx.reply(`🎁 **Success! You claimed your daily bonus of ₹2.**\n💳 **New Balance:** ₹${db.users[userId].balance}`, { parse_mode: 'Markdown' });
});

bot.hears('👥 **Refer Earn**', (ctx) => {
  const botUsername = bot.botInfo?.username || "Bot";
  const userId = ctx.from.id;
  ctx.reply(`👥 **Refer & Earn Program**\n\n**Per Refer Reward:** ₹${db.settings.referBonus}\n\n**Share your referral link:**\n\`https://t.me/${botUsername}?start=ref_${userId}\``, { parse_mode: 'Markdown' });
});

bot.hears('💸 **Withdraw**', (ctx) => {
  if (!db.settings.withdrawStatus) {
    return ctx.reply("❌ **Withdrawals are temporarily turned OFF by Admin!**", { parse_mode: 'Markdown' });
  }
  const userId = ctx.from.id;
  const bal = db.users[userId]?.balance || 0;
  ctx.reply(`💸 **Your Balance:** ₹${bal}\n**Minimum Withdrawal:** ₹${db.settings.minWithdraw}\n\n**Send your UPI ID to request payout:**`, { parse_mode: 'Markdown' });
});

// **Advanced Admin Panel for Child Bot**
bot.command('admin', (ctx) => {
  if (String(ctx.from.id) !== String(adminId)) {
    return ctx.reply("❌ **You are not authorized to use this admin panel!**", { parse_mode: 'Markdown' });
  }

  ctx.reply(
    `✨ **Child Bot Admin Panel**\n\n**Bot Status:** ${db.settings.botStatus ? '✅ **Active**' : '❌ **Off**'}`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🖼️ **Change Start Image**', callback_data: 'set_img' },
            { text: '✍️ **Change Start Text**', callback_data: 'set_txt' }
          ],
          [
            { text: '👥 **Set Refer Bonus**', callback_data: 'set_ref' },
            { text: '🎁 **Set Signup Bonus**', callback_data: 'set_sign' }
          ],
          [
            { text: '📢 **Add Force Join Channel**', callback_data: 'add_ch' },
            { text: '🛠️ **Toggle Maintenance**', callback_data: 'toggle_bot' }
          ]
        ]
      }
    }
  );
});

bot.action('set_txt', async (ctx) => {
  await ctx.answerCbQuery();
  ctx.reply("✍️ **Send new start text using format:**\n\`/setstart Your bold text here\`", { parse_mode: 'Markdown' });
});

bot.command('setstart', (ctx) => {
  if (String(ctx.from.id) !== String(adminId)) return;
  const newText = ctx.message.text.replace('/setstart', '').trim();
  if (!newText) return ctx.reply("❌ **Provide valid text!**", { parse_mode: 'Markdown' });
  db.settings.startText = newText;
  ctx.reply("✅ **Start message updated successfully!**", { parse_mode: 'Markdown' });
});

bot.action('set_img', async (ctx) => {
  await ctx.answerCbQuery();
  ctx.reply("🖼️ **Send new image direct URL using format:**\n\`/setimage https://imageurl.com/pic.jpg\`", { parse_mode: 'Markdown' });
});

bot.command('setimage', (ctx) => {
  if (String(ctx.from.id) !== String(adminId)) return;
  const newImg = ctx.message.text.replace('/setimage', '').trim();
  if (!newImg) return ctx.reply("❌ **Provide valid image link!**", { parse_mode: 'Markdown' });
  db.settings.startImage = newImg;
  ctx.reply("✅ **Start image updated successfully!**", { parse_mode: 'Markdown' });
});

bot.launch();
console.log('🚀 **Child Bot instance started successfully.**');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
