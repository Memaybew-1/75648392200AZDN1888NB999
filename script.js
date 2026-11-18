
const chat = document.getElementById("chat");
const message = document.getElementById("message");
const send = document.getElementById("send");
const download = document.getElementById("download");

// Bộ nhớ hội thoại
let memory = {
    conversations: []
};

// Hiển thị tin nhắn
function addMessage(sender, text) {
    const line = document.createElement("p");
    line.textContent = sender + ": " + text;
    chat.appendChild(line);
}

// Bộ não chatbot
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

// Gửi tin nhắn
function sendMessage() {
    const input = message.value.trim();

    if (input === "") return;

    addMessage("Bạn", input);

    const response = think(input);

    addMessage("Bot", response);

    // Ghi vào bộ nhớ
    memory.conversations.push({
        user: input,
        bot: response
    });

    message.value = "";
}

// Tải bộ nhớ JSON
function downloadMemory() {
    const json = JSON.stringify(memory, null, 2);

    const blob = new Blob(
        [json],
        { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "memory.json";

    a.click();

    URL.revokeObjectURL(url);
}

send.addEventListener("click", sendMessage);

message.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        sendMessage();
    }
});

download.addEventListener("click", downloadMemory);
