
const chat = document.getElementById("chat");
const message = document.getElementById("message");
const send = document.getElementById("send");
const download = document.getElementById("download");
const debug = document.getElementById("debug");

let memory = {
    conversations: [],
    bigram: {}
};


function addMessage(sender, text) {
    const line = document.createElement("p");
    line.textContent = sender + ": " + text;
    chat.appendChild(line);

    // Tự cuộn xuống tin nhắn mới nhất
    chat.scrollTop = chat.scrollHeight;
}


function think(input) {
    const tokenize = text =>
        text.toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];

    const inputWords = tokenize(input);

    let bestScore = 0;
    let bestResponse = null;

    for (const conversation of memory.conversations) {
        if (
            typeof conversation.user !== "string" ||
            typeof conversation.bot !== "string" ||
            !conversation.bot.trim()
        ) {
            continue;
        }

        const storedWords = tokenize(conversation.user);

        const inputSet = new Set(inputWords);
        const storedSet = new Set(storedWords);

        const intersection = [...inputSet].filter(
            word => storedSet.has(word)
        ).length;

        const union = new Set([
            ...inputSet,
            ...storedSet
        ]).size;

        const score = union === 0 ? 0 : intersection / union;

        if (score > bestScore) {
            bestScore = score;
            bestResponse = conversation.bot;
        }
    }

    // Chỉ trả lời nếu độ tương đồng đủ cao
    if (bestScore >= 0.5) {
        return bestResponse;
    }

    return null;
}


function sendMessage() {
    const input = message.value.trim();

    if (input === "") return;

    addMessage("Bạn", input);

    const response = think(input);

    if (response !== null) {
        addMessage("Bot", response);
    }

    // Luôn lưu cả câu User
    memory.conversations.push({
        user: input,
        bot: response
    });

    learnBigram(input);

    if (response !== null) {
        learnBigram(response);
    }

    debug.textContent = JSON.stringify(bigram, null, 2);

    message.value = "";
    message.focus();
}


function downloadMemory() {
    const json = JSON.stringify(memory, null, 2);
    const blob = new Blob([json], {
        type: "application/json"
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "memory.json";
    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

send.onclick = sendMessage;
download.onclick = downloadMemory;

message.onkeydown = function(event) {
    if (event.key === "Enter") {
        sendMessage();
    }
};

const upload = document.getElementById("upload");

// Nạp bộ nhớ JSON
upload.addEventListener("change", function(event) {
    const file = event.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function(e) {
    try {
        const data = JSON.parse(e.target.result);

        if (!data.conversations ||
            !Array.isArray(data.conversations)) {
            throw new Error("Sai cấu trúc bộ nhớ!");
        }

        memory = data;

        // THÊM Ở ĐÂY
        memory.bigram ??= {};

        chat.innerHTML = "";

        memory.conversations.forEach(item => {
            addMessage("Bạn", item.user);
            addMessage("Bot", item.bot);
        });

        alert("Đã nạp " +
            memory.conversations.length +
            " cuộc hội thoại!");

    } catch (error) {
        alert("Không thể đọc bộ nhớ: " + error.message);
    }
};

    reader.readAsText(file);
});


// Mô hình Bigram
function learnBigram(sentence) {
    const words = sentence
        .toLowerCase()
        .match(/[\p{L}\p{N}]+/gu) || [];

    for (let i = 0; i < words.length - 1; i++) {
        const current = words[i];
        const next = words[i + 1];

        if (!memory.bigram[current]) {
            memory.bigram[current] = {};
        }

        if (!memory.bigram[current][next]) {
            memory.bigram[current][next] = 0;
        }

        memory.bigram[current][next]++;
    }
}

console.log("Chatbot đã khởi động!");
