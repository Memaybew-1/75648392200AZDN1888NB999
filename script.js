
const chat = document.getElementById("chat");
const message = document.getElementById("message");
const send = document.getElementById("send");
const download = document.getElementById("download");
const debug = document.getElementById("debug");

let memory = {
    conversations: []
};

function addMessage(sender, text) {
    const line = document.createElement("p");
    line.textContent = sender + ": " + text;
    chat.appendChild(line);
}

function think(input) {
    input = input.toLowerCase();

    if (input.includes("xin chào")) {
        return "Chào bạn!";
    }

    if (input.includes("bạn là ai")) {
        return "Tôi là một chatbot.";
    }

    if (input.includes("bạn thích gì")) {
        return "Tôi thích học hỏi!";
    }

    return "Tôi chưa biết trả lời câu này.";
}

function sendMessage() {
    const input = message.value.trim();

    if (!input) return;

    addMessage("Bạn", input);

    const response = think(input);

    addMessage("Bot", response);

    memory.conversations.push({
        user: input,
        bot: response
    });

    learnBigram();

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

            learnBigram();

            debug.textContent = JSON.stringify(bigram, null, 2);

            console.log("Bigram:", bigram);

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
function learnBigram() {
    bigram = {};

    for (const conversation of memory.conversations) {

        // Bỏ qua câu trả lời mặc định
        if (conversation.bot === "Tôi chưa biết trả lời câu này.") {
            continue;
        }

        const words = conversation.bot
            .toLowerCase()
            .match(/[\p{L}\p{N}]+/gu) || [];

        for (let i = 0; i < words.length - 1; i++) {
            const current = words[i];
            const next = words[i + 1];

            if (!bigram[current]) {
                bigram[current] = {};
            }

            if (!bigram[current][next]) {
                bigram[current][next] = 0;
            }

            bigram[current][next]++;
        }
    }
}

console.log("Chatbot đã khởi động!");
