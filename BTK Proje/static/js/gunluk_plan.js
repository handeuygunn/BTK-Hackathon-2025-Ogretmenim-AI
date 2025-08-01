// Günlük Plan JavaScript

let currentDate = new Date();
let uploadedPDF = null;
let currentPlan = null;
let savedPlans = [];

// Sayfa yüklendiğinde çalışacak fonksiyon
document.addEventListener("DOMContentLoaded", function () {
  initializePage();
  setupEventListeners();
  loadCalendar();
  loadSavedPlans();
});

// Sayfayı başlat
function initializePage() {
  // Bugünün tarihini default olarak seç (takvim için)
  const today = new Date().toISOString().split("T")[0];
  // Kaydetme modal'ındaki tarihi bugün yap
  document.getElementById("plan-date-save").value = today;
}

// Event listener'ları kur
function setupEventListeners() {
  // PDF yükleme
  setupPDFUpload();

  // Enter tuşu ile mesaj gönderme
  document
    .getElementById("chat-input")
    .addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        sendMessage();
      }
    });

  // Modal dışına tıklandığında kapat
  document.addEventListener("click", function (e) {
    const modal = document.getElementById("save-modal");
    if (e.target === modal) {
      closeSaveModal();
    }
  });
}

// PDF yükleme kurulumu
function setupPDFUpload() {
  const uploadArea = document.getElementById("upload-area");
  const pdfInput = document.getElementById("pdf-input");
  const uploadLink = uploadArea.querySelector(".upload-link");

  // Tıklama ile dosya seçme
  uploadLink.addEventListener("click", () => {
    pdfInput.click();
  });

  uploadArea.addEventListener("click", () => {
    pdfInput.click();
  });

  // Drag & Drop
  uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadArea.classList.add("dragover");
  });

  uploadArea.addEventListener("dragleave", () => {
    uploadArea.classList.remove("dragover");
  });

  uploadArea.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadArea.classList.remove("dragover");
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  });

  // Dosya seçimi
  pdfInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  });
}

// Dosya yükleme işlemi
function handleFileUpload(file) {
  if (file.type !== "application/pdf") {
    alert("Lütfen sadece PDF dosyası yükleyin.");
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    // 10MB limit
    alert("Dosya boyutu 10MB'dan küçük olmalıdır.");
    return;
  }

  uploadedPDF = file;
  displayUploadedFile(file);

  // Chat'e dosya yüklendiği bilgisini ekle
  addMessageToChat(
    `📄 "${file.name}" dosyası yüklendi. Artık bu dosyaya dayalı günlük plan oluşturabilirim.`,
    "bot"
  );
}

// Yüklenen dosyayı göster
function displayUploadedFile(file) {
  const uploadedFiles = document.getElementById("uploaded-files");
  uploadedFiles.innerHTML = "";

  const fileItem = document.createElement("div");
  fileItem.className = "uploaded-file";

  const fileSize = (file.size / 1024 / 1024).toFixed(2);

  fileItem.innerHTML = `
        <i class="fas fa-file-pdf"></i>
        <div class="file-info">
            <div class="file-name">${file.name}</div>
            <div class="file-size">${fileSize} MB</div>
        </div>
        <button class="remove-file" onclick="removeUploadedFile()">
            <i class="fas fa-times"></i>
        </button>
    `;

  uploadedFiles.appendChild(fileItem);
}

// Yüklenen dosyayı kaldır
function removeUploadedFile() {
  uploadedPDF = null;
  document.getElementById("uploaded-files").innerHTML = "";
  document.getElementById("pdf-input").value = "";
  addMessageToChat("📄 PDF dosyası kaldırıldı.", "bot");
}

