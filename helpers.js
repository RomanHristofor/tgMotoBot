// const baseUrl = 'https://www.mobile.de/ru/%D0%9C%D0%BE%D1%82%D0%BE%D1%86%D0%B8%D0%BA%D0%BB/'
const baseUrl = 'https://moto.av.by';
const site = baseUrl.includes('.de');
const filterUrl = site ? baseUrl : `${baseUrl}/filter?category_type=1&brands[0][brand]=`;
const chunkModel = site ? 'vhc:motorbike,srt:year,sro:desc,mke:' : '&brands[0][model]=';
const chunkYear = '&brands[0][year][min]=';
const chunkPrice = '&price_usd[max]=';

const BRAND = {
    APRILIA: 'aprilia',
    HONDA: 'honda',
    YAMAHA: 'yamaha',
    BMW: 'bmw',
    HD: 'hd',
};

const MODEL = {
    APRILIA_TUAREG: 'tuareg',
    APRILIA_RS: 'rs',
    HONDA_CB: 'cb',
    HONDA_TRANSALP: 'transalp',
    YAMAHA_XSR: 'xsr',
    YAMAHA_XV: 'xv',
    HD_SG: 'sg',
    HD_CVO: 'cvo',
    HD_SOFT: 'soft',
    HD_RG: 'rg',
    HD_FB: 'fb',
    HD_RK: 'rk',
    HD_FTB: 'ftb',
    BMW_R: 'r',
    BMW_S: 's',
    BMW_K: 'k',
    BMW_F: 'f',
    BMW_G: 'g',
};

const linkAbout = {
    transalp: 'https://bikeswiki.ru/Honda_XL700V_Transalp',
    tuareg: '',
}

const AVBY = {
    APRILIA: '2731',
    HONDA: '383',
    YAMAHA: '2875',
};

const MOBILEDE = {
    APRILIA_RS: '1500,mld:rs',
    TUAREG: '1500,mld:tuareg',
    HONDA_CB: '11000,mld:cb',
    TRANSALP: '11000,mld:transalp',
    YAMAHA_XSR: '26000,mld:xsr',
};

const modelsSearch = [
    { brand: 'aprilia', model: ['rs', 'tuareg'] },
    { brand: 'honda', model: ['cb', 'transalp'] },
    { brand: 'yamaha', model: ['xsr', 'xv'] },
    { brand: 'bmw', model: ['r', 's', 'k', 'g', 'f'] },
    { brand: 'hd', model: ['sg', 'cvo', 'soft', 'rg', 'fb', 'rk', 'ftb'] },
];
const nonClickableBrands = ['honda', 'yamaha', 'bmw', 'hd'];

const modelKeyboard = [
    {
        model: [{ rs: 'rs' }, { tuareg: 'tuareg' }]
    },
    {
        model: [{ cb: 'cb' }, { transalp: 'transalp' }]
    },
    {
        model: [{ xsr: 'xsr' }, { xv: 'xv' }]
    },
    {
        model: [{ r: 'r'}, { s: 's' }, { k: 'k' }, { g: 'g' }, { f: 'f' }]
    },
    {
        model: [
            { sg: 'street glide' }, { cvo: 'cvo' },
            { soft: 'softail' }, { rg: 'road glide' },
            { fb: 'fat boy' }, { rk: 'road king' },
            { ftb: 'fat bob' }
        ]
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
    if (nonClickableBrands.includes(m)) return m;
    return modelsSearch.find(i => i.model?.includes(m))?.brand;
}

function createLink(model, year, price, sort) {
    let url = '';
    if (findModelByBrand(model) === BRAND.APRILIA) {
        if (model === MODEL.APRILIA_TUAREG) {
            url += site ? `${model}/${chunkModel}${MOBILEDE.TUAREG}` : '';
        }
        if (model === MODEL.APRILIA_RS) {
            url += site ? `${model}/${chunkModel}${MOBILEDE.APRILIA_RS}`  : `${AVBY.APRILIA}${chunkModel}3118`;
        }
    }
    if (findModelByBrand(model) === BRAND.HONDA) {
        if (model === MODEL.HONDA_CB) {
            url += site ? `${model}/${chunkModel}${MOBILEDE.HONDA_CB}` : `${AVBY.HONDA}${chunkModel}2914`;
        }
        if (model === MODEL.HONDA_TRANSALP) {
            url += site ? `${model}/${chunkModel}${MOBILEDE.TRANSALP}` : `${AVBY.HONDA}${chunkModel}5647`;
        }
    }
    if (findModelByBrand(model) === BRAND.YAMAHA) {
        url += site ? MOBILEDE.YAMAHA : AVBY.YAMAHA;
        if (model === MODEL.YAMAHA_XSR) {
            url += site ? `${model}` : `${chunkModel}5704`;
        }
        if (model === MODEL.YAMAHA_XV) {
            url += `${chunkModel}4622`;
        }
    }
    if (findModelByBrand(model) === BRAND.HD) {
        url += `2774`;
        if (model === MODEL.HD_SG) {
            url += `${chunkModel}5880`;
        }
        if (model === MODEL.HD_CVO) {
            url += `${chunkModel}3522`;
        }
        if (model === MODEL.HD_SOFT) {
            url += `${chunkModel}3524`;
        }
        if (model === MODEL.HD_RG) {
            url += `${chunkModel}5652`;
        }
        if (model === MODEL.HD_FB) {
            url += `${chunkModel}10025`;
        }
        if (model === MODEL.HD_RK) {
            url += `${chunkModel}5640`;
        }
        if (model === MODEL.HD_FTB) {
            url += `${chunkModel}10037`;
        }
    }
    if (findModelByBrand(model) === BRAND.BMW) {
        url += `8`;
        if (model === MODEL.BMW_R) {
            url += `${chunkModel}2910`
        }
        if (model === MODEL.BMW_S) {
            url += `${chunkModel}2912`
        }
        if (model === MODEL.BMW_K) {
            url += `${chunkModel}2909`
        }
        if (model === MODEL.BMW_F) {
            url += `${chunkModel}2905`
        }
        if (model === MODEL.BMW_G) {
            url += `${chunkModel}2906`
        }
    }

    if (isNumber(model)) {
        // if model == number
        url += `${chunkYear}${model}`;
        if (year) url += `${chunkPrice}${year}`;
    } else {
        if (year) {
            url += site ? `,frn:${year}` : `${chunkYear}${year}`;
        }
        if (price) {
            url += site ? `,prn:1000,prx:${price}`: `${chunkPrice}${price}`;
        }
    }
    if (sort) {
        url += `&sort=4`;
    }
    return filterUrl + url;
}

module.exports = {
    baseUrl,
    linkAbout,
    createLink,
    findModel,
    findModelByBrand,
};