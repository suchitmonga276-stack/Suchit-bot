const { Telegraf } = require('telegraf');
const { spawn } = require('child_process');

const bot = new Telegraf(process.env.BOT_TOKEN);
const users = {};
const activeChildBots = {};

bot.start((ctx) => {
  ctx.reply(
    `🔥 Welcome to Master Bot Manager!\n\n` +
    `Send your bot token to launch your child bot with Professional Admin Panel using command:\n` +
    `/launch TOKEN YOUR_ADMIN_ID`,
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

bot.command('balance', (ctx) => {
  const userId = ctx.from.id;
  const bal = users[userId] ? users[userId].balance : 0;
  ctx.reply(`💳 Your Current Balance: ₹${bal}`);
});

bot.command('bonus', (ctx) => {
  const userId = ctx.from.id;
  if (!users[userId]) users[userId] = { balance: 0, referrals: 0 };
  
  users[userId].balance += 5;
  ctx.reply(`🎁 Success! You received ₹5 daily bonus.\n💳 New Balance: ₹${users[userId].balance}`);
});

bot.command('refer', (ctx) => {
  const botUsername = ctx.botInfo.username;
  ctx.reply(`👥 **Refer & Earn System**\n\nShare this link with your friends:\nhttps://t.me/${botUsername}?start=ref_${ctx.from.id}`);
});

// Launch Child Bot with Full Admin Panel & Features
bot.command('launch', (ctx) => {
  const text = ctx.message.text;
  const parts = text.split(' ');
  
  if (parts.length < 3) {
    return ctx.reply('❌ Invalid format!\nUse: /launch TOKEN YOUR_ADMIN_ID');
  }

  const token = parts[1];
  const adminId = parts[2];

  try {
    const childProcess = spawn('node', ['-e', `
      const { Telegraf } = require('telegraf');
      const childBot = new Telegraf('${token}');
      const adminId = '${adminId}';

      childBot.start((c) => {
        c.reply(
          '🔥 Welcome to Earning Bot!',
          {
            reply_markup: {
              keyboard: [
                [{ text: '💳 Balance' }, { text: '👥 Refer Earn' }],
                [{ text: '🎁 Bonus' }, { text: '📋 Task Earning' }],
                [{ text: '💸 Withdraw' }]
              ],
              resize_keyboard: true
            }
          }
        );
      });

      // Admin Panel Command
      childBot.command('admin', (c) => {
        if (String(c.from.id) !== String(adminId)) {
          return c.reply('❌ You are not authorized to use the Admin Panel!');
        }

        c.reply(
          '✨ Professional Admin Panel',
          {
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
                  { text: '💰 Set Balance', callback_data: 'adm_bal' },
                  { text: '⚙️ Bot: ✅ Active', callback_data: 'adm_status' }
                ],
                [
                  { text: '💸 Withdraw: ✅ On', callback_data: 'adm_wd' }
                ]
              ]
            }
          }
        );
      });

      childBot.launch();
      console.log('Child bot with Admin Panel launched successfully.');
    `]);

    activeChildBots[token] = childProcess;

    ctx.reply(`✅ Child Bot Launched Successfully with Full Admin Panel! 🚀\n\nToken: ${token.substring(0, 10)}...\nAdmin ID: ${adminId}\n\nAb apne child bot par jaakar /admin command try kar!`);
  } catch (error) {
    ctx.reply(`❌ Failed to launch child bot: ${error.message}`);
  }
});

bot.launch();
console.log('Master Bot is running successfully...');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
