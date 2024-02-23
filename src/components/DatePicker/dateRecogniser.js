const languages = {
    en: {
        monthNames: [
            "january", "february", "march",
            "april", "may", "june",
            "july", "august", "september",
            "october", "november", "december"
        ],

        /**
         * Lists the irregular ordinal abbreviations. In English the most common suffix is "th", from 4th onwards.
         * 1st, 2nd and 3rd are irregular.
         * To use this take the number in question, and if it ends with any of these numbers, then use that suffix.
         * If not, use the default suffix.
         * 11, 12 and 13 are included (despite being equal to the default) to prevent numbers which end in 11, 12 or 13
         * being interpreted as ending in 1, 2 or 3. They should therefore be checked first.
         */
        ordinals: {
            11: 'th',
            12: 'th',
            13: 'th',
            1: 'st',
            2: 'nd',
            3: 'rd',
            'default': 'th'
        },

        uniqueOrdinalSuffixes: [ 'st', 'nd', 'rd', 'th' ]
    }
};

const patterns = [
    { sequence: ['date', 'separator', 'month', 'separator', 'year'], quality: 3 },
    { sequence: ['month', 'separator', 'date', 'separator', 'year'], quality: 3 },
    { sequence: ['year', 'separator', 'month', 'separator', 'date'], quality: 3 },
    { sequence: ['month', 'date', 'year'], quality: 3 },
    { sequence: ['date', 'month', 'year'], quality: 3 },
    { sequence: ['year', 'month', 'date'], quality: 3 },
    { sequence: ['date', 'separator', 'month'], quality: 2 },
    { sequence: ['month', 'separator', 'date'], quality: 2 },
    { sequence: ['date', 'month'], quality: 2 },
    { sequence: ['month', 'date'], quality: 2 },
    { sequence: ['date'], quality: 1},
];

const tokenTypes = {
    date: (str, lang) => {
        const regex = new RegExp(`^(?<number>[0-9]+)(?<suffix>${lang.uniqueOrdinalSuffixes.join('|')})?$`)
        const matches = str.match(regex);
        if (matches?.groups?.number <= 31) {
            return parseInt(matches?.groups?.number);
        } else {
            return false;
        }
    },

    month: (str, lang) => {
        if (/^[0-9]+$/.test(str) && str >=1 && str <=12) {
            return parseInt(str);
        } else {
            if ([...str].length < 3) return false;
            str = str.toLowerCase();
            for (let i=0; i<lang.monthNames.length; i++) {
                if (lang.monthNames[i].startsWith(str)) return i+1;
            }
        }
        return false;
    },

    year: (str, lang) => {
        if (!/^[0-9]+$/.test(str)) return false;
        const digitCount = [...str].length;
        if (digitCount === 2) {
            return 2000 + parseInt(str);
        } else if (digitCount === 4) {
            return parseInt(str);
        } else {
            return false;
        }
    },

    separator: (str, lang) => {
        return /^([-/.])$/.test(str) ? "" : false;
    },

    whitespace: (str, lang) => {
        return /^(\s+)$/.test(str) ? "" : false;
    },
};
// TODO: would be nice to have keyword support, for things like today, Friday, next Tuesday

export function tokenise(str) {
    return str.split(/([\s-\/.,;:'"_+=|\\\[\]{}<>!@#$%^&*()]+)/);
}

export function getTokenTypes(str, langName='en') {
    const lang = languages[langName];
    const token = { token: str, analysis: [] };
    for (const [type, fn] of Object.entries(tokenTypes)) {
        const result = fn(str, lang);
        if (result !== false) {
            token.analysis.push({ type: type, interpretation: result });
        }
    }
    return token;
}

export function getAnalysedTokenList(str) {
    const tokens = tokenise(str);
    return tokens
        .map((token) => getTokenTypes(token))
        .reduce(
            (list, token) => {
                let justWhitespace = true;
                for (let i=0; i<token.analysis.length; i++) {
                    if (token.analysis[i].type !== 'whitespace') {
                        justWhitespace = false;
                    }
                }

                if (!justWhitespace) list.push(token);
                return list;
            },
            []
        );
}

export function extractDate(str) {
    const tokenList = getAnalysedTokenList(str);
    let bestQuality = 0;

    let output = [];
    for (const pattern of patterns) {
        const today = new Date();
        let date = today.getDate();
        let month= today.getMonth()+1;
        let year= today.getFullYear();
        let dateUsed = false
        let monthUsed = false;
        let yearUsed = false;

        let tokenListPtr = 0;
        let patternTokenPtr = 0;

        while (tokenListPtr < tokenList.length && patternTokenPtr < pattern.sequence.length) {
            let found = false;
            for (const analysis of tokenList[tokenListPtr].analysis) {
                if (analysis.type === pattern.sequence[patternTokenPtr]) {
                    switch (analysis.type) {
                        case 'date':  if (!dateUsed)  { date =  analysis.interpretation; dateUsed = true; } break;
                        case 'month': if (!monthUsed) { month = analysis.interpretation; monthUsed = true; } break;
                        case 'year':  if (!yearUsed)  { year =  analysis.interpretation; yearUsed = true; } break;
                    }

                    tokenListPtr++;
                    patternTokenPtr++;
                    found = true;
                    break;
                }
            }
            if (!found) {
                tokenListPtr++;
                patternTokenPtr = 0;
            }
        }

        if (patternTokenPtr === pattern.sequence.length) {
            const result = `${year}-${twoDigitPad(month)}-${twoDigitPad(date)}`;
            if (pattern.quality === bestQuality) {
                if (!output.includes(result)) {
                    output.push(result);
                }
            } else if (pattern.quality > bestQuality) {
                output = [ result ];
                bestQuality = pattern.quality;
            }
        }
    }

    return output;
}

function twoDigitPad(num) {
    return (num>9) ? num : "0"+num;
}