const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const { Telegraf } = require('telegraf');
const cheerio = require('cheerio');

const BOT_TOKEN = ``;
const tg = new Telegraf(BOT_TOKEN);

// Создаем бота и указываем его токен
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

let url = `https://moto.av.by/filter?category_type=`;

let intervalId;
let time = 3 * 60 * 1000;
let increase = 1;

const modelsSearch = [
    {brand: 'honda', model: ['cb']},
    {brand: 'bmw', model: ['r', 's', 'k']},
    {brand: 'hd', model: ['sg', 'cvo', 'soft', 'rg', 'fb', 'rk', 'fbob']},
];
const nonClickableBrands = ['honda', 'bmw', 'hd'];

const modelKeyboard = [
    {
        // brand: 'hd',
        model: [
            {sg: 'Street Glide'},
            {cvo: 'CVO'},
            {soft: 'Softail'},
            {rg: 'Road Glide'},
            {fb: 'Fat Boy'},
            {rk: 'Road King'},
            {fbob: 'Fat Bob'},
        ]
    },
    {
        // brand: 'bmw',
        model: [
            {r: 'R'},
            {s: 'S'},
            {k: 'K'},
        ]
    }
];

function isNumber(str) {
    return /^\d+$/.test(str);
}

function isFoundModelByBrand(model) {
    const m = model.toLowerCase();
    if (!m || isNumber(m)) return false;
    if (nonClickableBrands.includes(m)) return 0;
    return modelsSearch.find(i => i.model?.includes(m))?.brand;
}

function isFoundModelKeyboard(text) {
    let k = text.toLowerCase();
    let foundModel = '-';
    modelKeyboard.find(i => i.model.find((m) => {
        // if (/^hd rk$/.test(k)) {
        //     k = k.slice(3);
        // }
        if (m[k] !== undefined) {
            foundModel = m[k];
            return m[k];
        }
    }));
    return foundModel;
}

bot.onText(/\/start/, (msg) => {
    const keyboardBrands = {
        reply_markup: {
            keyboard: [
                ['Honda', { text: 'CB' }],
                ['BMW', { text: 'R' }, { text: 'S' }, { text: 'K' }],
                ['HD', { text: 'RK' }, { text: 'SG' }, { text: 'RG' }],
            ],
            one_time_keyboard: true,
            resize_keyboard: true,
        },
    };
    bot.sendMessage(msg.chat.id, 'Привет! Я бот, который поможет найти мотоцикл.\n' +
        'Выберите значение или введите текст!\nНапример: bmw s 2017 15000$', keyboardBrands);
});

bot.onText(/^(Honda|CB|BMW|[RSK]|HD|RK|SG|RG)$/, (msg) => {
    // Скрываем клавиатуру с брендами после выбора значения
    const hideKeyboardBrands = {
        reply_markup: {
            remove_keyboard: true,
        },
    };
    const yearKeyboard = {
        reply_markup: {
            keyboard: [
                [{ text: '2015'}, { text: '2016'}, { text: '2017'}, { text: '2018'}],
                [{ text: '2019'}, { text: '2020'}, { text: '2021'}, { text: '2022'}, { text: '2023'}],
            ],
            resize_keyboard: true,
        },
    };
    bot.sendMessage(msg.chat.id, `Вы выбрали ${msg.text}`, hideKeyboardBrands);
    bot.sendMessage(msg.chat.id, `Выберите год`, yearKeyboard);
    tg.context.data = { model: msg.text };
});

