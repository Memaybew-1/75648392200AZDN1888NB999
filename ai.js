export function cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function extractPivotWords(text) {
    if (!text || typeof text !== 'string') return [];
    const stopWords = new Set(['là', 'và', 'của', 'có', 'các', 'những', 'trong', 'cho', 'với', 'được', 'về', 'không', 'ạ', 'nhé', 'nha']);
    let words = text.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, "").split(/\s+/);
    return words.filter(w => w.length > 1 && !stopWords.has(w));
}

export function generatePivotMarkovResponse(corpus, pivotWords) {
    if (!corpus || corpus.length === 0) return null;
    
    try {
        let chain = {};
        for (let sentence of corpus) {
            if (typeof sentence !== 'string') continue;
            let words = sentence.split(/\s+/);
            for (let i = 0; i < words.length - 1; i++) {
                let w1 = words[i].toLowerCase();
                let w2 = words[i + 1];
                if (!chain[w1]) chain[w1] = [];
                chain[w1].push(w2);
            }
        }

        let keys = Object.keys(chain);
        if (keys.length === 0) return null;

        let startWord = keys[Math.floor(Math.random() * keys.length)];
        if (pivotWords && pivotWords.length > 0) {
            let matched = pivotWords.find(pw => chain[pw.toLowerCase()]);
            if (matched) startWord = matched.toLowerCase();
        }

        if (!chain[startWord]) return null;

        let result = [startWord.charAt(0).toUpperCase() + startWord.slice(1)];
        let current = startWord;
        let maxLen = 12;

        for (let i = 0; i < maxLen; i++) {
            let nextOptions = chain[current];
            if (!nextOptions || nextOptions.length === 0) break;
            let nextWord = nextOptions[Math.floor(Math.random() * nextOptions.length)];
            result.push(nextWord);
            current = nextWord.toLowerCase();
        }

        let finalSentence = result.join(" ");
        if (!finalSentence.endsWith(".")) finalSentence += ".";
        return finalSentence;
    } catch (e) {
        console.error("Lỗi thuật toán Markov:", e);
        return null;
    }
}
