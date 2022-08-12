import { Bot } from 'grammy';
import { readFile } from 'fs/promises';
import config from 'config';

import { Server } from './game/Server.js';
import { bot_commands } from './bot_commands.js';

const IP = config.get('Server.IP');
const PORT = config.get('Server.PORT');

const bot = new Bot(config.get('Telegram.BotToken'));

(async () => {
  const server = new Server(
    IP,
    PORT
  );

  const rulesFile = await readFile('./chat_rules.md', { encoding: 'utf-8' } );
  const rulesGifFile = 'https://tenor.com/view/%D0%BF%D1%80%D0%B0%D0%B2%D0%B8%D0%BB%D0%B0%D1%87%D0%B8%D1%82%D0%B0%D0%B9%D0%B8%D0%BB%D0%B8%D0%B1%D0%B0%D0%BD-read-the-rules-or-ban-penguin-tap-sign-gif-17005682';

  await bot.api.setMyCommands(bot_commands);

  await bot.on('message:new_chat_members', async ctx => {
    await ctx.replyWithVideo(rulesGifFile, {
      reply_to_message_id: ctx.message.message_id,
      caption: `Значит так, @${ctx.from.username} - читай внимательно!\n\n${rulesFile}`
    });
  });

  await bot.command('msgdump', async ctx => {
    let isAdmin = false;
    const admins = await bot.api.getChatAdministrators(ctx.chat.id);

    for await (const admin of admins) {
      if (admin.user.username === ctx.from.username) {
        isAdmin = true;
      }
    }

    if (!isAdmin) {
      return;
    }

    const message_to_dump = ctx.message.reply_to_message || ctx;

    await ctx.reply(`<code>${JSON.stringify(message_to_dump, null, 2)}</code>`, {
      parse_mode: 'HTML',
      reply_to_message_id: ctx.message.message_id
    });
  });

  await bot.command('rules', async ctx => {
    await ctx.reply(rulesFile, { reply_to_message_id: ctx.message.message_id });
  });

  await bot.command('info', async ctx => {
    await server.updateInfo();
    const gameInfo = server.getGameInfo();

    if (!gameInfo) {
      return ctx.reply(`Не удалось получить информацию с сервера ${IP}:${PORT}. Попробуйте позже`);
    }

    let serverInfo = `Сервер: <code>${gameInfo.name}</code>\n`;
    serverInfo += `Адрес: <code>${gameInfo.connect}</code>\n`;
    serverInfo += `Карта: <code>${gameInfo.map}</code>\n`;
    serverInfo += `Игроков: <code>${gameInfo.raw.numplayers}</code> из <code>${gameInfo.maxplayers}</code>\n\n`;

    const players = gameInfo.players.filter(item => item.name !== config.get('Server.ExceptName'));

    if (players.length > 0) {
      serverInfo += '<b>Ник\t\t(ФРАГИ | ВРЕМЯ)</b>\n';
    }

    let count = 0;
    for await (const player of players) {
      count++;

      serverInfo += `${count}. <code>${player.name}</code>`;
      serverInfo += `\t(${player.raw.score} | ${Math.round(player.raw.time / 60)} мин.)\n`;
    }

    await ctx.reply(serverInfo, { parse_mode: 'HTML' });
  });

  await bot.start();
})();
