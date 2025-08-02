// Chatbot JavaScript Functions
let currentCategory = "";
let isTyping = false;

// Chatbot modal'ını aç
function openChatbot(category) {
  currentCategory = category;
  const modal = document.getElementById("chatbot-modal");
  const container = document.getElementById("chatbot-container");
  const title = document.getElementById("chatbot-title-text");
  const storyDisplay = document.getElementById("story-display");

  // Kategori bazında başlık ve icon belirleme
  const categoryInfo = {
    "Günlük Plan": { icon: "📅", title: "Günlük Plan Asistanı" },
    "Etkinlik/Oyun Planı": { icon: "🎮", title: "Etkinlik & Oyun Asistanı" },
    "Öğrenci Analizleri": { icon: "📊", title: "Öğrenci Analiz Asistanı" },
    Hikayeler: { icon: "📚", title: "Hikaye Asistanı" },
    Takvim: { icon: "🗓️", title: "Takvim Asistanı" },
  };

  const info = categoryInfo[category] || { icon: "🤖", title: "AI Asistan" };
  title.innerHTML = `<span class="icon">${info.icon}</span>${info.title}`;

  // Hikayeler kategorisinde özel layout
  if (category === "Hikayeler") {
    container.classList.add("story-mode");
    storyDisplay.style.display = "flex";
    document.getElementById("content-display-title").innerHTML = "📚 Hikaye";
  } else if (category === "Etkinlik/Oyun Planı") {
    container.classList.add("activity-mode");
    storyDisplay.style.display = "flex";
    document.getElementById("content-display-title").innerHTML =
      "🎮 Etkinlik Planı";
  } else {
    container.classList.remove("story-mode", "activity-mode");
    storyDisplay.style.display = "none";
  }

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
  const container = document.getElementById("chatbot-container");
  const storyDisplay = document.getElementById("story-display");

  modal.classList.remove("active");
  document.body.style.overflow = "auto";

  // Layout sınıflarını temizle
  container.classList.remove("story-mode", "activity-mode");
  storyDisplay.style.display = "none";

  // Chat geçmişini ve hikaye içeriğini temizle
  setTimeout(() => {
    document.getElementById("chat-messages").innerHTML = "";
    document.getElementById("story-content").innerHTML = "";
  }, 300);
}

