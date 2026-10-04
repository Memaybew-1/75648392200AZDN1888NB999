class SmartMarkov16 {
    constructor(dimension = 16) {
        this.dim = dimension;
        this.wordVectors = {}; 
        this.wordWeights = {}; 
        this.chain = {};       
    }

// 1. Cộng hai vector (v1 + v2)
    vectorAdd(v1, v2) {
        let result = new Array(this.dim);
        for (let i = 0; i < this.dim; i++) {
            result[i] = v1[i] + v2[i];
        }
        return result;
    }

    // 2. Trừ hai vector (v1 - v2)
    vectorSubtract(v1, v2) {
        let result = new Array(this.dim);
        for (let i = 0; i < this.dim; i++) {
            result[i] = v1[i] - v2[i];
        }
        return result;
    }

    // 3. Nhân vector với một hằng số (scalar multiplication)
    vectorMultiplyScalar(v, scalar) {
        let result = new Array(this.dim);
        for (let i = 0; i < this.dim; i++) {
            result[i] = v[i] * scalar;
        }
        return result;
    }

    // 4. Tính độ dài (Magnitude / Norm) của vector
    vectorMagnitude(v) {
        let sum = 0;
        for (let i = 0; i < this.dim; i++) {
            sum += v[i] * v[i];
        }
        return Math.sqrt(sum);
    }

    // 5. Tính độ tương đồng Cosine giữa 2 vector (đo góc lệch hướng giữa 2 vector)
    cosineSimilarity(v1, v2) {
        let dotProduct = 0;
        let mag1 = 0;
        let mag2 = 0;
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

    // Gán 16 vector ngẫu nhiên từ -1.0 đến 1.0 cho từ độc lập
    initVector() {
        let vec = new Array(this.dim);
        for (let i = 0; i < this.dim; i++) {
            vec[i] = parseFloat(((Math.random() * 2) - 1).toFixed(4));
        }
        return vec;
    }

    // Đánh giá trọng số từ -1.0 đến 1.0
    calculateImportance(word, allWords) {
        if (word.length <= 2) return -0.3; // Từ ngắn, ít quan trọng
        let count = allWords.filter(w => w === word).length;
        let frequency = count / allWords.length;
        let weight = 1.0 - (frequency * 5);
        if (weight < -1.0) weight = -1.0;
        if (weight > 1.0) weight = 1.0;
        return parseFloat(weight.toFixed(2));
    }

    // Huấn luyện từ mảng dữ liệu (tách nhỏ câu thành các từ đơn)
    train(dataSet) {
        let allWordsFlatten = [];

        dataSet.forEach(item => {
            let words = item.text.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").split(/\s+/).filter(w => w.length > 0);
            allWordsFlatten.push(...words);
            
            // Gán vector 16 chiều cho từng từ tách rời nếu chưa có
            words.forEach(word => {
                if (!this.wordVectors[word]) {
                    this.wordVectors[word] = item.vector || this.initVector();
                    this.wordWeights[word] = item.weight || 0.5;
                }
            });
        });

        // Xây dựng chuỗi Markov bậc 3 dựa trên các từ đã tách
        dataSet.forEach(item => {
            const words = item.text.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").split(/\s+/).filter(w => w.length > 0);
            if (words.length < 4) return;

            for (let i = 0; i < words.length - 3; i++) {
                const key = `${words[i]} ${words[i+1]} ${words[i+2]}`;
                const nextWord = words[i+3];

                if (!this.chain[key]) this.chain[key] = [];
                
                let weight = this.wordWeights[nextWord] || 0.0;
                let multiplier = weight > 0 ? Math.floor(weight * 3) + 1 : 1;
                
                for (let m = 0; m < multiplier; m++) {
                    this.chain[key].push(nextWord);
                }
            }
        });
        console.log("🚀 Đã train xong Vector 16D và Markov bậc 3 với các từ được tách riêng!");
    }

    generate(seedWords, maxWords = 15) {
        let words = seedWords.toLowerCase().trim().split(/\s+/).filter(w => w.length > 0);
        if (words.length < 3) words = ["xin", "chào", "bạn"];

        let result = [...words];
        for (let i = 0; i < maxWords; i++) {
            const len = result.length;
            const key = `${result[len-3]} ${result[len-2]} ${result[len-1]}`;
            const nextOptions = this.chain[key];

            if (!nextOptions || !nextOptions.length) break;

            let validOptions = nextOptions.filter(w => (this.wordWeights[w] || 0) >= -0.1);
            if (!validOptions.length) validOptions = nextOptions;

            const nextWord = validOptions[Math.floor(Math.random() * validOptions.length)];
            result.push(nextWord);
        }

        let finalSentence = result.join(' ');
        return finalSentence.charAt(0).toUpperCase() + finalSentence.slice(1) + '.';
    }
}

// Dữ liệu mẫu ban đầu
const defaultDataSet = [
    {
        "text": "xin chào tôi là trợ lý ảo phiên bản di động",
        "vector": [0.05, -0.12, 0.08, 0.01, -0.03, 0.09, -0.07, 0.02, 0.04, -0.06, 0.11, -0.02, 0.05, -0.09, 0.03, -0.01],
        "weight": 0.8
    },
    {
        "text": "hôm nay giao diện trên điện thoại của bạn rất mượt mà",
        "vector": [-0.04, 0.07, -0.02, 0.11, -0.09, 0.03, 0.06, -0.05, 0.01, 0.08, -0.03, 0.04, -0.07, 0.02, -0.06, 0.10],
        "weight": 0.9
    }
];

const ai = new SmartMarkov16(16);

function initApp() {
    let combinedData = [...defaultDataSet];
    const savedLocalChats = localStorage.getItem('user_learned_data');
    if (savedLocalChats) {
        combinedData.push(...JSON.parse(savedLocalChats));
    }
    ai.train(combinedData);
}
initApp();

// --- XỬ LÝ GIAO DIỆN & LƯU INPUT VÀO DATA.JSON ---
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

    // Tạo đối tượng dữ liệu mới gồm text, vector 16 chiều ngẫu nhiên và trọng số
    const newItem = {
        text: text,
        vector: ai.initVector(),
        weight: 0.95
    };

    // Lưu vào LocalStorage
    let existingSaved = JSON.parse(localStorage.getItem('user_learned_data') || '[]');
    existingSaved.push(newItem);
    localStorage.setItem('user_learned_data', JSON.stringify(existingSaved));

    // Huấn luyện bổ sung ngay lập tức
    ai.train([newItem]);

    setTimeout(() => {
        let reply = ai.generate(text, 15);
        appendMessage('bot', reply);
    }, 400);
}

sendBtn.addEventListener('click', handleSend);
userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
});

// --- NÚT TẢI FILE DATA.JSON CHUẨN CẤU TRÚC ---
document.getElementById('download-json-btn').addEventListener('click', () => {
    let allDataToExport = [...defaultDataSet];
    const savedLocalChats = localStorage.getItem('user_learned_data');
    if (savedLocalChats) {
        JSON.parse(savedLocalChats).forEach(localItem => {
            if (!allDataToExport.some(item => item.text === localItem.text)) {
                allDataToExport.push(localItem);
            }
        });
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allDataToExport, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "data.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
});
