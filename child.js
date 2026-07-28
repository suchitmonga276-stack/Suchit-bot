const { Telegraf } = require('telegraf');

const token = process.argv[2] || process.env.CHILD_BOT_TOKEN;
const adminId = process.argv[3] || process.env.ADMIN_ID;

if (!token) {
  console.error("❌ Child Bot Token missing!");
  process.exit(1);
}

const childBot = new Telegraf(token);

const db = {
  users: {},
  settings: {
    startText: "🔥 **Welcome to Earning Bot!**",
    referBonus: 3,
    signupBonus: 5,
    minWithdraw: 15,
    withdrawStatus: true,
    botStatus: true
  },
  channels: [],
  tasks: [],
  giftCodes: {}
};

childBot.start((ctx) => {
  const userId = ctx.from.id;
  if (!db.users[userId]) {
    db.users[userId] = { balance: 0, referrals: 0 };
  }

  ctx.reply(db.settings.startText, {
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

childBot.hears('💳 Balance', (ctx) => {
  const bal = db.users[ctx.from.id]?.balance || 0;
  ctx.reply(`💳 **Your Current Balance:** ₹${bal}`, { parse_mode: 'Markdown' });
});

childBot.hears('🎁 Bonus', (ctx) => {
  const userId = ctx.from.id;
  if (!db.users[userId]) db.users[userId] = { balance: 0, referrals: 0 };
  db.users[userId].balance += db.settings.signupBonus;
  ctx.reply(`🎁 **Success!** Received ₹${db.settings.signupBonus} bonus.\n💳 **Balance:** ₹${db.users[userId].balance}`, { parse_mode: 'Markdown' });
});

childBot.hears('👥 Refer Earn', (ctx) => {
  ctx.reply(`👥 **Refer & Earn**\n\nPer Refer: ₹${db.settings.referBonus}\nShare link: https://t.me/${ctx.botInfo.username}?start=ref_${ctx.from.id}`, { parse_mode: 'Markdown' });
});

// Professional Admin Panel Command
childBot.command('admin', (ctx) => {
  if (String(ctx.from.id) !== String(adminId)) {
    return ctx.reply("❌ **Unauthorized!**", { parse_mode: 'Markdown' });
  }

  ctx.reply(
    `✨ **Professional Admin Panel**\n\nBot Status: ${db.settings.botStatus ? '✅ Active' : '❌ Off'}`,
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
            { text: '🏠 Change Menu Text', callback_data: 'adm_menutext' },
            { text: '✏️ Edit Start Msg', callback_data: 'adm_editstart' }
          ],
          [
            { text: '🖼️ Change Start Image', callback_data: 'adm_startimg' },
            { text: '💰 Set Balance', callback_data: 'adm_bal' }
          ],
          [
            { text: '🤖 Bot: ✅ Active', callback_data: 'adm_status' },
            { text: '💸 Withdraw: ✅ On', callback_data: 'adm_wd' }
          ]
        ]
      }
    }
  );
});

childBot.launch();
console.log('Child bot launched successfully with admin panel.');