// Hoş geldin mesajını göster
function showWelcomeMessage(category) {
  const welcomeMessages = {
    "Günlük Plan":
      "Merhaba! Ben günlük eğitim planlarınızı oluşturmanıza yardımcı olacağım. Hangi yaş grubu için plan hazırlamak istiyorsunuz?",
    "Etkinlik/Oyun Planı":
      "Merhaba! Çocuklarınız için eğlenceli ve eğitici etkinlikler planlayalım. Hangi konuda yardıma ihtiyacınız var?",
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

      // Hikayeler ve Etkinlik/Oyun Planı kategorilerinde yanıtı ayrıca sağ panelde göster
      if (currentCategory === "Hikayeler") {
        displayStory(data.response);
      } else if (currentCategory === "Etkinlik/Oyun Planı") {
        displayActivity(data.response);
      }
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

// Hikayeyi formatla ve görüntüle
function displayStory(storyText) {
  const storyContent = document.getElementById("story-content");

  // Basit markdown-benzeri formatlamalar
  let formattedStory = storyText
    // Başlıkları formatla
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    // Bold text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Paragrafları ayır
    .replace(/\n\s*\n/g, "</p><p>")
    // Başta ve sonda p tag ekle
    .replace(/^/, "<p>")
    .replace(/$/, "</p>")
    // Boş p taglerini temizle
    .replace(/<p>\s*<\/p>/g, "")
    // Liste öğeleri
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>")
    // Satır sonlarını br ile değiştir (p taglerinin içinde)
    .replace(/(<\/h[1-6]>)\n/g, "$1")
    .replace(/(<\/ul>)\n/g, "$1")
    .replace(/\n(?![<])/g, "<br>");

  storyContent.innerHTML = formattedStory;
}

// Hikayeyi kopyala
function copyStory() {
  const storyContent = document.getElementById("story-content");
  const textContent = storyContent.innerText || storyContent.textContent;

  navigator.clipboard
    .writeText(textContent)
    .then(() => {
      // Başarı göstergesi
      const button = document.querySelector(".story-action-btn");
      const originalText = button.innerHTML;
      button.innerHTML = '<i class="fas fa-check"></i> Kopyalandı!';
      button.style.background =
        "linear-gradient(135deg, #48bb78 0%, #38a169 100%)";

      setTimeout(() => {
        button.innerHTML = originalText;
        button.style.background =
          "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
      }, 2000);
    })
    .catch((err) => {
      console.error("Kopyalama hatası:", err);
      alert("Hikaye kopyalanamadı. Lütfen manuel olarak seçip kopyalayın.");
    });
}

// İçeriği kopyala (genel fonksiyon)
function copyContent() {
  const storyContent = document.getElementById("story-content");
  const textContent = storyContent.innerText || storyContent.textContent;

  navigator.clipboard
    .writeText(textContent)
    .then(() => {
      // Başarı göstergesi
      const button = document.querySelector(".story-action-btn");
      const originalText = button.innerHTML;
      button.innerHTML = '<i class="fas fa-check"></i> Kopyalandı!';
      button.style.background =
        "linear-gradient(135deg, #48bb78 0%, #38a169 100%)";

      setTimeout(() => {
        button.innerHTML = originalText;
        button.style.background =
          "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
      }, 2000);
    })
    .catch((err) => {
      console.error("Kopyalama hatası:", err);
      alert("İçerik kopyalanamadı. Lütfen manuel olarak seçip kopyalayın.");
    });
}

// İçeriği PDF olarak dışa aktar
function exportContentToPDF() {
  const storyContent = document.getElementById("story-content");
  const titleElement = document.getElementById("content-display-title");

  if (!storyContent || !storyContent.innerHTML.trim()) {
    alert("Dışa aktarılacak içerik bulunamadı.");
    return;
  }

  const title = titleElement ? titleElement.textContent : "İçerik";
  const content = storyContent.innerHTML;

  // Bugünün tarihini al
  const today = new Date();
  const dateStr = today.toLocaleDateString("tr-TR");

  // Print penceresi aç
  const printWindow = window.open("", "_blank");
  printWindow.document.write(`
    <html>
      <head>
        <title>${title} - ${dateStr}</title>
        <meta charset="UTF-8">
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            line-height: 1.6;
            color: #2d3748;
          }
          h1, h2, h3 { 
            color: #667eea; 
            margin-top: 2rem;
            margin-bottom: 1rem;
          }
          h1 { 
            border-bottom: 2px solid #667eea; 
            padding-bottom: 10px; 
            font-size: 2rem;
          }
          h2 {
            font-size: 1.5rem;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 5px;
          }
          h3 {
            font-size: 1.3rem;
          }
          ul, ol { 
            margin: 10px 0; 
            padding-left: 30px; 
          }
          li { 
            margin-bottom: 8px; 
          }
          strong { 
            font-weight: bold; 
            color: #2d3748;
          }
          em {
            font-style: italic;
            color: #667eea;
          }
          p {
            margin-bottom: 1rem;
            text-align: justify;
          }
          .activity-section {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 1.5rem;
            margin: 1rem 0;
          }
          .activity-title {
            color: #667eea;
            font-weight: bold;
            font-size: 1.2rem;
            margin-bottom: 1rem;
          }
          .activity-detail {
            background: white;
            padding: 1rem;
            border-radius: 6px;
            margin: 0.5rem 0;
            border-left: 4px solid #667eea;
          }
          .step-number {
            background: #667eea;
            color: white;
            width: 25px;
            height: 25px;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            margin-right: 10px;
          }
          .material-list {
            background: rgba(118, 75, 162, 0.1);
            border-radius: 8px;
            padding: 1rem;
            margin: 1rem 0;
          }
          .time-badge, .age-badge {
            background: #667eea;
            color: white;
            padding: 4px 12px;
            border-radius: 15px;
            font-size: 0.9rem;
            font-weight: bold;
            margin: 2px;
            display: inline-block;
          }
          .age-badge {
            background: #48bb78;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
          .header {
            text-align: center;
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 3px solid #667eea;
          }
          .date {
            color: #718096;
            font-size: 1rem;
            margin-top: 0.5rem;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${title}</h1>
          <div class="date">Oluşturulma Tarihi: ${dateStr}</div>
        </div>
        <div class="content">
          ${content}
        </div>
      </body>
    </html>
  `);

  printWindow.document.close();

  // Kısa bir gecikme sonrasında print dialog'unu aç
  setTimeout(() => {
    printWindow.print();
  }, 250);
}

// Etkinlik/Oyun planını formatla ve görüntüle
function displayActivity(activityText) {
  const storyContent = document.getElementById("story-content");

  // Etkinlik planları için özel formatlamalar
  let formattedActivity = activityText
    // Başlıkları formatla
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")

    // Etkinlik bölümleri için özel formatlamalar
    .replace(
      /\*\*Etkinlik Adı:\*\*\s*(.+)/g,
      '<div class="activity-section"><div class="activity-title">🎯 $1</div>'
    )
    .replace(
      /\*\*Yaş Grubu:\*\*\s*(.+)/g,
      '<span class="age-badge">👶 $1</span>'
    )
    .replace(/\*\*Süre:\*\*\s*(.+)/g, '<span class="time-badge">⏱️ $1</span>')
    .replace(
      /\*\*Katılımcı Sayısı:\*\*\s*(.+)/g,
      '<span class="age-badge">👥 $1</span>'
    )

    // Malzemeler listesi
    .replace(
      /\*\*Malzemeler:\*\*([\s\S]*?)(?=\*\*|$)/g,
      function (match, content) {
        return (
          '<div class="material-list"><strong>🧰 Malzemeler:</strong>' +
          content +
          "</div>"
        );
      }
    )

    // Adımları numaralandır
    .replace(
      /^(\d+)\.\s*(.+)$/gm,
      '<div class="activity-detail"><span class="step-number">$1</span>$2</div>'
    )

    // Bold text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")

    // Paragrafları ayır
    .replace(/\n\s*\n/g, "</p><p>")
    .replace(/^/, "<p>")
    .replace(/$/, "</p>")

    // Boş p taglerini temizle
    .replace(/<p>\s*<\/p>/g, "")
    .replace(/<p>(<div)/g, "$1")
    .replace(/(<\/div>)<\/p>/g, "$1")

    // Liste öğeleri
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>")

    // Etkinlik bölümlerini kapat
    .replace(
      /(<div class="activity-section">[\s\S]*?)(?=<div class="activity-section">|$)/g,
      "$1</div>"
    )

    // Satır sonlarını br ile değiştir
    .replace(/(<\/h[1-6]>)\n/g, "$1")
    .replace(/(<\/div>)\n/g, "$1")
    .replace(/(<\/ul>)\n/g, "$1")
    .replace(/\n(?![<])/g, "<br>");

  storyContent.innerHTML = formattedActivity;
}
