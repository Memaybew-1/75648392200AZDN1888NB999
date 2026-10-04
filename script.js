// --- LỚP XỬ LÝ AI CỤC BỘ (Vector 16D + Weight + Markov 3) ---
class SmartMarkov16 {
    constructor(dimension = 16) {
        this.dim = dimension;
        this.wordVectors = {}; 
        this.wordWeights = {}; 
        this.chain = {};       
    }

    // Tự động tính trọng số quan trọng (-1.0 đến 1.0)
    calculateImportance(word, allWords) {
        if (word.length <= 2) return -0.4; // Từ quá ngắn -> ưu tiên thấp
        let count = allWords.filter(w => w === word).length;
        let frequency = count / allWords.length;
        let weight = 1.0 - (frequency * 6);
        if (weight < -1.0) weight = -1.0;
        if (weight > 1.0) weight = 1.0;
        return parseFloat(weight.toFixed(2));
    }

    initVector() {
        let vec = new Array(this.dim);
        for (let i = 0; i < this.dim; i++) {
            vec[i] = (Math.random() * 2 - 1) * 0.1;
        }
        return vec;
    }

    // Huấn luyện từ dữ liệu mẫu
    train(texts) {
        let allWordsFlatten = [];
        texts.forEach(text => {
            let words = text.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").split(/\s+/);
            allWordsFlatten.push(...words);
        });

        allWordsFlatten.forEach(word => {
            if (!this.wordVectors[word]) {
                this.wordVectors[word] = this.initVector();
                this.wordWeights[word] = this.calculateImportance(word, allWordsFlatten);
            }
        });

        texts.forEach(text => {
            const words = text.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").split(/\s+/);
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
        console.log("✅ Đã train xong Vector 16 chiều và Markov bậc 3 trên trình duyệt!");
    }

    // Sinh câu trả lời dựa trên lọc trọng số
    generate(seedWords, maxWords = 18) {
        let words = seedWords.toLowerCase().trim().split(/\s+/);
        if (words.length < 3) words = ["xin", "chào", "bạn"];

        let result = [...words];
        for (let i = 0; i < maxWords; i++) {
            const len = result.length;
            const key = `${result[len-3]} ${result[len-2]} ${result[len-1]}`;
            const nextOptions = this.chain[key];

            if (!nextOptions || nextOptions.length === 0) break;

            // Lọc bỏ các từ rác có trọng số thấp/âm để tránh sai sót
            let validOptions = nextOptions.filter(w => (this.wordWeights[w] || 0) >= -0.1);
            if (validOptions.length === 0) validOptions = nextOptions;

            const nextWord = validOptions[Math.floor(Math.random() * validOptions.length)];
            result.push(nextWord);
        }

        let finalSentence = result.join(' ');
        return finalSentence.charAt(0).toUpperCase() + finalSentence.slice(1) + '.';
    }
}

// --- DỮ LIỆU HUẤN LUYỆN MẪU ---
const trainingCorpus = [
    "Xin chào tôi là trợ lý ảo phiên bản di động chạy bằng vector mười sáu chiều.",
    "Hôm nay giao diện trên điện thoại của bạn trông rất mượt mà và ấm áp.",
    "Trí tuệ nhân tạo cục bộ giúp bảo mật tuyệt đối thông tin cá nhân của bạn.",
    "Chuỗi Markov bậc 3 dự đoán từ tiếp theo cực kỳ chính xác dựa trên ngữ cảnh.",
    "Lập trình web di động ngày càng trở nên mạnh mẽ và tiện lợi hơn bao giờ hết."
];

// Khởi tạo mô hình AI chạy ngầm
const ai = new SmartMarkov16(16);
ai.train(trainingCorpus);

// --- XỬ LÝ GIAO DIỆN CHAT ---
const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

function appendMessage(sender, text) {
    const isUser = sender === 'user';
    const messageDiv = document.createElement('div');
    messageDiv.className = `flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`;

    messageDiv.innerHTML = `
        <div class="w-8 h-8 rounded-full ${isUser ? 'bg-[#2d2a26]' : 'bg-[#cc785c]'} flex items-center justify-center text-white shrink-0 font-bold text-sm">
            ${isUser ? 'U' : 'C'}
        </div>
        <div class="flex-1 space-y-1 ${isUser ? 'text-right' : ''}">
            <div class="font-semibold text-sm text-[#2d2a26]">${isUser ? 'Bạn' : 'Claude'}</div>
            <div class="text-sm text-[#3d3935] leading-relaxed ${isUser ? 'bg-[#e8e2d5]' : 'bg-[#f4f0ea]'} p-3 rounded-2xl ${isUser ? 'rounded-tr-sm' : 'rounded-tl-sm'} inline-block text-left">
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
    userInput.style.height = 'auto';

    // Giả lập độ trễ suy nghĩ nhỏ cho tự nhiên
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

// --- THÊM TÍNH NĂNG TẢI FILE DATA.JSON VỀ MÁY ---
async function downloadDataJson() {
    let allDataToExport = [];

    // 1. Lấy dữ liệu gốc từ file data.json (nếu có thể fetch)
    try {
        const response = await fetch('data.json');
        const fileData = await response.json();
        allDataToExport = fileData.map(item => typeof item === 'string' ? { text: item } : item);
    } catch (e) {
        // Nếu không fetch được, khởi tạo mảng trống
    }

    // 2. Lấy thêm các câu người dùng đã chat lưu trong LocalStorage
    const savedLocalChats = localStorage.getItem('user_learned_data');
    if (savedLocalChats) {
        const localArray = JSON.parse(savedLocalChats);
        // Tránh bị trùng lặp dữ liệu
        localArray.forEach(localItem => {
            if (!allDataToExport.some(item => item.text === localItem.text)) {
                allDataToExport.push(localItem);
            }
        });
    }

    // 3. Tạo Blob và kích hoạt tải file trên trình duyệt di động
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allDataToExport, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "data.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    console.log("📥 Đã tải xuống file data.json thành công!");
}

// Gắn sự kiện cho nút tải file trên giao diện
document.getElementById('download-json-btn').addEventListener('click', downloadDataJson);
