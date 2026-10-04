// Hàm tiện ích random khoảng số (đã bổ sung để chạy được randomRange)
function randomRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

class SmartMarkov16 {
    constructor(dimension = 16) {
        this.dim = dimension;
        this.wordVectors = {}; 
        this.wordWeights = {}; 
        this.wordUnusedCount = {}; // Thêm biến đếm số lần bị bỏ quên cho mỗi từ
        
        this.chain3 = {}; 
        this.chain2 = {}; 
        this.chain1 = {}; 
    }

    // --- TOÁN HỌC VECTOR ---
    vectorAdd(v1, v2) {
        let result = new Array(this.dim);
        for (let i = 0; i < this.dim; i++) result[i] = v1[i] + v2[i];
        return result;
    }

    vectorSubtract(v1, v2) {
        let result = new Array(this.dim);
        for (let i = 0; i < this.dim; i++) result[i] = v1[i] - v2[i];
        return result;
    }

    vectorMultiplyScalar(v, scalar) {
        let result = new Array(this.dim);
        for (let i = 0; i < this.dim; i++) result[i] = v[i] * scalar;
        return result;
    }

    vectorMagnitude(v) {
        let sum = 0;
        for (let i = 0; i < this.dim; i++) sum += v[i] * v[i];
        return Math.sqrt(sum);
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

    // Huấn luyện Markov đa bậc kèm quản lý trọng số động
    train(dataSet) {
        dataSet.forEach(item => {
            let words = item.text.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").split(/\s+/).filter(w => w.length > 0);
            
            words.forEach(word => {
                if (!this.wordVectors[word]) {
                    this.wordVectors[word] = item.vector || this.initVector();
                    this.wordWeights[word] = item.weight !== undefined ? item.weight : 0.5;
                } else {
                    this.wordWeights[word] = Math.min(1.0, this.wordWeights[word] + 0.02);
                }
            });
        });

        dataSet.forEach(item => {
            const words = item.text.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").split(/\s+/).filter(w => w.length > 0);
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
                    let k2 = `${words[i]} ${words[i+1]}`, n2 = words[i+2];
                    if (!this.chain2[k2]) this.chain2[k2] = [];
                    for(let m = 0; m < multiplier; m++) this.chain2[k2].push(n2);
                }

                // Bậc 3
                if (i < words.length - 3) {
                    let k3 = `${words[i]} ${words[i+1]} ${words[i+2]}`, n3 = words[i+3];
                    if (!this.chain3[k3]) this.chain3[k3] = [];
                    for(let m = 0; m < multiplier; m++) this.chain3[k3].push(n3);
                }
            }
        });
        console.log("🚀 Đã train xong với hệ thống Trọng số động (Dynamic Weight)!");
    }

    generate(seedWords, maxWords = randomRange(25, 50)) {
        let words = seedWords.toLowerCase().trim().split(/\s+/).filter(w => w.length > 0);
        if (words.length === 0) return "";

        let result = [];
        let startKey = null;

        if (words.length >= 3) {
            let k3 = `${words[words.length-3]} ${words[words.length-2]} ${words[words.length-1]}`;
            if (this.chain3[k3] && this.chain3[k3].length > 0) { result = k3.split(' '); startKey = k3; }
        }
        if (!startKey && words.length >= 2) {
            let k2 = `${words[words.length-2]} ${words[words.length-1]}`;
            if (this.chain2[k2] && this.chain2[k2].length > 0) { result = k2.split(' '); startKey = k2; }
        }
        if (!startKey && words.length >= 1) {
            let k1 = words[words.length-1];
            if (this.chain1[k1] && this.chain1[k1].length > 0) { result = [k1]; startKey = k1; }
        }

        if (result.length === 0) {
            return "...\n(Không tìm thấy dữ liệu liên kết phù hợp).";
        }

        for (let i = 0; i < maxWords; i++) {
            const len = result.length;
            let nextOptions = null;

            if (len >= 3) {
                let key3 = `${result[len-3]} ${result[len-2]}${result[len-1]}`;
                if (this.chain3[key3] && this.chain3[key3].length > 0) nextOptions = this.chain3[key3];
            }
            if (!nextOptions && len >= 2) {
                let key2 = `${result[len-2]}${result[len-1]}`;
                if (this.chain2[key2] && this.chain2[key2].length > 0) nextOptions = this.chain2[key2];
            }
            if (!nextOptions && len >= 1) {
                let key1 = result[len-1];
                if (this.chain1[key1] && this.chain1[key1].length > 0) nextOptions = this.chain1[key1];
            }

            if (!nextOptions || nextOptions.length === 0) {
                break; 
            }

            let validOptions = nextOptions.filter(w => (this.wordWeights[w] || 0.5) >= -0.1);
            if (!validOptions.length) validOptions = nextOptions;

            const nextWord = validOptions[Math.floor(Math.random() * validOptions.length)];
            
            if (this.wordWeights[nextWord] !== undefined) {
                this.wordWeights[nextWord] = Math.min(1.0, this.wordWeights[nextWord] + 0.03);
            }

            if (result[result.length - 1] === nextWord) break;
            result.push(nextWord);
        }

        let finalSentence = result.join(' ');
        return finalSentence.charAt(0).toUpperCase() + finalSentence.slice(1); //+ '.';
    }

    // --- ĐÃ ĐƯA HÀM DECAY VỀ ĐÚNG BÊN TRONG CLASS ---
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
} 
// ===============================================

const ai = new SmartMarkov16(16);

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
        weight: 0.95
    };

    let existingSaved = JSON.parse(localStorage.getItem('user_learned_data') || '[]');
    existingSaved.push(newItem);
    if (existingSaved.length > 500) existingSaved = existingSaved.slice(-500);
    localStorage.setItem('user_learned_data', JSON.stringify(existingSaved));

    ai.train([newItem]);

    setTimeout(() => {
        let reply = ai.generate(text, randomRange(15, 50));
        appendMessage('bot', reply);

        const turnText = text + " " + reply;
        const turnWords = turnText.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").split(/\s+/);
        ai.decayWeights(turnWords);
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
        chatContainer.innerHTML = '';
        ai = new SmartMarkov16(16);
        initApp();
        appendMessage('bot', "Đã quên hết lịch sử chat tạm! Tôi đã trở về trạng thái sạch sẽ.");
        console.log("🧹 Đã xóa sạch localStorage, bot đã 'quên' các dữ liệu chat vừa rồi!");
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

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allDataToExport, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "data.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
});