// Mesaj gönder
async function sendMessage() {
  const input = document.getElementById("chat-input");
  const message = input.value.trim();

  if (!message) return;

  // Kullanıcı mesajını ekle
  addMessageToChat(message, "user");
  input.value = "";

  // Loading göster
  const loadingDiv = addLoadingMessage();

  try {
    // FormData oluştur
    const formData = new FormData();
    formData.append("message", message);
    formData.append("date", new Date().toISOString().split("T")[0]); // Bugünün tarihi
    formData.append("category", "Günlük Plan");

    if (uploadedPDF) {
      formData.append("pdf_file", uploadedPDF);
    }

    // API'ye mesaj gönder
    const response = await fetch("/api/gunluk-plan", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    // Loading'i kaldır
    loadingDiv.remove();

    if (data.success) {
      // Bot cevabını ekle
      addMessageToChat(data.response, "bot");

      // Plan çıktısını göster
      const todayDate = new Date().toISOString().split("T")[0];
      displayPlanOutput(data.response, todayDate);

      // Plan verilerini sakla
      currentPlan = {
        content: data.response,
        date: todayDate,
        timestamp: new Date(),
      };
    } else {
      addMessageToChat(
        "Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.",
        "bot"
      );
    }
  } catch (error) {
    console.error("API Error:", error);
    loadingDiv.remove();
    addMessageToChat("Bağlantı hatası oluştu. Lütfen tekrar deneyin.", "bot");
  }
}

// Chat'e mesaj ekle
function addMessageToChat(message, sender) {
  const chatMessages = document.getElementById("chat-messages");
  const messageDiv = document.createElement("div");
  messageDiv.className = `chat-message ${sender}-message`;

  const avatar =
    sender === "user"
      ? '<i class="fas fa-user"></i>'
      : '<i class="fas fa-robot"></i>';

  messageDiv.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">
            <p>${message}</p>
        </div>
    `;

  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Loading mesajı ekle
function addLoadingMessage() {
  const chatMessages = document.getElementById("chat-messages");
  const loadingDiv = document.createElement("div");
  loadingDiv.className = "chat-message bot-message loading";

  loadingDiv.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
            <p>Plan oluşturuluyor... <span class="loading-dots"><span></span><span></span><span></span></span></p>
        </div>
    `;

  chatMessages.appendChild(loadingDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  return loadingDiv;
}

// Plan çıktısını göster
function displayPlanOutput(planContent, date) {
  const planContentDiv = document.getElementById("plan-content");

  // Markdown benzeri formatlamayı HTML'e çevir
  const formattedContent = formatPlanContent(planContent);

  planContentDiv.innerHTML = `
        <div class="plan-output">
            <div class="plan-header">
                <h1>📅 ${formatDate(date)} Günlük Planı</h1>
            </div>
            ${formattedContent}
        </div>
    `;

  // Kaydet ve PDF butonlarını göster
  document.getElementById("save-plan-btn").style.display = "inline-block";
  document.getElementById("export-pdf-btn").style.display = "inline-block";
}

// Plan içeriğini formatla
function formatPlanContent(content) {
  return content
    .replace(/### (.*)/g, "<h3>$1</h3>")
    .replace(/## (.*)/g, "<h2>$1</h2>")
    .replace(/# (.*)/g, "<h1>$1</h1>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>")
    .replace(/^(.*)$/g, "<p>$1</p>")
    .replace(/<p><\/p>/g, "")
    .replace(/^\d+\.\s(.*)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>)/gs, "<ol>$1</ol>")
    .replace(/^[-\*]\s(.*)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>");
}

// Tarihi formatla
function formatDate(dateString) {
  const date = new Date(dateString);
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  };
  return date.toLocaleDateString("tr-TR", options);
}

// Planı kaydet
function savePlan() {
  if (!currentPlan) {
    alert("Kaydedilecek plan bulunamadı.");
    return;
  }

  // Modal'ı aç ve mevcut bilgileri doldur
  document.getElementById("plan-date-save").value = currentPlan.date;
  document.getElementById("save-modal").classList.add("active");
}

// Kaydetme modal'ını kapat
function closeSaveModal() {
  document.getElementById("save-modal").classList.remove("active");
}

// Planı kaydetmeyi onayla
function confirmSavePlan() {
  const title = document.getElementById("plan-title").value.trim();
  const date = document.getElementById("plan-date-save").value;
  const startTime = document.getElementById("start-time").value;
  const endTime = document.getElementById("end-time").value;
  const notes = document.getElementById("plan-notes").value.trim();

  if (!title) {
    alert("Lütfen plan başlığını girin.");
    return;
  }

  if (!date) {
    alert("Lütfen tarihi seçin.");
    return;
  }

  const savedPlan = {
    id: Date.now(),
    title: title,
    content: currentPlan.content,
    date: date,
    startTime: startTime,
    endTime: endTime,
    notes: notes,
    createdAt: new Date(),
  };

  // Planı kaydet
  savedPlans.push(savedPlan);

  // LocalStorage'a kaydet
  localStorage.setItem("savedPlans", JSON.stringify(savedPlans));

  // UI'ı güncelle
  loadSavedPlans();
  loadCalendar();

  // Modal'ı kapat
  closeSaveModal();

  // Başarı mesajı
  addMessageToChat(
    `✅ "${title}" başlıklı plan ${formatDate(date)} tarihine kaydedildi.`,
    "bot"
  );
}

// PDF'e aktar
function exportToPDF() {
  if (!currentPlan) {
    alert("Aktarılacak plan bulunamadı.");
    return;
  }

  // Basit PDF export (gerçek uygulamada PDF kütüphanesi kullanılabilir)
  const planContent = document.querySelector(".plan-output");
  if (planContent) {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
            <html>
                <head>
                    <title>Günlük Plan - ${formatDate(currentPlan.date)}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        h1, h2, h3 { color: #667eea; }
                        h1 { border-bottom: 2px solid #667eea; padding-bottom: 10px; }
                        ul, ol { margin: 10px 0; padding-left: 30px; }
                        li { margin-bottom: 5px; }
                        strong { font-weight: bold; }
                    </style>
                </head>
                <body>
                    ${planContent.innerHTML}
                </body>
            </html>
        `);
    printWindow.document.close();
    printWindow.print();
  }
}

// Takvimi yükle
function loadCalendar() {
  const monthYear = document.getElementById("calendar-month-year");
  const calendarDays = document.getElementById("calendar-days");

  const months = [
    "Ocak",
    "Şubat",
    "Mart",
    "Nisan",
    "Mayıs",
    "Haziran",
    "Temmuz",
    "Ağustos",
    "Eylül",
    "Ekim",
    "Kasım",
    "Aralık",
  ];

  monthYear.textContent = `${
    months[currentDate.getMonth()]
  } ${currentDate.getFullYear()}`;

  // Ayın ilk gününü ve gün sayısını hesapla
  const firstDay = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  );
  const lastDay = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  );
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  calendarDays.innerHTML = "";

  // Önceki ayın son günleri
  for (let i = 0; i < startingDayOfWeek; i++) {
    const emptyDay = document.createElement("div");
    emptyDay.className = "calendar-day";
    calendarDays.appendChild(emptyDay);
  }

  // Mevcut ayın günleri
  for (let day = 1; day <= daysInMonth; day++) {
    const dayDiv = document.createElement("div");
    dayDiv.className = "calendar-day";
    dayDiv.textContent = day;

    const dayDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );
    const dateString = dayDate.toISOString().split("T")[0];

    // Bugünü işaretle
    const today = new Date().toISOString().split("T")[0];
    if (dateString === today) {
      dayDiv.classList.add("today");
    }

    // Plan olan günleri işaretle
    if (hasPlansForDate(dateString)) {
      dayDiv.classList.add("has-plan");
    }

    calendarDays.appendChild(dayDiv);
  }
}

// Belirli bir tarih için plan var mı kontrol et
function hasPlansForDate(dateString) {
  return savedPlans.some((plan) => plan.date === dateString);
}

// Takvim seçimini güncelle
function updateCalendarSelection(dateString) {
  const selectedDate = new Date(dateString);
  currentDate = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    1
  );
  loadCalendar();
}

// Önceki ay
function previousMonth() {
  currentDate.setMonth(currentDate.getMonth() - 1);
  loadCalendar();
}

// Sonraki ay
function nextMonth() {
  currentDate.setMonth(currentDate.getMonth() + 1);
  loadCalendar();
}

// Kayıtlı planları yükle
function loadSavedPlans() {
  // LocalStorage'dan planları yükle
  const stored = localStorage.getItem("savedPlans");
  if (stored) {
    savedPlans = JSON.parse(stored);
  }

  const savedPlansList = document.getElementById("saved-plans-list");
  savedPlansList.innerHTML = "";

  if (savedPlans.length === 0) {
    savedPlansList.innerHTML = `
            <div style="text-align: center; color: #718096; padding: 2rem;">
                <i class="fas fa-calendar-check" style="font-size: 2rem; margin-bottom: 0.5rem; opacity: 0.3;"></i>
                <p>Henüz kayıtlı plan yok.</p>
            </div>
        `;
    return;
  }

  // Planları tarihe göre sırala (en yeni üstte)
  const sortedPlans = [...savedPlans].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  sortedPlans.slice(0, 5).forEach((plan) => {
    // Son 5 planı göster
    const planItem = createSavedPlanItem(plan);
    savedPlansList.appendChild(planItem);
  });
}

// Kayıtlı plan item'ı oluştur
function createSavedPlanItem(plan) {
  const div = document.createElement("div");
  div.className = "saved-plan-item";
  div.onclick = () => loadSavedPlan(plan);

  const date = formatDate(plan.date);
  const timeRange = `${plan.startTime} - ${plan.endTime}`;

  div.innerHTML = `
        <div class="plan-item-header">
            <span class="plan-title">${plan.title}</span>
            <span class="plan-date">${new Date(plan.date).toLocaleDateString(
              "tr-TR"
            )}</span>
        </div>
        <div class="plan-time">${timeRange}</div>
    `;

  return div;
}

// Kayıtlı planı yükle
function loadSavedPlan(plan) {
  // Plan çıktısını göster
  displayPlanOutput(plan.content, plan.date);

  // Current plan'ı güncelle
  currentPlan = {
    content: plan.content,
    date: plan.date,
    timestamp: new Date(plan.createdAt),
  };

  // Chat'e bilgi mesajı ekle
  addMessageToChat(`📋 "${plan.title}" planı yüklendi.`, "bot");
}
