// ai.js - Xử lý Vector Embedding và Markov Chain

const stopWords = new Set([
    "bạn", "tôi", "là", "và", "có", "không", "nhé", "thì", "mà", "cho", "với", 
    "được", "ngay", "à", "ơi", "gì", "chào", "hi", "hello", "alo", "ha"
]);

export function extractPivotWords(text) {
    let words = text.toLowerCase().replace(/[.,?!]/g, '').split(/\s+/);
    return words.filter(w => w.length > 1 && !stopWords.has(w));
}

export function generatePivotMarkovResponse(corpusSentences, pivotWords) {
    let markovMap = {};
    let validKeys = [];

    corpusSentences.forEach(sentence => {
        let words = sentence.trim().split(/\s+/);
        if (words.length < 3) return;

        for (let i = 0; i < words.length - 2; i++) {
            let key = words[i] + " " + words[i + 1];
            let nextWord = words[i + 2];

            if (!markovMap[key]) {
                markovMap[key] = [];
            }
            markovMap[key].push(nextWord);
            validKeys.push(key);
        }
    });

    if (validKeys.length === 0) return null;

    let selectedKey = null;
    for (let pivot of pivotWords) {
        let matchedKeys = validKeys.filter(k => k.toLowerCase().includes(pivot));
        if (matchedKeys.length > 0) {
            selectedKey = matchedKeys[Math.floor(Math.random() * matchedKeys.length)];
            break;
        }
    }

    if (!selectedKey) {
        selectedKey = validKeys[Math.floor(Math.random() * validKeys.length)];
    }

    let result = selectedKey.split(" ");
    let currentKey = selectedKey;
    let maxLength = 50;

    for (let i = 0; i < maxLength; i++) {
        let nextOptions = markovMap[currentKey];
        if (!nextOptions || nextOptions.length === 0) break;

        let nextWord = nextOptions[Math.floor(Math.random() * nextOptions.length)];
        result.push(nextWord);

        currentKey = result[result.length - 2] + " " + result[result.length - 1];

        if (/[.!?]$/.test(nextWord)) break;
    }

    let generatedText = result.join(" ");
    return generatedText.charAt(0).toUpperCase() + generatedText.slice(1);
}

export function cosineSimilarity(vecA, vecB) {
    let dotProduct = 0, normA = 0, normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    return (normA === 0 || normB === 0) ? 0.0 : dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
