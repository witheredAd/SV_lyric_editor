import { assert } from "./ts-assert"

type TWordConfig = {
    type: 'latin' | 'WS' | 'singular' | 'continuous' | 'other',
    data: string,
}

const tokenRegex = /^((?<latin>[A-Za-zÀ-ÖØ-öø-įĴ-őŔ-žǍ-ǰǴ-ǵǸ-țȞ-ȟȤ-ȳɃɆ-ɏḀ-ẞƀ-ƓƗ-ƚƝ-ơƤ-ƥƫ-ưƲ-ƶẠ-ỿ]+)|(?<WS>[ \t\n]+)|(?<singular>\p{sc=Hangul}|\p{sc=Hiragana}|\p{sc=Katakana}|\p{sc=Han})|(?<continuous>\+|-))/u

const groupFetcher = (group: Record<string, string>) => 
(groupName: TWordConfig['type']): TWordConfig | undefined => {
    if (group[groupName]) {
        return {
            type: groupName,
            data: group[groupName]
        }
    }
    return undefined
}

const getFirstWord = (lyric: string): TWordConfig => {
    const res = tokenRegex.exec(lyric)
    if (!res) {
        return {
            type: "other",
            data: lyric[0],
        }
    }

    assert (res.groups !== undefined)
    const fetchGroup = groupFetcher(res.groups)
    return (
        fetchGroup('latin')
    ??  fetchGroup('WS')
    ??  fetchGroup('singular')
    ??  fetchGroup('continuous')
    )!!
}

export const splitLyric = (lyric: string): string[] => {
    const wordList: string[] = []
    while (lyric != '') {
        const word = getFirstWord(lyric)
        lyric = lyric.slice(word.data.length)
        if (word.type === 'WS') { continue; }
        
        wordList.push(word.data)
    }
    return wordList
}

const isLatinRegex = /^[A-Za-zÀ-ÖØ-öø-įĴ-őŔ-žǍ-ǰǴ-ǵǸ-țȞ-ȟȤ-ȳɃɆ-ɏḀ-ẞƀ-ƓƗ-ƚƝ-ơƤ-ƥƫ-ưƲ-ƶẠ-ỿ]+$/u
export const isLatin = (lyric: string) => isLatinRegex.test(lyric)

const isContinuousRegex = /^\+|-$/u
export const isContinuous = (lyric: string) => isContinuousRegex.test(lyric)