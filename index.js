const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();
const axios = require('axios');
const { Telegraf } = require('telegraf');
const cheerio = require('cheerio');

const helpers = require('./helpers');

const BOT_TOKEN = process.env.TG_BOT_TOKEN;
const tg = new Telegraf(BOT_TOKEN);

// Create the tg BOT
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

const baseUrl = 'https://moto.av.by';
let intervalId;
const time = 60 * 1000;
let count = 1;


bot.onText(/\/start/, (msg) => {
    const keyboardBrands = {
        reply_markup: {
            keyboard: [
                ['Honda', { text: 'CB' }],
                ['Yamaha', { text: 'XSR' }, { text: 'XV' }],
                ['BMW', { text: 'R' }, { text: 'S' }, { text: 'K' },
                    { text: 'G' }, { text: 'F' },
                ],
                ['HD', { text: 'RK' }, { text: 'SG' }, { text: 'RG' },
                    { text: 'FB' }, { text: 'FTB' },
                ],
            ],
            one_time_keyboard: true,
            resize_keyboard: true,
        },
    };
    bot.sendMessage(msg.chat.id, 'Привет! Я бот, который поможет найти мотоцикл.\n' +
        'Выберите значение.', keyboardBrands);
});

bot.onText(/^(Honda|CB|Yamaha|XSR|XV|BMW|[RSKGF]|HD|RK|SG|RG|FB|FTB)$/, (msg) => {
    // Hide the keyboard with brands after selecting a value
    const hideKeyboardBrands = {
        reply_markup: {
            remove_keyboard: true,
        },
    };
    const yearKeyboard = {
        reply_markup: {
            keyboard: [
                [{ text: '2015'}, { text: '2016'}, { text: '2017'}, { text: '2018'}],
                [{ text: '2019'}, { text: '2020'}, { text: '2021'}, { text: '2022'},
                    { text: '2023'},
                ],
            ],
            resize_keyboard: true,
        },
    };
    bot.sendMessage(msg.chat.id, `Вы выбрали ${msg.text}`, hideKeyboardBrands);
    bot.sendMessage(msg.chat.id, `Выберите год`, yearKeyboard);
    tg.context.data = { model: msg.text?.toLowerCase() };
});

bot.onText(/^20(0[1-9]|[12]\d|23)$/, async (msg) => {
    // Hide the keyboard with years after selecting a value
    const hideKeyboardYear = {
        reply_markup: {
            remove_keyboard: true,
        },
    };

    const buttonsPrice = [];
    for (let i = 5; i <= 38; i += 1) {
        buttonsPrice.push({ text: `${i}k`, callback_data: `${i}000` });
    }

    const rows = [];
    for (let i = 0; i < buttonsPrice.length; i += 6) {
        rows.push(buttonsPrice.slice(i, i + 6));
    }

    const priceKeyboard = {
        reply_markup: {
            inline_keyboard: rows,
        },
    };

    await bot.sendMessage(msg.chat.id, `Вы выбрали ${msg.text} год`, hideKeyboardYear);
    tg.context.data.year = msg.text;
    await bot.sendMessage(msg.chat.id, `Выберите максимальную цену:`, priceKeyboard)
});

bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    setTimeout(() => {
        bot.deleteMessage(chatId, query.message.message_id);
    }, 1000);
    // Removing the price keyboard
    await bot.editMessageReplyMarkup(
        { inline_keyboard: [] },
        { chat_id: chatId, message_id: query.message.message_id }
    );
    await bot.sendMessage(
        chatId,
        `Вы выбрали цену: ${query.data}$`,
    );

    tg.context.data.price = query.data;
    bot.emit('message', { chatId, data: tg.context.data });
});

bot.on('message', async (msg) => {
    const chatId = msg.chat?.id || msg.chatId;
    let message = '';
    let model, year, price, sort;

    if (!msg.text && tg.context.data?.price) {
        [model, year, price] = Object.values(tg.context.data);
    } else {
        [model, year, price, sort] = msg.text?.split(' ');
    }
    if (model) model = model.toLowerCase();

    if (model === '/start') {
        count = 1;
        if (intervalId) clearInterval(intervalId);
        if (tg.context.data?.model) {
            tg.context.data = {};
        }
        return;
    }

    if (model === 'off') {
        await bot.sendMessage(chatId, 'Поиск выключен! 👋');
        clearInterval(intervalId);
        return;
    }

    const _brand = helpers.findModelByBrand(model);
    if (!_brand) {
        clearInterval(intervalId);
        await bot.sendMessage(chatId, `Выберите модель введя команду /start`);
        return;
    }

    if (_brand && year && price) {
        await bot.sendMessage(chatId, `Поищем мот ${_brand.toUpperCase()} ${helpers.findModel(model)} ${year}г. до ${price}$`);
    }
    if (!price) return;

    const link = helpers.createLink(model, year, price, sort);
    if (link) await bot.sendMessage(chatId, `Поиск займет около ${count * time/60000} мин. Ждите!`);

    async function callApi() {
        try {
            // Processing response from API
            const response = await axios.get(link);

            if (response.data.length > 0) {
                const $ = cheerio.load(response.data);
                // Find UI button by css selector and parse string to looking for a number
                const foundAds = $('.filter__show-result')
                    .find('span').text()?.match(/\d+/);

                if (!foundAds) {
                    await bot.sendMessage(chatId, `Ничего не найденно!\nСледующий поиск будет через ${count * time/60000} мин.`);
                    count++;
                    return;
                }

                const tgModel = tg.context.data?.model;
                if (tg.context.data?.ads === foundAds[0] && tgModel === model) {
                    message = `Число найденных ads - ${foundAds[0]} для мотоцикла ${_brand.toUpperCase()} ${findModel(model)} не изменилось!\n`;
                    message += `Следующий поиск будет через ${count * time/60000} мин.`
                    count++;
                    await bot.sendMessage(chatId, message);
                    return;
                } else {
                    // Was changed ADS or Model - overwrite data
                    console.log('MODEL or ADS was changed !!!', tgModel, '|', model, '|', tg.context.data?.ads, '|', foundAds[0]);
                    tg.context.data = { ...tg.context.data, model, ads: foundAds[0] };
                }
                // find a link to ads in the TOP
                let topLink = $('.listing__top')
                    .find('.listing-top__title-link').attr('href');
                if (!topLink) {
                    message = `В ТОП-е не найдено объявлений.\n\n`;
                    topLink = $('.listing-item__about')
                        .find('.listing-item__link').attr('href');
                }

                message += `Найдено ${sort ? 'НОВЫХ' : 'акуальных'} объявлений: ${foundAds[0]}\n\n`
                message += `${baseUrl}${topLink}\n\n`;
                message += `Грид: ${link}\n\n`;
            }

            await bot.sendMessage(chatId, message);

        } catch (error) {
            count = 3;
            let err = 'Что-то пошло не так...\n';
            err += `Следующий поиск будет через ${count * time/60000} мин.\n\nЕсли хотите прервать поиск введите слово "off"`;
            await bot.sendMessage(chatId, err);
        }
    }

    const t = () => count * time;
    function startInterval() {
        intervalId = setInterval(() => {
            callApiWrapper();
        }, t());
    }

    function callApiWrapper() {
        callApi();
        clearInterval(intervalId); // Clear current interval
        startInterval(); // Start a new interval with updated count value
    }

    startInterval();
});