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
                    // Nếu item có weight riêng thì lấy, không thì mặc định 0.5
                    this.wordWeights[word] = item.weight !== undefined ? item.weight : 0.5;
                } else {
                    // Nếu từ đã tồn tại mà xuất hiện trong data mới, tăng nhẹ trọng số tần suất
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

    // Sinh câu và TỰ ĐỘNG TĂNG TRỌNG SỐ (Reinforcement) cho các từ được chọn
    generate(seedWords, maxWords = 15) {
        let words = seedWords.toLowerCase().trim().split(/\s+/).filter(w => w.length > 0);
        if (words.length === 0) words = ["xin"];

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
            let allKeys1 = Object.keys(this.chain1);
            if (allKeys1.length === 0) return "Xin chào! Hãy dạy tôi thêm dữ liệu nhé.";
            let randomKey = allKeys1[Math.floor(Math.random() * allKeys1.length)];
            result.push(randomKey);
        }

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

            let validOptions = nextOptions.filter(w => (this.wordWeights[w] || 0.5) >= -0.1);
            if (!validOptions.length) validOptions = nextOptions;

            const nextWord = validOptions[Math.floor(Math.random() * validOptions.length)];
            
            // CƠ CHẾ DYNAMIC WEIGHT: Mỗi khi từ này được bot chọn để nói, tăng nhẹ trọng số của nó lên!
            if (this.wordWeights[nextWord] !== undefined) {
                this.wordWeights[nextWord] = Math.min(1.0, this.wordWeights[nextWord] + 0.03);
            }

            if (result[result.length - 1] === nextWord) continue;
            result.push(nextWord);
        }

        let finalSentence = result.join(' ');
        return finalSentence.charAt(0).toUpperCase() + finalSentence.slice(1) + '.';
    }
}

const ai = new SmartMarkov16(16);

// Khởi tạo app
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
        weight: 0.95 // Khởi đầu cao cho câu người dùng vừa nhập
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

// --- NÚT XÓA BỘ NHỚ TẠM (QUÊN HẾT CHAT GẦN ĐÂY) ---
const newChatBtn = document.getElementById('new-chat-btn'); // Hoặc id của nút dấu cộng/nút xóa bạn đang dùng

if (newChatBtn) {
    newChatBtn.addEventListener('click', () => {
        // 1. Xóa sạch dữ liệu tự học tạm thời trong trình duyệt
        localStorage.removeItem('user_learned_data');
        
        // 2. Xóa sạch các khung tin nhắn đang hiển thị trên giao diện màn hình điện thoại
        chatContainer.innerHTML = '';
        
        // 3. Khởi tạo lại AI và chỉ nạp lại dữ liệu gốc từ file data.json trên Git
        ai = new SmartMarkov16(16);
        initApp();
        
        // Thêm một câu chào mặc định từ hệ thống trên màn hình cho sạch sẽ
        appendMessage('bot', "Đã quên hết lịch sử chat tạm! Tôi đã trở về trạng thái sạch sẽ.");
        
        console.log("🧹 Đã xóa sạch localStorage, bot đã 'quên' các dữ liệu chat vừa rồi!");
    });
}


// Nút tải file data.json xuất dữ liệu cùng weight mới nhất
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
                // Cập nhật lại weight mới nhất của từ/câu nếu có thay đổi
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
