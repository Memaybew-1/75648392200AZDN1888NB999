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

export async function loadPrecomputedEmbeddings() {
    try {
        let response = await fetch('embeddings.json');
        if (response.ok) {
            let data = await response.json();
            if (Array.isArray(data) && data.length > 0) return data;
        }
    } catch (e) {
        console.log("Chưa có sẵn tệp embeddings.json, tiến hành khởi tạo mới.");
    }
    return null;
}

export function scanEmbeddingRegion(userVector, embeddedKnowledge, threshold = 0.15, maxResults = 15) {
    if (!embeddedKnowledge || embeddedKnowledge.length === 0) return [];
    
    let regionalResults = [];
    for (let item of embeddedKnowledge) {
        let score = cosineSimilarity(userVector, item.vector);
        if (score >= threshold) {
            regionalResults.push({ text: item.text, vector: item.vector, score: score });
        }
    }

    regionalResults.sort((a, b) => b.score - a.score);
    return regionalResults.slice(0, maxResults);
}

// VIẾT LẠI: Tăng cường cơ chế trộn (mixing) chuỗi Markov từ nhiều câu mẫu
export function generatePivotMarkovResponse(corpus, pivotWords) {
    if (!corpus || corpus.length === 0) return null;
    
    try {
        let chain = {};
        // Xây dựng bảng liên kết từ tất cả các câu trong corpus (vùng quét)
        for (let sentence of corpus) {
            if (typeof sentence !== 'string') continue;
            let words = sentence.trim().split(/\s+/);
            for (let i = 0; i < words.length - 1; i++) {
                let w1 = words[i].toLowerCase();
                let w2 = words[i + 1];
                if (!chain[w1]) chain[w1] = [];
                // Tránh trùng lặp từ liên tiếp quá nhiều trong cùng một nhánh nếu muốn
                chain[w1].push(w2);
            }
        }

        let keys = Object.keys(chain);
        if (keys.length === 0) return null;

        // Chọn từ bắt đầu: Ưu tiên từ khóa pivot có trong bảng chain, nếu không chọn ngẫu nhiên
        let startWord = keys[Math.floor(Math.random() * keys.length)];
        if (pivotWords && pivotWords.length > 0) {
            let matchedPool = pivotWords.map(pw => pw.toLowerCase()).filter(pw => chain[pw]);
            if (matchedPool.length > 0) {
                startWord = matchedPool[Math.floor(Math.random() * matchedPool.length)];
            }
        }

        let result = [startWord];
        let current = startWord;
        let maxLen = 15; // Độ dài tối đa của câu sinh ra

        // Tiến hành sinh chuỗi dựa trên việc nhảy cóc qua lại giữa các lựa chọn từ
        for (let i = 0; i < maxLen; i++) {
            let nextOptions = chain[current];
            if (!nextOptions || nextOptions.length === 0) {
                // Nếu hết đường đi, bốc ngẫu nhiên một từ bất kỳ trong chain để tiếp tục trộn thay vì dừng hẳn
                let allKeys = Object.keys(chain);
                current = allKeys[Math.floor(Math.random() * allKeys.length)];
                nextOptions = chain[current];
                if (!nextOptions) break;
            }
            let nextWord = nextOptions[Math.floor(Math.random() * nextOptions.length)];
            
            // Tránh lặp lại từ vừa mới xuất hiện liên tiếp quá gần
            result.push(nextWord);
            current = nextWord.toLowerCase();

            // Dừng ngẫu nhiên nếu câu đã đủ dài (từ 6 từ trở lên) để tránh lặp vô tận
            if (result.length >= 6 && Math.random() < 0.25) break;
        }

        if (result.length < 3) return null; // Nếu chuỗi quá ngắn thì bỏ qua để fallback

        // Viết hoa chữ cái đầu tiên
        let finalSentence = result.join(" ");
        finalSentence = finalSentence.charAt(0).toUpperCase() + finalSentence.slice(1);
        
        return finalSentence;
    } catch (e) {
        console.error("Lỗi thuật toán Markov:", e);
        return null;
    }
}
