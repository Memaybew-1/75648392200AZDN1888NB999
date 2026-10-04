class SmartMarkov16 {
    constructor(dimension = 16) {
        this.dim = dimension;
        this.wordVectors = {}; 
        this.wordWeights = {}; 
        
        // Markov đa bậc (3 -> 2 -> 1)
        this.chain3 = {}; 
        this.chain2 = {}; 
        this.chain1 = {}; 
    }

    // --- BỘ HÀM TOÁN HỌC VECTOR (CỘNG, TRỪ, TỈ LỆ, KHOẢNG CÁCH) ---

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

    // 3. Nhân vector với một hằng số
    vectorMultiplyScalar(v, scalar) {
        let result = new Array(this.dim);
        for (let i = 0; i < this.dim; i++) {
            result[i] = v[i] * scalar;
        }
        return result;
    }

    // 4. Tính độ dài (Magnitude) của vector
    vectorMagnitude(v) {
        let sum = 0;
        for (let i = 0; i < this.dim; i++) {
            sum += v[i] * v[i];
        }
        return Math.sqrt(sum);
    }

    // 5. Tính độ tương đồng Cosine giữa 2 vector
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

    // --- KẾT THÚC HÀM TOÁN HỌC VECTOR ---

    initVector() {
        let vec = new Array(this.dim);
        for (let i = 0; i < this.dim; i++) {
            vec[i] = parseFloat(((Math.random() * 2) - 1).toFixed(4));
        }
        return vec;
    }

    // Huấn luyện Markov đa bậc
    train(dataSet) {
        dataSet.forEach(item => {
            let words = item.text.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").split(/\s+/).filter(w => w.length > 0);
            
            words.forEach(word => {
                if (!this.wordVectors[word]) {
                    this.wordVectors[word] = item.vector || this.initVector();
                    this.wordWeights[word] = item.weight || 0.5;
                }
            });
        });

        dataSet.forEach(item => {
            const words = item.text.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").split(/\s+/).filter(w => w.length > 0);
            if (words.length < 2) return;

            for (let i = 0; i < words.length; i++) {
                let weight = this.wordWeights[words[i]] || 0.0;
                let multiplier = weight > 0 ? Math.floor(weight * 3) + 1 : 1;

                // Bậc 1
                if (i < words.length - 1) {
                    let k1 = words[i];
                    let n1 = words[i+1];
                    if (!this.chain1[k1]) this.chain1[k1] = [];
                    for(let m=0; m<multiplier; m++) this.chain1[k1].push(n1);
                }

                // Bậc 2
                if (i < words.length - 2) {
                    let k2 = `${words[i]} ${words[i+1]}`;
                    let n2 = words[i+2];
                    if (!this.chain2[k2]) this.chain2[k2] = [];
                    for(let m=0; m<multiplier; m++) this.chain2[k2].push(n2);
                }

                // Bậc 3
                if (i < words.length - 3) {
                    let k3 = `${words[i]} ${words[i+1]} ${words[i+2]}`;
                    let n3 = words[i+3];
                    if (!this.chain3[k3]) this.chain3[k3] = [];
                    for(let m=0; m<multiplier; m++) this.chain3[k3].push(n3);
                }
            }
        });
        console.log("🚀 Đã train thành công với không gian Vector 16D và Markov đa bậc!");
    }

    // Sinh câu với cơ chế hạ bậc linh hoạt
    // Sinh câu trả lời thông minh: KHÔNG lặp lại nguyên câu của user ở đầu
    generate(seedWords, maxWords = 15) {
        let words = seedWords.toLowerCase().trim().split(/\s+/).filter(w => w.length > 0);
        if (words.length === 0) words = ["xin"];

        let result = [];
        let startKey = null;

        // 1. Cố gắng tìm chuỗi Markov khớp với từ cuối của user làm điểm xuất phát tự nhiên
        if (words.length >= 3) {
            let k3 = `${words[words.length-3]} ${words[words.length-2]} ${words[words.length-1]}`;
            if (this.chain3[k3] && this.chain3[k3].length > 0) {
                result = k3.split(' ');
                startKey = k3;
            }
        }
        if (!startKey && words.length >= 2) {
            let k2 = `${words[words.length-2]} ${words[words.length-1]}`;
            if (this.chain2[k2] && this.chain2[k2].length > 0) {
                result = k2.split(' ');
                startKey = k2;
            }
        }
        if (!startKey && words.length >= 1) {
            let k1 = words[words.length-1];
            if (this.chain1[k1] && this.chain1[k1].length > 0) {
                result = [k1];
                startKey = k1;
            }
        }

        // 2. Nếu không khớp từ nào, chọn ngẫu nhiên một từ khóa làm điểm bắt đầu mới hoàn toàn
        if (result.length === 0) {
            let allKeys1 = Object.keys(this.chain1);
            if (allKeys1.length === 0) return "Xin chào! Hãy dạy tôi thêm dữ liệu nhé.";
            let randomKey = allKeys1[Math.floor(Math.random() * allKeys1.length)];
            result.push(randomKey);
        }

        // 3. Tiếp tục sinh chuỗi tiếp theo từ điểm xuất phát độc lập đó
        for (let i = 0; i < maxWords; i++) {
            const len = result.length;
            let nextOptions = null;

            if (len >= 3) {
                let key3 = `${result[len-3]} ${result[len-2]} ${result[len-1]}`;
                if (this.chain3[key3] && this.chain3[key3].length > 0) nextOptions = this.chain3[key3];
            }
            if (!nextOptions && len >= 2) {
                let key2 = `${result[len-2]} ${result[len-1]}`;
                if (this.chain2[key2] && this.chain2[key2].length > 0) nextOptions = this.chain2[key2];
            }
            if (!nextOptions && len >= 1) {
                let key1 = result[len-1];
                if (this.chain1[key1] && this.chain1[key1].length > 0) nextOptions = this.chain1[key1];
            }

            if (!nextOptions || nextOptions.length === 0) {
                let allKeys1 = Object.keys(this.chain1);
                let randomKey = allKeys1[Math.floor(Math.random() * allKeys1.length)];
                nextOptions = this.chain1[randomKey];
            }

            let validOptions = nextOptions.filter(w => (this.wordWeights[w] || 0) >= -0.1);
            if (!validOptions.length) validOptions = nextOptions;

            const nextWord = validOptions[Math.floor(Math.random() * validOptions.length)];
            
            // Tránh lặp từ liên tục
            if (result[result.length - 1] === nextWord) continue;
            result.push(nextWord);
        }

        let finalSentence = result.join(' ');
        return finalSentence.charAt(0).toUpperCase() + finalSentence.slice(1) + '.';
    }
    
}

const ai = new SmartMarkov16(16);

// Khởi tạo chỉ dựa trên data.json và LocalStorage (ĐÃ XÓA SẠCH DEFAULT DATASET)
async function initApp() {
    let combinedData = [];
    try {
        const response = await fetch('data.json');
        const fileData = await response.json();
        if (Array.isArray(fileData) && fileData.length > 0) {
            combinedData = fileData.map(item => typeof item === 'string' ? { text: item } : item);
        }
    } catch (e) {
        console.log("File data.json trống hoặc chưa tải được.");
    }

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

// Giao diện & Xử lý sự kiện
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
    localStorage.setItem('user_learned_data', JSON.stringify(existingSaved));

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

// Nút tải file data.json xuất toàn bộ dữ liệu hiện có
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
