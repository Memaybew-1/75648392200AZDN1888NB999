// ui.js - Quản lý giao diện và LocalStorage lịch sử chat

export const MAX_RECENT_QUERIES = 5;
let recentUserQueries = [];

// Khởi tạo lịch sử chat từ LocalStorage khi load trang
export function loadChatHistory(chatBoxEl) {
    let savedHistory = localStorage.getItem("chat_history_v1");
    if (savedHistory) {
        try {
            let history = JSON.parse(savedHistory);
            history.forEach(msg => {
                appendMessageToBox(chatBoxEl, msg.text, msg.sender);
                // Khôi phục lại các câu input của user vào mảng nhớ ngắn hạn
                if (msg.sender === "user" && recentUserQueries.length < MAX_RECENT_QUERIES) {
                    recentUserQueries.push(msg.text.replace("Bạn: ", ""));
                }
            });
        } catch (e) {
            console.error("Lỗi đọc lịch sử chat:", e);
        }
    }
}

// Lưu tin nhắn vào LocalStorage
function saveToLocalStorage(sender, text) {
    let history = JSON.parse(localStorage.getItem("chat_history_v1") || "[]");
    history.push({ sender, text, time: Date.now() });
    // Giữ tối đa 50 tin nhắn gần nhất trong bộ nhớ trình duyệt để không bị đầy
    if (history.length > 50) history.shift();
    localStorage.setItem("chat_history_v1", JSON.stringify(history));
}

// Hiển thị tin nhắn lên khung chat
export function appendMessageToBox(chatBoxEl, text, senderClass) {
    let div = document.createElement("div");
    div.className = "message " + senderClass;
    div.innerText = text;
    chatBoxEl.appendChild(div);
    chatBoxEl.scrollTop = chatBoxEl.scrollHeight;
    return div;
}

// Quản lý mảng nhớ ngắn hạn 5 input gần nhất của user
export function updateRecentQueries(userText) {
    recentUserQueries.push(userText);
    if (recentUserQueries.length > MAX_RECENT_QUERIES) {
        recentUserQueries.shift();
    }
    return recentUserQueries;
}

export function getRecentQueries() {
    return recentUserQueries;
}

export function saveMessageRecord(chatBoxEl, text, senderClass) {
    appendMessageToBox(chatBoxEl, text, senderClass);
    saveToLocalStorage(senderClass, text);
}
