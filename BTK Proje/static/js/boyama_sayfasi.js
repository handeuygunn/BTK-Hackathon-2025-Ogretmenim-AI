let isTyping = false;
let imageCounter = 0;
let galleryImages = [];
let currentModalImage = null;

document.addEventListener("DOMContentLoaded", function () {
  // Input'a odaklan
  document.getElementById("chat-input").focus();
});

function goBack() {
  window.location.href = "/dashboard";
}

function clearAll() {
  if (confirm("Tüm sohbet geçmişi ve görseller silinecek. Emin misiniz?")) {
    // Chat'i temizle
    const chatMessages = document.getElementById("chat-messages");
    chatMessages.innerHTML = `
            <div class="welcome-message">
                <div class="welcome-icon">🎨</div>
                <div class="welcome-text">
                    <h4>Merhaba!</h4>
                    <p>Yaratıcı boyama sayfaları ve çalışma kağıtları hazırlayalım. Ne tür bir etkinlik düşünüyorsunuz?</p>
                </div>
            </div>
        `;

    // Galeriyi temizle
    const galleryContent = document.getElementById("gallery-content");
    galleryContent.innerHTML = `
            <div class="empty-gallery">
                <div class="empty-icon">🖼️</div>
                <h4>Henüz görsel yok</h4>
                <p>Sol taraftaki chat'ten görsel istediğinizde burada görünecek!</p>
            </div>
        `;

    imageCounter = 0;
    galleryImages = [];
    updateImageCount();
  }
}

// Mesaj gönder
async function sendMessage() {
  const input = document.getElementById("chat-input");
  const message = input.value.trim();

  if (!message || isTyping) return;

  addMessage(message, "user");
  input.value = "";

  showTypingIndicator();

  try {
    const response = await fetch("/api/send_message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: message,
        category: "Boyama/Çalışma Sayfaları",
      }),
    });

    const data = await response.json();

    // Yazıyor göstergesini kaldır
    hideTypingIndicator();

    if (data.success) {
      addMessage(data.response, "bot");

      // Eğer görsel varsa galeriye ekle
      if (data.image_url) {
        addImageToGallery(data.image_url, message);
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
  typingDiv.className = "message bot typing";
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

  document.getElementById("send-btn").disabled = true;
}

function hideTypingIndicator() {
  isTyping = false;
  const typingIndicator = document.getElementById("typing-indicator");
  if (typingIndicator) {
    typingIndicator.remove();
  }

  // Send butonunu aktif et
  document.getElementById("send-btn").disabled = false;
}

// Görseli galeriye ekle
function addImageToGallery(imageUrl, requestText) {
  const galleryContent = document.getElementById("gallery-content");
  const emptyGallery = galleryContent.querySelector(".empty-gallery");
  if (emptyGallery) {
    galleryContent.innerHTML =
      '<div class="gallery-grid" id="gallery-grid"></div>';
  }

  const galleryGrid = document.getElementById("gallery-grid");
  const imageItem = document.createElement("div");
  imageItem.className = "gallery-item";

  const imageId = ++imageCounter;
  const currentTime = new Date().toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  imageItem.innerHTML = `
        <img class="gallery-image" src="${imageUrl}" alt="Oluşturulan görsel ${imageId}" onclick="openImageModal('${imageUrl}', '${requestText}', '')">
        <div class="gallery-item-actions">
            <div class="item-info">
                <div class="item-title">Görsel ${imageId}</div>
                <div class="item-time">${currentTime}</div>
            </div>
            <div class="item-actions">
                <button class="action-btn" onclick="downloadImageFromUrl('${imageUrl}', 'boyama-sayfasi-${imageId}.png')" title="İndir">
                    <i class="fas fa-download"></i>
                </button>
                <button class="action-btn" onclick="removeFromGallery(this)" title="Sil">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;

  galleryGrid.appendChild(imageItem);

  // Görsel bilgisini sakla
  galleryImages.push({
    id: imageId,
    url: imageUrl,
    request: requestText,
    time: currentTime,
  });

  updateImageCount();
}

// Görsel sayısını güncelle
function updateImageCount() {
  const countElement = document.getElementById("image-count");
  countElement.textContent = `${imageCounter} görsel`;
}

// Galeriden görsel kaldır
function removeFromGallery(button) {
  if (confirm("Bu görseli silmek istediğinizden emin misiniz?")) {
    const galleryItem = button.closest(".gallery-item");
    galleryItem.remove();

    imageCounter--;
    updateImageCount();

    // Eğer hiç görsel kalmadıysa empty state'i göster
    const galleryGrid = document.getElementById("gallery-grid");
    if (galleryGrid && galleryGrid.children.length === 0) {
      const galleryContent = document.getElementById("gallery-content");
      galleryContent.innerHTML = `
                <div class="empty-gallery">
                    <div class="empty-icon">🖼️</div>
                    <h4>Henüz görsel yok</h4>
                    <p>Sol taraftaki chat'ten görsel istediğinizde burada görünecek!</p>
                </div>
            `;
    }
  }
}

// Görsel modal'ını aç
function openImageModal(imageSrc, requestText = "", imageData = "") {
  const modal = document.getElementById("image-modal");
  const modalImg = modal.querySelector(".image-modal-content");

  modalImg.src = imageSrc;
  modal.classList.add("active");

  // Mevcut görsel bilgisini sakla
  currentModalImage = {
    src: imageSrc,
    data: imageData,
    request: requestText,
  };

  // Modal dışına tıklandığında kapat
  modal.onclick = (e) => {
    if (e.target === modal) {
      closeImageModal();
    }
  };
}

// Mevcut modal görselini indir
function downloadCurrentImage() {
  if (currentModalImage && currentModalImage.src) {
    const filename = `boyama-sayfasi-${Date.now()}.png`;
    downloadImageFromUrl(currentModalImage.src, filename);
  }
}

// URL'den görsel indir
function downloadImageFromUrl(imageUrl, filename) {
  try {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = filename;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Görsel indirme hatası:", error);
    alert("Görsel indirilemedi. Lütfen tekrar deneyin.");
  }
}

// Görsel indir (base64 için - eski sürümle uyumluluk)
function downloadImage(base64Data, filename) {
  try {
    const link = document.createElement("a");
    link.href = `data:image/png;base64,${base64Data}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    alert("Görsel indirilemedi. Lütfen tekrar deneyin.");
  }
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

// ESC tuşu ile modal kapatma
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    closeImageModal();
  }
});

// Sayfa yenileme uyarısı
window.addEventListener("beforeunload", function (event) {
  if (imageCounter > 0) {
    event.preventDefault();
    event.returnValue = "Oluşturduğunuz görseller kaybolacak. Emin misiniz?";
  }
});

// Görsel modal'ını kapat
function closeImageModal() {
  const modal = document.getElementById("image-modal");
  modal.classList.remove("active");
  currentModalImage = null;
}
