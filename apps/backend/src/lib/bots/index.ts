
import redis from '@/lib/redis';
import bots from './bots';

// Pre-compile regex patterns at module load time
const compiledBots = bots.map(bot => {
  if ('regex' in bot) {
    return {
      ...bot,
      compiledRegex: new RegExp(bot.regex),
    };
  }
  return bot;
});

const regexBots = compiledBots.filter(bot => 'compiledRegex' in bot);
const includesBots = compiledBots.filter(bot => 'includes' in bot);

const CACHE_TTL = 60 * 5; // 5 minutes

export const isBot = async (ua: string): Promise<{ name: string; type: string } | null> => {
  if (!ua) return null;

  const cacheKey = `bot-ua:${ua}`;

  // Check Redis cache if enabled
  if (redis.enabled) {
    try {
      const cached = await redis.client.get(cacheKey);
      if (cached) {
        if (cached.bot === false) return null;
        return cached;
      }
    } catch (e) {
      // Ignore cache errors
    }
  }

  let result: { name: string; type: string } | null = null;

  // Check simple string patterns first (fast)
  for (const bot of includesBots) {
    if (ua.includes(bot.includes)) {
      result = {
        name: bot.name,
        type: 'category' in bot ? bot.category : 'Unknown',
      };
      break;
    }
  }

  // Check regex patterns (slower)
  if (!result) {
    for (const bot of regexBots) {
      // @ts-ignore
      if (bot.compiledRegex.test(ua)) {
        result = {
          name: bot.name,
          type: 'category' in bot ? bot.category : 'Unknown',
        };
        break;
      }
    }
  }

  // Save to cache
  if (redis.enabled) {
    try {
      if (result) {
        await redis.client.set(cacheKey, result, CACHE_TTL);
      } else {
        await redis.client.set(cacheKey, { bot: false }, CACHE_TTL);
      }
    } catch (e) {
      // Ignore cache errors
    }
  }

  return result;
};
