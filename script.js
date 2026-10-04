function randomRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

class SmartMarkov16 {
    constructor(dimension = 16) {
        this.dim = dimension;
        this.wordVectors = {}; 
        this.wordWeights = {}; 
        this.wordUnusedCount = {}; 
        
        this.chain3 = {}; 
        this.chain2 = {}; 
        this.chain1 = {}; 
    }

    // --- TOÁN HỌC VECTOR 16D ---
    vectorAdd(v1, v2) {
        let result = new Array(this.dim);
        for (let i = 0; i < this.dim; i++) result[i] = v1[i] + v2[i];
        return result;
    }

    cosineSimilarity(v1, v2) {
        let dotProduct = 0, mag1 = 0, mag2 = 0;
        for (let i = 0; i < this.dim; i++) {
            dotProduct += v1[i] * v2[i];
            mag1 += v1[i] * v1[i];
            mag2 += v2[i] * v2[i];
        }
        mag1 = Math.sqrt(mag1);
        mag2 = Math.sqrt(mag2);
        if (mag1 === 0 || mag2 === 0) return 0;
        return dotProduct / (mag1 * mag2);
    }

    initVector() {
        let vec = new Array(this.dim);
        for (let i = 0; i < this.dim; i++) {
            vec[i] = parseFloat(((Math.random() * 2) - 1).toFixed(4));
        }
        return vec;
    }