bot.onText(/^20(0[1-9]|[12]\d|23)$/, async (msg) => {
    const hideKeyboardYear = {
        reply_markup: {
            remove_keyboard: true,
        },
    };

    const buttonsPrice = [];
    for (let i = 5; i <= 28; i += 1) {
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
    // Удаление клавиатуру цен
    await bot.editMessageReplyMarkup(
        { inline_keyboard: [] },
        { chat_id: chatId, message_id: query.message.message_id }
    );
    await bot.sendMessage(
        chatId,
        `Вы выбрали цену: ${query.data}$`,
        // { reply_markup: { inline_keyboard: [] } }
    );

    tg.context.data.price = query.data;
    bot.emit('message', { chatId, data: tg.context.data });
});

// Обработчик сообщения с маркой мотоцикла
bot.on('message', async (msg) => {
    const chatId = msg.chat?.id || msg.chatId;
    let message = '';
    let model, year, price, sort;

    if (tg.context.data && tg.context.data?.price) {
        [model, year, price] = Object.values(tg.context.data);
    } else {
        [model, year, price, sort] = msg.text?.split(' ');
    }

    if (model) {
        model = model.toLowerCase();
        if (isFoundModelByBrand(model) === 0) {
            await bot.sendMessage(chatId, `Выберите модель ${model}! Введя команду "/start"`);
            return;
        }
    }
    if (model === '/start') {
        // console.log('START ==> clearInterval', intervalId);
        if (intervalId) clearInterval(intervalId);
        return;
    }

    if (model && year && price) {
        const _brand = isFoundModelByBrand(model).toUpperCase();
        await bot.sendMessage(chatId, `Поисщем мот ${_brand} ${isFoundModelKeyboard(model)} ${year}г. до ${price}$`);
    }
    console.log(chatId, '>>>> MAIN ', model, 'Y:', year, 'P:', price);
    if (!price) return;

    if (tg.context.data?.model && model && tg.context.data?.model !== model) {
        console.log(model, 'model CHANGED ---> clearInterval !!!', tg.context.data?.model);
        clearInterval(intervalId);
    }
    if (intervalId && model === 'reset') {
        console.log('---> clearInterval', tg.context.data);
        // tg.context.data = '';
        clearInterval(intervalId);
        return;
    }
    // if (model && !isFoundModelByBrand(model)) {
    //     message += `Ненайденная модель мотоцикла: ${model}\n`;
    //     bot.sendMessage(chatId, message);
    //     return;
    // }
    if (isFoundModelByBrand(model) === 'honda') {
        url += `1&brands[0][brand]=383`;
        if (model === 'cb') {
            url += `&brands[0][model]=2914`;
        }
    }
    if (isFoundModelByBrand(model) === 'hd') {
        url += `1&brands[0][brand]=2774`;
        if (model === 'sg') { // FLHX
            url += `&brands[0][model]=5880`;
        }
        if (model === 'cvo') {
            url += `&brands[0][model]=3522`;
        }
        if (model === 'soft') {
            url += `&brands[0][model]=3524`;
        }
        if (model === 'rg') {
            url += `&brands[0][model]=5652`;
        }
        if (model === 'fb') {
            url += `&brands[0][model]=10025`;
        }
        if (model === 'rk') {
            url += `&brands[0][model]=5640`;
        }
        if (model === 'fbob') {
            url += `&brands[0][model]=10037`;
        }
    }
    if (isFoundModelByBrand(model) === 'bmw') {
        url += `1&brands[0][brand]=8`;
        if (model === 'r') {
            url += `&brands[0][model]=2910`
        }
        if (model === 's') {
            url += `&brands[0][model]=2912`
        }
        if (model === 'k') {
            url += `&brands[0][model]=2909`
        }
    }

    if (isNumber(model)) {
        // if model == number
        url += `&brands[0][year][min]=${model}`;
        if (year) url += `&price_usd[max]=${year}`;
    } else {
        if (year) {
            url += `&brands[0][year][min]=${year}`;
        }
        if (price) {
            url += `&price_usd[max]=${price}`;
        }
    }
    if (sort) {
        url += `&sort=4`;
    }
    console.log('model ->', model.toUpperCase(), 'year:', year, 'price:', price, 'filter:', sort);

    if (url) await bot.sendMessage(chatId, `Поиск займет около ${increase * time/60000} мин. Ждите!`);
    console.log('URL ==>', url);

    async function callApi() {
        try {
            const response = await axios.get(url);
            // Формируем ответ пользователю
            if (response.data.length > 0) {
                const $ = cheerio.load(response.data);
                const foundAds = $('.filter__show-result')
                    .find('span').text()?.match(/\d+/);

                if (!foundAds) { // добавить проверку если не меняли бренд
                    console.log('Ничего не найденно!>>>>>>', tg.context.data);
                    message = `Ничего не найденно!`; // ${tg.context.data} => [object Object]
                    increase += 1;
                    await bot.sendMessage(chatId, message);
                    return;
                }
                const { ads } = tg.context.data || {};
                // если число найденный ads несовподает с сохраненными - формируем ответ
                if (ads === foundAds[0] && tg.context.data?.model === model) {
                    increase = 1;
                    console.log(typeof foundAds[0], tg.context?.data, '@@@@', foundAds[0], 'ads', ads);
                    // typeof foundAds[0] === string
                    const _brand = isFoundModelByBrand(model).toUpperCase();
                    message = `Число найденных ads: ${foundAds[0]} для мотоцикла: ${_brand} ${model.toUpperCase()} не изменилось!\n\n`;
                    await bot.sendMessage(chatId, message);
                    clearInterval(intervalId);
                    return;
                }
                if (model && foundAds[0] && (!tg.context?.data || tg.context.data?.model !== model)) {
                    console.log(tg.context?.data, '== Model CHANGED == ', foundAds[0], 'model', model);
                    tg.context.data = { model, ads: foundAds[0] };
                }

                let content = $('.listing__top')
                    .find('.listing-top__title-link').attr('href');
                if (!content) {
                    message = `В ТОП-е не найдено объявлений\n\n`;
                    content = $('.listing-item__about')
                        .find('.listing-item__link').attr('href');
                }

                const filter = sort ? 'НОВЫХ' : 'акуальных';
                message += `Найдено ${foundAds[0]} ${filter} объявлений\n\n`
                message += `moto.av.by${content}\n\n`;
                message += `Grid: ${url}`;
            }

            // Отправляем ответ пользователю
            await bot.sendMessage(chatId, message);
        } catch (error) {
            let err = 'Что-то пошло не так...\nПопробуйте выполнить новый поиск или введите слово "reset"';
            const $ = cheerio.load(error);
            err += $('.service__box').find('.service__title').text();
            console.log(err, 'ERROR ==> ', error);
            if (error?.data) {
                console.log('error -> ', error.data?.slice(0, 300));
            }
            await bot.sendMessage(chatId, err);
            // tg.context.data = '';
            // clearInterval(intervalId);
        }
    }
    intervalId = setInterval(callApi, increase * time);
});