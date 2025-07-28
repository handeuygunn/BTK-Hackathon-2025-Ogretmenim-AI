// Chatbot JavaScript Functions
let currentCategory = "";
let isTyping = false;

// Chatbot modal'ını aç
function openChatbot(category) {
  currentCategory = category;
  const modal = document.getElementById("chatbot-modal");
  const title = document.getElementById("chatbot-title-text");

  // Kategori bazında başlık ve icon belirleme
  const categoryInfo = {
    "Günlük Plan": { icon: "📅", title: "Günlük Plan Asistanı" },
    "Etkinlik/Oyun Planı": { icon: "🎮", title: "Etkinlik & Oyun Asistanı" },
    "Boyama/Çalışma Sayfaları": {
      icon: "🎨",
      title: "Yaratıcı Çalışma Asistanı",
    },
    "Öğrenci Analizleri": { icon: "📊", title: "Öğrenci Analiz Asistanı" },
    Hikayeler: { icon: "📚", title: "Hikaye Asistanı" },
    Takvim: { icon: "🗓️", title: "Takvim Asistanı" },
  };

  const info = categoryInfo[category] || { icon: "🤖", title: "AI Asistan" };
  title.innerHTML = `<span class="icon">${info.icon}</span>${info.title}`;

  // Modal'ı göster
  modal.classList.add("active");
  document.body.style.overflow = "hidden";

  // Input'a odaklan
  setTimeout(() => {
    document.getElementById("chat-input").focus();
  }, 300);

  // Hoş geldin mesajı göster
  showWelcomeMessage(category);
}

// Chatbot modal'ını kapat
function closeChatbot() {
  const modal = document.getElementById("chatbot-modal");
  modal.classList.remove("active");
  document.body.style.overflow = "auto";

  // Chat geçmişini temizle
  setTimeout(() => {
    document.getElementById("chat-messages").innerHTML = "";
  }, 300);
}

// Hoş geldin mesajını göster
function showWelcomeMessage(category) {
  const welcomeMessages = {
    "Günlük Plan":
      "Merhaba! Ben günlük eğitim planlarınızı oluşturmanıza yardımcı olacağım. Hangi yaş grubu için plan hazırlamak istiyorsunuz?",
    "Etkinlik/Oyun Planı":
      "Merhaba! Çocuklarınız için eğlenceli ve eğitici etkinlikler planlayalım. Hangi konuda yardıma ihtiyacınız var?",
    "Boyama/Çalışma Sayfaları":
      "Merhaba! Yaratıcı boyama sayfaları ve çalışma kağıtları hazırlayalım. Ne tür bir etkinlik düşünüyorsunuz?",
    "Öğrenci Analizleri":
      "Merhaba! Öğrencilerinizin gelişimini değerlendirmenize yardımcı olacağım. Hangi alanda analiz yapmak istiyorsunuz?",
    Hikayeler:
      "Merhaba! Çocuklarınız için eğitici ve eğlenceli hikayeler oluşturalım. Hangi konuda hikaye istiyorsunuz?",
    Takvim:
      "Merhaba! Eğitim takviminizi ve etkinlik programınızı düzenlemenize yardımcı olacağım. Nasıl yardımcı olabilirim?",
  };

  const message =
    welcomeMessages[category] || "Merhaba! Size nasıl yardımcı olabilirim?";

  setTimeout(() => {
    addMessage(message, "bot");
  }, 500);
}

// Mesaj gönder
async function sendMessage() {
  const input = document.getElementById("chat-input");
  const message = input.value.trim();

  if (!message || isTyping) return;

  // Kullanıcı mesajını ekle
  addMessage(message, "user");
  input.value = "";

  // Yazıyor göstergesi
  showTypingIndicator();

  try {
    const response = await fetch("/api/send_message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: message,
        category: currentCategory,
      }),
    });

    const data = await response.json();

    // Yazıyor göstergesini kaldır
    hideTypingIndicator();

    if (data.success) {
      addMessage(data.response, "bot");
    } else {
      addMessage("Üzgünüm, bir hata oluştu: " + data.error, "bot");
    }
  } catch (error) {
    hideTypingIndicator();
    addMessage("Bağlantı hatası oluştu. Lütfen tekrar deneyin.", "bot");
  }
}

// Mesaj ekle
function addMessage(text, type) {
  const messagesContainer = document.getElementById("chat-messages");
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${type}`;
  messageDiv.textContent = text;

  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Yazıyor göstergesi göster
function showTypingIndicator() {
  isTyping = true;
  const messagesContainer = document.getElementById("chat-messages");
  const typingDiv = document.createElement("div");
  typingDiv.className = "message typing";
  typingDiv.id = "typing-indicator";
  typingDiv.innerHTML = `
        <div class="typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;

  messagesContainer.appendChild(typingDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  // Send butonunu deaktif et
  document.getElementById("send-btn").disabled = true;
}

// Yazıyor göstergesini gizle
function hideTypingIndicator() {
  isTyping = false;
  const typingIndicator = document.getElementById("typing-indicator");
  if (typingIndicator) {
    typingIndicator.remove();
  }

  // Send butonunu aktif et
  document.getElementById("send-btn").disabled = false;
}

// Enter tuşu ile mesaj gönderme
function handleKeyPress(event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
}

// Auto-resize textarea
function autoResizeTextarea(textarea) {
  textarea.style.height = "auto";
  textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
}

// Modal dışına tıklandığında kapatma
document.addEventListener("click", function (event) {
  const modal = document.getElementById("chatbot-modal");
  if (event.target === modal) {
    closeChatbot();
  }
});

// ESC tuşu ile kapatma
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    closeChatbot();
  }
});