    // Tính Vector đại diện cho cả một câu
    getSentenceVector(sentence) {
        let words = sentence.toLowerCase().replace(/[./#!$%^&*;:{}=\-_`~()]/g, "").split(/\s+/).filter(w => w.length > 0);
        let vec = new Array(this.dim).fill(0);
        let count = 0;
        words.forEach(w => {
            if (this.wordVectors[w]) {
                vec = this.vectorAdd(vec, this.wordVectors[w]);
                count++;
            }
        });
        return count > 0 ? vec : this.initVector();
    }

    train(dataSet) {
        dataSet.forEach(item => {
            let words = item.text.toLowerCase().replace(/[./#!$%^&*;:{}=\-_`~()]/g, "").split(/\s+/).filter(w => w.length > 0);
            
            words.forEach(word => {
                if (!this.wordVectors[word]) {
                    this.wordVectors[word] = item.vector || this.initVector();
                    this.wordWeights[word] = item.weight !== undefined ? item.weight : 0.5;
                }
            });
        });

        dataSet.forEach(item => {
            const words = item.text.toLowerCase().replace(/[./#!$%^&*;:{}=\-_`~()]/g, "").split(/\s+/).filter(w => w.length > 0);
            if (words.length < 2) return;

            for (let i = 0; i < words.length; i++) {
                let currentWeight = this.wordWeights[words[i]] || 0.5;
                let multiplier = Math.floor(currentWeight * 3) + 1;

                // Bậc 1
                if (i < words.length - 1) {
                    let k1 = words[i], n1 = words[i+1];
                    if (!this.chain1[k1]) this.chain1[k1] = [];
                    for(let m = 0; m < multiplier; m++) this.chain1[k1].push(n1);
                }

                // Bậc 2
                if (i < words.length - 2) {
                    let k2 = `${words[i]}${words[i+1]}`, n2 = words[i+2];
                    if (!this.chain2[k2]) this.chain2[k2] = [];
                    for(let m = 0; m < multiplier; m++) this.chain2[k2].push(n2);
                }

                // Bậc 3
                if (i < words.length - 3) {
                    let k3 = `${words[i]} ${words[i+1]}${words[i+2]}`, n3 = words[i+3];
                    if (!this.chain3[k3]) this.chain3[k3] = [];
                    for(let m = 0; m < multiplier; m++) this.chain3[k3].push(n3);
                }
            }
        });
    }

    // Sinh 1 câu đơn lẻ (Đã sửa lỗi nhại lại từ người dùng)
    generateSingle(seedWords, maxWords) {
        let words = seedWords.toLowerCase().trim().split(/\s+/).filter(w => w.length > 0);
        if (words.length === 0) return "";

        let history = []; // Lưu dấu để tra cứu Markov
        let result = [];  // Chứa câu sinh ra thực tế (không dính từ người dùng)
        
        let startNextOptions = null;

        if (words.length >= 3) {
            let k3 = `${words[words.length-3]} ${words[words.length-2]}${words[words.length-1]}`;
            if (this.chain3[k3] && this.chain3[k3].length > 0) {
                history = [words[words.length-3], words[words.length-2], words[words.length-1]];
                startNextOptions = this.chain3[k3];
            }
        }
        if (!startNextOptions && words.length >= 2) {
            let k2 = `${words[words.length-2]}${words[words.length-1]}`;
            if (this.chain2[k2] && this.chain2[k2].length > 0) {
                history = [words[words.length-2], words[words.length-1]];
                startNextOptions = this.chain2[k2];
            }
        }
        if (!startNextOptions && words.length >= 1) {
            let k1 = words[words.length-1];
            if (this.chain1[k1] && this.chain1[k1].length > 0) {
                history = [k1];
                startNextOptions = this.chain1[k1];
            }
        }

        if (!startNextOptions || startNextOptions.length === 0) return "";

        // Chọn từ đầu tiên của BOT (Không đưa từ của USER vào result)
        let firstWord = startNextOptions[Math.floor(Math.random() * startNextOptions.length)];
        result.push(firstWord);
        history.push(firstWord);

        for (let i = 1; i < maxWords; i++) {
            const hLen = history.length;
            let nextOptions = null;

            if (hLen >= 3) {
                let key3 = `${history[hLen-3]} ${history[hLen-2]}${history[hLen-1]}`;
                if (this.chain3[key3] && this.chain3[key3].length > 0) nextOptions = this.chain3[key3];
            }
            if (!nextOptions && hLen >= 2) {
                let key2 = `${history[hLen-2]}${history[hLen-1]}`;
                if (this.chain2[key2] && this.chain2[key2].length > 0) nextOptions = this.chain2[key2];
            }
            if (!nextOptions && hLen >= 1) {
                let key1 = history[hLen-1];
                if (this.chain1[key1] && this.chain1[key1].length > 0) nextOptions = this.chain1[key1];
            }

            if (!nextOptions || nextOptions.length === 0) break; 

            const nextWord = nextOptions[Math.floor(Math.random() * nextOptions.length)];
            
            if (result[result.length - 1] === nextWord) break;
            result.push(nextWord);
            history.push(nextWord);
        }

        let finalSentence = result.join(' ');
        return finalSentence ? finalSentence.charAt(0).toUpperCase() + finalSentence.slice(1) : "";
    }

    // Cơ chế TOP 3: Sinh 3 câu ứng viên, xếp hạng theo Cosine Similarity và chọn câu tốt nhất
    generateBestOf3(seedWords, maxWords = randomRange(15, 35)) {
        let candidates = [];
        let userVec = this.getSentenceVector(seedWords);

        // Sinh 3 câu ứng viên khác nhau
        for (let i = 0; i < 5 && candidates.length < 3; i++) {
            let sentence = this.generateSingle(seedWords, maxWords);
            if (sentence && !candidates.includes(sentence)) {
                candidates.push(sentence);
            }
        }

        if (candidates.length === 0) {
            return "...\n(Tôi chưa hiểu ý bạn lắm, hãy dạy thêm cho tôi nhé!).";
        }

        // Đánh giá điểm Cosine Similarity của từng câu ứng viên so với câu người dùng
        let scoredCandidates = candidates.map(candidate => {
            let candidateVec = this.getSentenceVector(candidate);
            let score = this.cosineSimilarity(userVec, candidateVec);
            return { sentence: candidate, score: score };
        });

        // Sắp xếp giảm dần theo điểm tương đồng
        scoredCandidates.sort((a, b) => b.score - a.score);

        // Chọn ngẫu nhiên 1 trong Top các câu có điểm cao nhất
        let topPick = scoredCandidates[0].sentence;
        return topPick;
    }

    decayWeights(currentTurnWords) {
        for (let word in this.wordWeights) {
            if (currentTurnWords.includes(word)) {
                this.wordUnusedCount[word] = 0;
            } else {
                this.wordUnusedCount[word] = (this.wordUnusedCount[word] || 0) + 1;
                if (this.wordUnusedCount[word] >= 5) {
                    this.wordWeights[word] = Math.max(0.0, this.wordWeights[word] - 0.01);
                    this.wordUnusedCount[word] = 0;
                }
            }
        }
    } 

    // Cập nhật các giá trị trong mảng Vector để các từ đi chung dịch lại gần nhau
    updateVectors(turnWords, learningRate = 0.05) {
        if (turnWords.length < 2) return;

        // Tính Vector trung bình của ngữ cảnh hiện tại
        let contextVec = this.getSentenceVector(turnWords.join(' '));

        turnWords.forEach(word => {
            if (this.wordVectors[word]) {
                // Công thức Vector Shift: v_new = v_old + learningRate * (contextVec - v_old)
                for (let i = 0; i < this.dim; i++) {
                    let diff = contextVec[i] - this.wordVectors[word][i];
                    this.wordVectors[word][i] = parseFloat((this.wordVectors[word][i] + learningRate * diff).toFixed(4));
                }
            }
        });
    }
}

let ai = new SmartMarkov16(16);

async function initApp() {
    let combinedData = [];
    try {
        const response = await fetch('data.json');
        const fileData = await response.json();
        if (Array.isArray(fileData) && fileData.length > 0) {
            combinedData = fileData.map(item => typeof item === 'string' ? { text: item } : item);
        }
    } catch (e) {}

    const savedLocalChats = localStorage.getItem('user_learned_data');
    if (savedLocalChats) {
        JSON.parse(savedLocalChats).forEach(localItem => {
            if (!combinedData.some(item => item.text === localItem.text)) {
                combinedData.push(localItem);
            }
        });
    }

    if (combinedData.length > 0) {
        ai.train(combinedData);
    }

    const savedWeights = localStorage.getItem('bot_word_weights');
    if (savedWeights) {
        const parsedWeights = JSON.parse(savedWeights);
        Object.assign(ai.wordWeights, parsedWeights);
    }
    
        // Tải bảng Vector đã được cập nhật từ localStorage
    const savedVectors = localStorage.getItem('bot_word_vectors');
    if (savedVectors) {
        const parsedVectors = JSON.parse(savedVectors);
        Object.assign(ai.wordVectors, parsedVectors);
    }
    
}
initApp();

const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

function appendMessage(sender, text) {
    const isUser = sender === 'user';
    const messageDiv = document.createElement('div');
    messageDiv.className = `flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`;

    messageDiv.innerHTML = `
        <div class="w-7 h-7 rounded-full ${isUser ? 'bg-[#2d2a26]' : 'bg-[#cc785c]'} flex items-center justify-center text-white shrink-0 font-bold text-xs">
            ${isUser ? 'U' : 'C'}
        </div>
        <div class="flex-1 space-y-1 ${isUser ? 'text-right' : ''}">
            <div class="font-semibold text-xs text-[#2d2a26]">${isUser ? 'Bạn' : 'Claude'}</div>
            <div class="text-sm text-[#3d3935] leading-relaxed ${isUser ? 'bg-[#e8e2d5]' : 'bg-[#f4f0ea]'} p-2.5 rounded-2xl ${isUser ? 'rounded-tr-sm' : 'rounded-tl-sm'} inline-block text-left">
                ${text}
            </div>
        </div>
    `;
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function handleSend() {
    const text = userInput.value.trim();
    if (!text) return;

    appendMessage('user', text);
    userInput.value = '';

    const newItem = {
        text: text,
        vector: ai.initVector(),
        weight: 0.8
    };

    let existingSaved = JSON.parse(localStorage.getItem('user_learned_data') || '[]');
    existingSaved.push(newItem);
    if (existingSaved.length > 500) existingSaved = existingSaved.slice(-500);
    localStorage.setItem('user_learned_data', JSON.stringify(existingSaved));

    ai.train([newItem]);

    setTimeout(() => {
        // Gọi hàm Top 3 để chọn câu trả lời hay nhất
        let reply = ai.generateBestOf3(text, randomRange(15, 35));
        appendMessage('bot', reply);

        const turnText = text + " " + reply;
        const turnWords = turnText.toLowerCase().replace(/[./#!$%^&*;:{}=\-_`~()]/g, "").split(/\s+/);
        ai.decayWeights(turnWords);
        localStorage.setItem('bot_word_weights', JSON.stringify(ai.wordWeights));

        ai.updateVectors(turnWords);
        localStorage.setItem('bot_word_vectors', JSON.stringify(ai.wordVectors));
        
    }, 400);
}

sendBtn.addEventListener('click', handleSend);
userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
});

const newChatBtn = document.getElementById('new-chat-btn'); 
if (newChatBtn) {
    newChatBtn.addEventListener('click', () => {
        localStorage.removeItem('user_learned_data');
        localStorage.removeItem('bot_word_weights');
        chatContainer.innerHTML = '';
        ai = new SmartMarkov16(16);
        initApp();
        appendMessage('bot', "Đã xóa lịch sử chat và reset trọng số!");
    });
}

document.getElementById('download-json-btn').addEventListener('click', async () => {
    let allDataToExport = [];
    try {
        const response = await fetch('data.json');
        const fileData = await response.json();
        if (Array.isArray(fileData)) {
            allDataToExport = fileData.map(item => typeof item === 'string' ? { text: item } : item);
        }
    } catch (e) {}

    const savedLocalChats = localStorage.getItem('user_learned_data');
    if (savedLocalChats) {
        JSON.parse(savedLocalChats).forEach(localItem => {
            if (!allDataToExport.some(item => item.text === localItem.text)) {
                allDataToExport.push(localItem);
            }
        });
    }

    allDataToExport = allDataToExport.map(item => {
        let words = item.text.toLowerCase().split(/\s+/);
        let avgWeight = words.reduce((acc, w) => acc + (ai.wordWeights[w] || 0.5), 0) / words.length;
        return {
            text: item.text,
            vector: item.vector || ai.initVector(),
            weight: parseFloat(avgWeight.toFixed(2))
        };
    });

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allDataToExport, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "data.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
});
