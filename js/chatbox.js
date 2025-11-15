document.addEventListener("DOMContentLoaded", () => {
  const chat = document.createElement("div");
  chat.className = "chatbox minimized";
  chat.innerHTML = `
    <div class="chat-header">Chat AI <span id="toggleChat">🔼</span></div>
    <div class="chat-body">
      <div class="chat-messages"></div>
      <input type="text" id="chatInput" placeholder="Nhập câu hỏi..." />
      <button id="sendChat">Gửi</button>
    </div>
  `;
  document.body.appendChild(chat);

  const toggle = chat.querySelector("#toggleChat");
  toggle.onclick = () => chat.classList.toggle("minimized");

  document.querySelector("#sendChat").onclick = async () => {
    const msg = document.querySelector("#chatInput").value.trim();
    if (!msg) return;
    const box = chat.querySelector(".chat-messages");
    box.innerHTML += `<div class="user">${msg}</div>`;
    document.querySelector("#chatInput").value = "";

    // Placeholder cho API thật
    box.innerHTML += `<div class="bot">Đang xử lý...</div>`;
    box.scrollTop = box.scrollHeight;
  };
});
