import { Bot, Context, session, SessionFlavor } from 'grammy';
import { db, telegramUsers, NewTelegramUser, pages } from '@/lib/db';
import { eq } from 'drizzle-orm';

interface SessionData {
  step?: string;
  pageId?: number;
}

type MyContext = Context & SessionFlavor<SessionData>;

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('TELEGRAM_BOT_TOKEN is not set');
}

export const bot = new Bot<MyContext>(token || '');

bot.use(session({ initial: (): SessionData => ({}) }));

bot.command('start', async (ctx) => {
  const user = ctx.from;
  if (!user) return;

  try {
    const existingUser = await db.query.telegramUsers.findFirst({
      where: eq(telegramUsers.telegramId, user.id.toString()),
    });

    if (!existingUser) {
      const newUser: NewTelegramUser = {
        telegramId: user.id.toString(),
        firstName: user.first_name,
        lastName: user.last_name || null,
        username: user.username || null,
        isBot: user.is_bot || false,
      };
      await db.insert(telegramUsers).values(newUser);
    }

    await ctx.reply(
      `Welcome to Dynamic Pages Bot! 🎉\n\n` +
      `Available commands:\n` +
      `/start - Start the bot\n` +
      `/help - Show help message\n` +
      `/pages - List all published pages\n` +
      `/page <slug> - View a specific page\n` +
      `/stats - Show bot statistics`
    );
  } catch (error) {
    console.error('Error in start command:', error);
    await ctx.reply('An error occurred. Please try again later.');
  }
});

bot.command('help', async (ctx) => {
  await ctx.reply(
    `📚 Help Menu\n\n` +
    `This bot helps you interact with the Dynamic Pages system.\n\n` +
    `Commands:\n` +
    `/start - Initialize the bot\n` +
    `/pages - View all published pages\n` +
    `/page <slug> - View content of a specific page\n` +
    `/stats - View usage statistics\n\n` +
    `For more information, visit our website!`
  );
});

bot.command('pages', async (ctx) => {
  try {
    const allPages = await db.query.pages.findMany();

    if (allPages.length === 0) {
      await ctx.reply('No pages available at the moment.');
      return;
    }

    const pageList = allPages
      .map((page, index) => `${index + 1}. ${page.title} (/page ${page.slug})`)
      .join('\n');

    await ctx.reply(
      `📄 Available Pages:\n\n${pageList}\n\n` +
      `Use /page <slug> to view a specific page.`
    );
  } catch (error) {
    console.error('Error fetching pages:', error);
    await ctx.reply('Failed to fetch pages. Please try again later.');
  }
});

bot.command('page', async (ctx) => {
  const slug = ctx.match;
  
  if (!slug) {
    await ctx.reply('Please provide a page slug. Example: /page about-us');
    return;
  }

  try {
    const page = await db.query.pages.findFirst({
      where: eq(pages.slug, slug),
    });

    if (!page) {
      await ctx.reply('Page not found. Use /pages to see available pages.');
      return;
    }


    const content = typeof page.content === 'string' 
      ? page.content 
      : JSON.stringify(page.content, null, 2);

    await ctx.reply(
      `📖 ${page.title}\n\n` +
      `Content:\n${content.substring(0, 3000)}` +
      (content.length > 3000 ? '\n\n... (content truncated)' : '')
    );
  } catch (error) {
    console.error('Error fetching page:', error);
    await ctx.reply('Failed to fetch the page. Please try again later.');
  }
});

bot.command('stats', async (ctx) => {
  try {
    const userCount = await db.query.telegramUsers.findMany();
    const pageCount = await db.query.pages.findMany();

    await ctx.reply(
      `📊 Bot Statistics:\n\n` +
      `👥 Total Users: ${userCount.length}\n` +
      `📄 Total Pages: ${pageCount.length}\n` +
      `📅 Bot Active Since: ${new Date().toLocaleDateString()}`
    );
  } catch (error) {
    console.error('Error fetching stats:', error);
    await ctx.reply('Failed to fetch statistics. Please try again later.');
  }
});

bot.on('message:text', async (ctx) => {
  await ctx.reply(
    'I didn\'t understand that command. ' +
    'Use /help to see available commands.'
  );
});

bot.catch((err) => {
  console.error('Error in bot:', err);
});