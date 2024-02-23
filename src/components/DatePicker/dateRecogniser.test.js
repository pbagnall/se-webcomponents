import 'jest';
import '@jest/globals';
import {tokenise, extractDate, getTokenTypes} from "./dateRecogniser.js";


describe("tokeniser", () => {
    test.each([
        ["a string with spaces", "a string with spaces", ["a", " ", "string", " ", "with", " ", "spaces"]],
        ["date with dashes", "21-12-2033", ["21", "-", "12", "-", "2033"]],
        ["date with spaces", "12th Jan 2023", ["12th", " ", "Jan", " ", "2023"]],
        ["date with slashes", "12/Jan/2023", ["12", "/", "Jan", "/", "2023"]],
        ["date in complex string", "12*^and@2023 then&Jan", ["12", "*^", "and", "@", "2023", " ", "then", "&", "Jan"]]
    ])('%s', (description, str, expectedTokens) => {
        expect(tokenise(str)).toStrictEqual(expectedTokens);
    });
});

function matchTokenTypes(description, token, expectedType) {
    const tokenAnalysis = getTokenTypes(token).analysis;
    expect(tokenAnalysis).toEqual(expectedType);
}
describe("match token types", () => {
    describe("numbers", () => {
        test.each([
            ["negative number", "-08", []],

            ["date, month or year", "12", [
                { type: "date",  interpretation: 12   },
                { type: "month", interpretation: 12   },
                { type: "year",  interpretation: 2012 },
            ]],

            ["date, month or year", "09", [
                { type: "date",  interpretation: 9    },
                { type: "month", interpretation: 9    },
                { type: "year",  interpretation: 2009 },
            ]],

            ["year", "45", [
                { type: "year", interpretation: 2045 }
            ]],

            ["year", "2035", [
                {type: "year", interpretation: 2035}
            ]],

            ["unknown", "145", []],
        ])('%s %s', matchTokenTypes);
    });

    describe("ordinals", () => {
        test.each([
            ["ordinal", "1st",   [{ type: "date", interpretation: 1  }]],
            ["ordinal", "2nd",   [{ type: "date", interpretation: 2  }]],
            ["ordinal", "3rd",   [{ type: "date", interpretation: 3  }]],
            ["ordinal", "4th",   [{ type: "date", interpretation: 4  }]],
            ["ordinal", "11th",  [{ type: "date", interpretation: 11 }]],
            ["ordinal", "12th",  [{ type: "date", interpretation: 12 }]],
            ["ordinal", "13th",  [{ type: "date", interpretation: 13 }]],
            ["ordinal", "14th",  [{ type: "date", interpretation: 14 }]],
            ["ordinal", "21st",  [{ type: "date", interpretation: 21 }]],
            ["ordinal", "22nd",  [{ type: "date", interpretation: 22 }]],
            ["ordinal", "23rd",  [{ type: "date", interpretation: 23 }]],
            ["ordinal", "24th",  [{ type: "date", interpretation: 24 }]],
            ["ordinal", "121st", []],
            ["ordinal", "122nd", []],
        ])('%s %s', matchTokenTypes);
    });

    describe("months", () => {
        test.each([
            ["month", "March", [{ type: "month", interpretation: 3 }]],
            ["month", "MARCH", [{ type: "month", interpretation: 3 }]],
            ["month", "march", [{ type: "month", interpretation: 3 }]],
            ["month", "Mar",   [{ type: "month", interpretation: 3 }]],
            ["month", "MAR",   [{ type: "month", interpretation: 3 }]],
            ["month", "mar",   [{ type: "month", interpretation: 3 }]],
            ["month", "marc",  [{ type: "month", interpretation: 3 }]],
        ])('%s %s', matchTokenTypes);
    });

    describe("separators", () => {
        test.each([
            ["separator", "/", [{ type: "separator", interpretation: ''}]],
            ["separator", "-", [{ type: "separator", interpretation: ''}]],
        ])('%s %s', matchTokenTypes);
    });

    describe("whitespace", () => {
        test.each([
            ["separator (space)", " ",            [{ type: "whitespace", interpretation: ''}]],
            ["separator (multiple spaces)", "  ", [{ type: "whitespace", interpretation: ''}]],
        ])('%s %s', matchTokenTypes);
    });

    describe("unknown", () => {
        test.each([
            ["unknown", "//",        []],
            ["unknown", "--",        []],
            ["unknown", "gibberish", []],
        ])('%s %s', matchTokenTypes);
    });
});

describe("extractDate", () => {
    const thisYear = new Date().getFullYear();
    let thisMonth = new Date().getMonth()+1;
    thisMonth = thisMonth>9 ? thisMonth : "0"+thisMonth;

    test.each([
        ["12th July 2023", ["2023-07-12"]],
        ["22/7/2023", ["2023-07-22"]],
        ["7/8/2023", ["2023-07-08", "2023-08-07"]],
        ["On the 22nd of July, 2023", ["2023-07-22"]],
        ["On the 22nd day of the month of July in the Year of our Lord, 1876", ["1876-07-22"]],
        ["7/8", [`${thisYear}-07-08`, `${thisYear}-08-07`]],
        ["7", [`${thisYear}-${thisMonth}-07`]],
    ])('%s', (input, expected) => {
        expect(extractDate(input).sort()).toStrictEqual(expected)
    });
});