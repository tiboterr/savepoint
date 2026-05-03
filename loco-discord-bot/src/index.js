import 'dotenv/config';
import OpenAI from 'openai';
import {
  Client,
  GatewayIntentBits,
  Partials,
  Events,
  REST,
  Routes,
  SlashCommandBuilder,
} from 'discord.js';

const required = ['DISCORD_TOKEN', 'DISCORD_CLIENT_ID', 'LLM_BASE_URL', 'LLM_MODEL'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Missing environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

const BOT_NAME = process.env.BOT_NAME || 'LOCO';
const TRIGGER_ROLE_ID = process.env.DISCORD_TRIGGER_ROLE_ID || '';
const TRIGGER_NAME = (process.env.DISCORD_TRIGGER_NAME || BOT_NAME).trim().toLowerCase();
const MAX_CONTEXT_MESSAGES = clampNumber(process.env.MAX_CONTEXT_MESSAGES, 12, 4, 25);
const MAX_REPLY_CHARS = clampNumber(process.env.MAX_REPLY_CHARS, 1900, 500, 1900);
const TEMPERATURE = clampFloat(process.env.LLM_TEMPERATURE, 0.7, 0, 2);
const ALLOWED_CHANNEL_IDS = parseCsv(process.env.DISCORD_ALLOWED_CHANNEL_IDS);
const IGNORED_CHANNEL_IDS = parseCsv(process.env.DISCORD_IGNORED_CHANNEL_IDS);
const SYSTEM_PROMPT =
  process.env.SYSTEM_PROMPT ||
  `Tu es ${BOT_NAME}, un assistant Discord utile, direct et chaleureux. Réponds en français sauf demande contraire. Sois concis, concret, et évite de spammer.`;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel, Partials.Message],
});

const llm = new OpenAI({
  apiKey: process.env.LLM_API_KEY || 'dummy',
  baseURL: process.env.LLM_BASE_URL,
});

const commands = [
  new SlashCommandBuilder()
    .setName('ask')
    .setDescription(`Pose une question à ${BOT_NAME}`)
    .addStringOption((option) =>
      option
        .setName('message')
        .setDescription('Ta demande')
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('loco-ping')
    .setDescription('Vérifie si LOCO répond bien'),
].map((command) => command.toJSON());

async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

  if (process.env.DISCORD_GUILD_ID) {
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.DISCORD_CLIENT_ID,
        process.env.DISCORD_GUILD_ID
      ),
      { body: commands }
    );
    console.log('Guild slash commands registered.');
    return;
  }

  await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), {
    body: commands,
  });
  console.log('Global slash commands registered.');
}

function clampNumber(value, fallback, min, max) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.round(parsed)));
}

