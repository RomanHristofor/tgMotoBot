const baseUrl = 'https://moto.av.by';
const filterUrl = `${baseUrl}/filter?category_type=1&brands[0][brand]=`;
const chunkModel = '&brands[0][model]=';
const chunkYear = '&brands[0][year][min]=';
const chunkPrice = '&price_usd[max]=';

const modelsSearch = [
    { brand: 'honda', model: ['cb'] },
    { brand: 'yamaha', model: ['xsr', 'xv'] },
    { brand: 'bmw', model: ['r', 's', 'k', 'g', 'f'] },
    { brand: 'hd', model: ['sg', 'cvo', 'soft', 'rg', 'fb', 'rk', 'ftb'] },
];
const nonClickableBrands = ['honda', 'yamaha', 'bmw', 'hd'];

const modelKeyboard = [
    {
        model: [
            { sg: 'Street Glide' },
            { cvo: 'CVO' },
            { soft: 'Softail' },
            { rg: 'Road Glide' },
            { fb: 'Fat Boy' },
            { rk: 'Road King' },
            { ftb: 'Fat Bob' },
        ]
    },
    {
        model: [{ r: 'R'}, { s: 'S' }, { k: 'K' }, { g: 'G' }, { f: 'F' }]
    },
    {
        model: [{ cb: 'CB' }]
    },
    {
        model: [{ xsr: 'XSR' }, { xv: 'XV' }]
    }
];

function findModel(model) {
    let k = model.toLowerCase();
    let foundModel = '-';
    modelKeyboard.find(i => i.model.find((m) => {
        if (m[k] !== undefined) {
            foundModel = m[k];
            return m[k];
        }
    }));
    return foundModel;
}

function isNumber(str) {
    return /^\d+$/.test(str);
}

function findModelByBrand(model) {
    const m = model.toLowerCase();
    if (!m || isNumber(m)) return false;
    if (nonClickableBrands.includes(m)) return m;//undefined;
    return modelsSearch.find(i => i.model?.includes(m))?.brand;
}



function createLink(model, year, price, sort) {
    let url = '';
    if (findModelByBrand(model) === 'honda') {
        url += `383`;
        if (model === 'cb') {
            url += `${chunkModel}2914`;
        }
    }
    if (findModelByBrand(model) === 'yamaha') {
        url += `2875`;
        if (model === 'xsr') {
            url += `${chunkModel}5704`;
        }
        if (model === 'xv') {
            url += `${chunkModel}4622`;
        }
    }
    if (findModelByBrand(model) === 'hd') {
        url += `2774`;
        if (model === 'sg') {
            url += `${chunkModel}5880`;
        }
        if (model === 'cvo') {
            url += `${chunkModel}3522`;
        }
        if (model === 'soft') {
            url += `${chunkModel}3524`;
        }
        if (model === 'rg') {
            url += `${chunkModel}5652`;
        }
        if (model === 'fb') {
            url += `${chunkModel}10025`;
        }
        if (model === 'rk') {
            url += `${chunkModel}5640`;
        }
        if (model === 'ftb') {
            url += `${chunkModel}10037`;
        }
    }
    if (findModelByBrand(model) === 'bmw') {
        url += `8`;
        if (model === 'r') {
            url += `${chunkModel}2910`
        }
        if (model === 's') {
            url += `${chunkModel}2912`
        }
        if (model === 'k') {
            url += `${chunkModel}2909`
        }
        if (model === 'f') {
            url += `${chunkModel}2905`
        }
        if (model === 'g') {
            url += `${chunkModel}2906`
        }
    }

    if (isNumber(model)) {
        // if model == number
        url += `${chunkYear}${model}`;
        if (year) url += `${chunkPrice}${year}`;
    } else {
        if (year) {
            url += `${chunkYear}${year}`;
        }
        if (price) {
            url += `${chunkPrice}${price}`;
        }
    }
    if (sort) {
        url += `&sort=4`;
    }
    return filterUrl + url;
}

module.exports = {
    createLink,
    findModel,
    findModelByBrand,
};