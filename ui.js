const HISTORY_KEY = "chat_history_v2";
const RECENT_QUERIES_KEY = "recent_queries_v2";

export function loadChatHistory(chatBox) {
    try {
        let data = localStorage.getItem(HISTORY_KEY);
        if (!data) return;
        let history = JSON.parse(data);
        if (!Array.isArray(history)) return;

        chatBox.innerHTML = "";
        history.forEach(item => {
            let div = document.createElement("div");
            div.className = "message " + (item.sender.includes("user") ? "user" : "bot");
            div.innerText = item.text;
            chatBox.appendChild(div);
        });
        chatBox.scrollTop = chatBox.scrollHeight;
    } catch (e) {
        console.error("Lỗi tải lịch sử chat:", e);
    }
}

export function saveMessageRecord(chatBox, text, senderClass) {
    let div = document.createElement("div");
    div.className = "message " + senderClass;
    div.innerText = text;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;

    if (!senderClass.includes("typing")) {
        try {
            let data = localStorage.getItem(HISTORY_KEY);
            let history = data ? JSON.parse(data) : [];
            history.push({ text: text, sender: senderClass, time: Date.now() });
            if (history.length > 50) history = history.slice(-50);
            localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        } catch (e) {
            console.error("Lỗi lưu tin nhắn:", e);
        }
    }

    return div;
}

export function updateRecentQueries(userText) {
    try {
        let data = localStorage.getItem(RECENT_QUERIES_KEY);
        let list = data ? JSON.parse(data) : [];
        list.push(userText);
        if (list.length > 5) list.shift();
        localStorage.setItem(RECENT_QUERIES_KEY, JSON.stringify(list));
        return list;
    } catch (e) {
        console.error("Lỗi cập nhật truy vấn gần đây:", e);
        return [userText];
    }
}