function clampFloat(value, fallback, min, max) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function parseCsv(value) {
  return new Set(
    String(value || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  );
}

function normalizeContent(content) {
  return String(content || '').toLowerCase().trim();
}

function isAllowedChannel(channelId) {
  if (IGNORED_CHANNEL_IDS.has(channelId)) return false;
  if (ALLOWED_CHANNEL_IDS.size === 0) return true;
  return ALLOWED_CHANNEL_IDS.has(channelId);
}

function startsWithTriggerName(message) {
  const content = normalizeContent(message.content);
  if (!content || !TRIGGER_NAME) return false;

  const variants = [
    TRIGGER_NAME,
    `@${TRIGGER_NAME}`,
    `${TRIGGER_NAME},`,
    `${TRIGGER_NAME}:`,
    `@${TRIGGER_NAME},`,
    `@${TRIGGER_NAME}:`,
  ];

  return variants.some((variant) => content.startsWith(variant));
}

function hasTriggerRoleMention(message) {
  return Boolean(TRIGGER_ROLE_ID && message.mentions.roles.has(TRIGGER_ROLE_ID));
}

function isReplyToBot(message) {
  return message.mentions.repliedUser?.id === client.user?.id;
}

function shouldReply(message) {
  if (message.author.bot) return false;
  if (!isAllowedChannel(message.channelId)) return false;
  if (message.mentions.everyone) return false;
  if (message.mentions.has(client.user)) return true;
  if (hasTriggerRoleMention(message)) return true;
  if (startsWithTriggerName(message)) return true;
  if (isReplyToBot(message)) return true;
  return false;
}

function stripTriggers(content) {
  return String(content || '')
    .replace(/<@!?\d+>/g, '')
    .replace(/<@&\d+>/g, '')
    .replace(new RegExp(`^@?${escapeRegex(TRIGGER_NAME)}[,:]?\\s*`, 'i'), '')
    .trim();
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function chunkText(text, maxLength = 1900) {
  const source = String(text || '').trim();
  if (!source) return ['Pas de réponse du modèle.'];

  const chunks = [];
  let remaining = source;

  while (remaining.length > maxLength) {
    let cut = remaining.lastIndexOf('\n', maxLength);
    if (cut < maxLength * 0.5) cut = remaining.lastIndexOf(' ', maxLength);
    if (cut < maxLength * 0.5) cut = maxLength;
    chunks.push(remaining.slice(0, cut).trim());
    remaining = remaining.slice(cut).trim();
  }

  if (remaining) chunks.push(remaining);
  return chunks;
}

async function buildContextMessages(message) {
  const fetched = await message.channel.messages.fetch({ limit: MAX_CONTEXT_MESSAGES });
  const chronological = [...fetched.values()]
    .filter((msg) => !msg.author.bot || msg.author.id === client.user.id)
    .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
    .slice(-MAX_CONTEXT_MESSAGES);

  const context = chronological.map((msg) => ({
    role: msg.author.id === client.user.id ? 'assistant' : 'user',
    content: `${msg.author.displayName || msg.author.username}: ${msg.content || '[message non textuel]'}`,
  }));

  if (message.reference?.messageId && !chronological.some((msg) => msg.id === message.reference.messageId)) {
    try {
      const repliedTo = await message.channel.messages.fetch(message.reference.messageId);
      if (repliedTo) {
        context.unshift({
          role: repliedTo.author.id === client.user.id ? 'assistant' : 'user',
          content: `${repliedTo.author.displayName || repliedTo.author.username}: ${repliedTo.content || '[message non textuel]'}`,
        });
      }
    } catch {
      // ignore fetch failures
    }
  }

  return context;
}

async function askLLM(userPrompt, message) {
  const context = message ? await buildContextMessages(message) : [];
  const completion = await llm.chat.completions.create({
    model: process.env.LLM_MODEL,
    temperature: TEMPERATURE,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      ...context,
      { role: 'user', content: userPrompt },
    ],
  });

  return completion.choices[0]?.message?.content?.trim() || 'Pas de réponse du modèle.';
}

async function sendReply(target, text) {
  const chunks = chunkText(text, MAX_REPLY_CHARS);
  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index];
    if (index === 0) {
      await target.reply({
        content: chunk,
        allowedMentions: { repliedUser: false, parse: [] },
      });
    } else {
      await target.channel.send({
        content: chunk,
        allowedMentions: { parse: [] },
      });
    }
  }
}

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`${readyClient.user.tag} is online.`);
  try {
    await registerCommands();
  } catch (error) {
    console.error('Command registration failed:', error);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'loco-ping') {
    await interaction.reply({ content: `${BOT_NAME} est bien en ligne.`, ephemeral: true });
    return;
  }

  if (interaction.commandName !== 'ask') return;

  const prompt = interaction.options.getString('message', true);
  await interaction.deferReply();

  try {
    const reply = await askLLM(prompt, null);
    await interaction.editReply(chunkText(reply, 2000)[0]);
  } catch (error) {
    console.error(error);
    await interaction.editReply('J’ai planté en parlant au modèle GLM. Vérifie la config LOCO / endpoint.');
  }
});

client.on(Events.MessageCreate, async (message) => {
  if (!shouldReply(message)) return;

  await message.channel.sendTyping();

  try {
    const prompt = stripTriggers(message.content) || 'Réponds à ce message en tenant compte du contexte du salon.';
    const reply = await askLLM(prompt, message);
    await sendReply(message, reply);
  } catch (error) {
    console.error(error);
    await message.reply({
      content: 'Je n’arrive pas à joindre le modèle GLM pour le moment.',
      allowedMentions: { repliedUser: false, parse: [] },
    });
  }
});

client.login(process.env.DISCORD_TOKEN);
