const { Telegraf } = require('telegraf');
const { spawn } = require('child_process');

const bot = new Telegraf(process.env.BOT_TOKEN);
const users = {};
const activeChildBots = {};

bot.start((ctx) => {
  ctx.reply(
    `🔥 **Welcome to Master Bot Manager!**\n\n` +
    `Send your bot token to launch your child bot with full Professional Admin Panel using command:\n` +
    `/launch TOKEN YOUR_ADMIN_ID`,
    {
      parse_mode: 'Markdown',
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
  ctx.reply(`💳 **Your Current Balance:** ₹${bal}`, { parse_mode: 'Markdown' });
});

bot.command('bonus', (ctx) => {
  const userId = ctx.from.id;
  if (!users[userId]) users[userId] = { balance: 0, referrals: 0 };
  
  users[userId].balance += 5;
  ctx.reply(`🎁 **Success!** You received ₹5 daily bonus.\n💳 **New Balance:** ₹${users[userId].balance}`, { parse_mode: 'Markdown' });
});

bot.command('refer', (ctx) => {
  const botUsername = ctx.botInfo.username;
  ctx.reply(`👥 **Refer & Earn System**\n\nShare this link with your friends and earn rewards:\nhttps://t.me/${botUsername}?start=ref_${ctx.from.id}`, { parse_mode: 'Markdown' });
});

// Launch Child Bot with Full Professional Admin Panel & Customization Options
bot.command('launch', (ctx) => {
  const text = ctx.message.text;
  const parts = text.split(' ');
  
  if (parts.length < 3) {
    return ctx.reply('❌ **Invalid format!**\nUse: `/launch TOKEN YOUR_ADMIN_ID`', { parse_mode: 'Markdown' });
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
          '🔥 **Welcome to Earning Bot!**',
          {
            parse_mode: 'Markdown',
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

      // Professional Admin Panel Command with All Options
      childBot.command('admin', (c) => {
        if (String(c.from.id) !== String(adminId)) {
          return c.reply('❌ **You are not authorized to use the Admin Panel!**', { parse_mode: 'Markdown' });
        }

        c.reply(
          '✨ **Professional Admin Panel**',
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
                  { text: '🤹 Manage Positions', callback_data: 'adm_pos' }
                ],
                [
                  { text: '🎁 Create Gift Code', callback_data: 'adm_gift' },
                  { text: '👥 Set Refer Bonus (3)', callback_data: 'adm_ref' }
                ],
                [
                  { text: '🏠 Change Menu Text', callback_data: 'adm_menutext' },
                  { text: '✏️ Edit Start Msg', callback_data: 'adm_editstart' }
                ],
                [
                  { text: '🖼️ Change Start Image', callback_data: 'adm_startimg' }
                ],
                [
                  { text: '🎁 Set Bonus (100)', callback_data: 'adm_setbonus' },
                  { text: '💰 Set Balance', callback_data: 'adm_bal' }
                ],
                [
                  { text: '🤖 Bot: ✅ Active', callback_data: 'adm_status' }
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
      console.log('Child bot with full Admin Panel launched successfully.');
    `]);

    activeChildBots[token] = childProcess;

    ctx.reply(`✅ **Child Bot Launched Successfully!** 🚀\n\nToken: \`${token.substring(0, 10)}...\`\nAdmin ID: \`${adminId}\`\n\nAb apne child bot par jaakar \`/admin\` command bhej!`, { parse_mode: 'Markdown' });
  } catch (error) {
    ctx.reply(`❌ **Failed to launch child bot:** ${error.message}`, { parse_mode: 'Markdown' });
  }
});

bot.launch();
console.log('Master Bot is running successfully...');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
