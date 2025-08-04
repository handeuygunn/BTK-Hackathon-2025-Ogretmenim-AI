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
async function initializePage() {
  // Dashboard'dan gelen düzenleme tarihi kontrolü
  const editPlanDate = localStorage.getItem("editPlanDate");
  let selectedDate;

  if (editPlanDate) {
    // Dashboard'dan gelen tarih varsa onu kullan
    selectedDate = editPlanDate;
    localStorage.removeItem("editPlanDate"); // Kullandıktan sonra temizle
  } else {
    // Yoksa bugünün tarihini kullan
    const today = new Date();
    selectedDate = `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  }

  // Kaydetme modal'ındaki tarihi seç
  document.getElementById("plan-date-save").value = selectedDate;

  // Kayıtlı planları yükle
  await loadSavedPlans();

  // Eğer seçili tarih için plan varsa yükle
  if (editPlanDate) {
    const existingPlan = savedPlans.find(
      (plan) => plan.plan_date === editPlanDate
    );
    if (existingPlan) {
      // Planı chat area'ya yükle
      displayExistingPlan(existingPlan);
    }
  }

  // Takvimi yükle
  loadCalendar();
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
    const today = new Date();
    const todayString = `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    formData.append("date", todayString); // Bugünün tarihi
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
      const today = new Date();
      const todayDate = `${today.getFullYear()}-${String(
        today.getMonth() + 1
      ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
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
async function confirmSavePlan() {
  const title = document.getElementById("plan-title").value.trim();
  const date = document.getElementById("plan-date-save").value;
  const notes = document.getElementById("plan-notes").value.trim();

  if (!date) {
    alert("Lütfen tarihi seçin.");
    return;
  }

  if (!currentPlan) {
    alert("Kaydedilecek plan bulunamadı.");
    return;
  }

  try {
    // API'ye günlük planı kaydet
    const response = await fetch("/api/save-daily-plan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        plan_date: date,
        content: currentPlan.content,
      }),
    });

    const data = await response.json();

    if (data.success) {
      // UI'ı güncelle
      await loadSavedPlans();
      loadCalendar();

      // Modal'ı kapat
      closeSaveModal();

      // Başarı mesajı
      addMessageToChat(
        `✅ Günlük plan ${formatDate(date)} tarihine ${data.action}!`,
        "bot"
      );
    } else {
      alert("Plan kaydetme hatası: " + data.error);
    }
  } catch (error) {
    console.error("Save plan error:", error);
    alert("Plan kaydedilirken bir hata oluştu.");
  }
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
  // Pazartesi'yi 0 yapmak için (0=Pazar -> 6=Pazartesi olarak düzenle)
  const startingDayOfWeek = (firstDay.getDay() + 6) % 7;

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
    const today = new Date();
    const todayString = `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    if (dateString === todayString) {
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
  return savedPlans.some((plan) => plan.plan_date === dateString);
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
async function loadSavedPlans() {
  try {
    const savedPlansList = document.getElementById("saved-plans-list");

    // Loading göster
    savedPlansList.innerHTML = `
      <div style="text-align: center; color: #718096; padding: 2rem;">
        <i class="fas fa-spinner fa-spin" style="font-size: 1.5rem; margin-bottom: 0.5rem; color: #667eea;"></i>
        <p style="font-size: 0.9rem;">Planlar yükleniyor...</p>
      </div>
    `;

    // API'den kayıtlı planları çek
    const response = await fetch("/api/get-daily-plans", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    savedPlansList.innerHTML = "";

    if (!data.success || data.plans.length === 0) {
      savedPlansList.innerHTML = `
        <div style="text-align: center; color: #718096; padding: 2rem;">
          <i class="fas fa-calendar-check" style="font-size: 2rem; margin-bottom: 0.5rem; opacity: 0.3;"></i>
          <p style="font-size: 0.95rem; margin-bottom: 0.25rem;">Henüz kayıtlı plan yok</p>
          <p style="font-size: 0.8rem; opacity: 0.7;">İlk planınızı oluşturun</p>
        </div>
      `;
      savedPlans = [];
      return;
    }

    // Global savedPlans array'ini güncelle
    savedPlans = data.plans;

    // Planları tarihe göre sırala (en yeni üstte)
    const sortedPlans = [...savedPlans].sort(
      (a, b) => new Date(b.plan_date) - new Date(a.plan_date)
    );

    // Son 8 planı göster (daha fazla gösteriyoruz)
    sortedPlans.slice(0, 8).forEach((plan, index) => {
      const planItem = createSavedPlanItem(plan);
      // Animasyon için delay ekle
      planItem.style.opacity = "0";
      planItem.style.transform = "translateY(10px)";
      savedPlansList.appendChild(planItem);

      setTimeout(() => {
        planItem.style.transition = "all 0.3s ease";
        planItem.style.opacity = "1";
        planItem.style.transform = "translateY(0)";
      }, index * 50);
    });

    // Eğer 8'den fazla plan varsa "Daha fazla" linki ekle
    if (sortedPlans.length > 8) {
      const moreDiv = document.createElement("div");
      moreDiv.style.textAlign = "center";
      moreDiv.style.padding = "1rem";
      moreDiv.innerHTML = `
        <span style="color: #667eea; font-size: 0.9rem; cursor: pointer;" onclick="showAllPlans()">
          <i class="fas fa-chevron-down" style="margin-right: 0.5rem;"></i>
          ${sortedPlans.length - 8} plan daha göster
        </span>
      `;
      savedPlansList.appendChild(moreDiv);
    }
  } catch (error) {
    console.error("Load saved plans error:", error);
    const savedPlansList = document.getElementById("saved-plans-list");
    savedPlansList.innerHTML = `
      <div style="text-align: center; color: #e53e3e; padding: 2rem;">
        <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 0.5rem;"></i>
        <p style="font-size: 0.95rem; margin-bottom: 0.5rem;">Planlar yüklenirken hata</p>
        <button onclick="loadSavedPlans()" style="padding: 0.5rem 1rem; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.8rem;">
          <i class="fas fa-redo" style="margin-right: 0.5rem;"></i>Tekrar Dene
        </button>
      </div>
    `;
  }
}

// Tüm planları göster
function showAllPlans() {
  const savedPlansList = document.getElementById("saved-plans-list");
  savedPlansList.innerHTML = "";

  // Planları tarihe göre sırala (en yeni üstte)
  const sortedPlans = [...savedPlans].sort(
    (a, b) => new Date(b.plan_date) - new Date(a.plan_date)
  );

  sortedPlans.forEach((plan, index) => {
    const planItem = createSavedPlanItem(plan);
    // Animasyon için delay ekle
    planItem.style.opacity = "0";
    planItem.style.transform = "translateY(10px)";
    savedPlansList.appendChild(planItem);

    setTimeout(() => {
      planItem.style.transition = "all 0.3s ease";
      planItem.style.opacity = "1";
      planItem.style.transform = "translateY(0)";
    }, index * 30);
  });

  // "Daha az göster" linki ekle
  const lessDiv = document.createElement("div");
  lessDiv.style.textAlign = "center";
  lessDiv.style.padding = "1rem";
  lessDiv.innerHTML = `
    <span style="color: #667eea; font-size: 0.9rem; cursor: pointer;" onclick="loadSavedPlans()">
      <i class="fas fa-chevron-up" style="margin-right: 0.5rem;"></i>
      Daha az göster
    </span>
  `;
  savedPlansList.appendChild(lessDiv);
}

// Kayıtlı plan item'ı oluştur
function createSavedPlanItem(plan) {
  const div = document.createElement("div");
  div.className = "saved-plan-item";
  div.onclick = () => loadSavedPlan(plan);

  const date = formatDate(plan.plan_date);
  const createdDate = new Date(plan.created_at).toLocaleDateString("tr-TR");

  // Plan içeriğinden başlık çıkarmaya çalış
  const planTitle = extractPlanTitle(plan.content) || `Plan - ${date}`;

  // Başlığı kısalt (çok uzunsa)
  const truncatedTitle =
    planTitle.length > 50 ? planTitle.substring(0, 50) + "..." : planTitle;

  div.innerHTML = `
    <div class="plan-item-header">
      <span class="plan-title" title="${planTitle}">${truncatedTitle}</span>
      <span class="plan-date">${new Date(plan.plan_date).toLocaleDateString(
        "tr-TR"
      )}</span>
    </div>
    <div class="plan-time">
      <i class="fas fa-clock" style="margin-right: 4px; opacity: 0.7;"></i>
      ${createdDate}
    </div>
  `;

  return div;
}

// Plan içeriğinden başlık çıkar
function extractPlanTitle(content) {
  const match = content.match(/<h1>(.*?)<\/h1>|^#\s*(.*?)$/m);
  if (match) {
    return match[1] || match[2];
  }

  // H1 yoksa ilk birkaç kelimeyi al
  const textOnly = content.replace(/<[^>]*>/g, "").trim();
  const words = textOnly.split(" ").slice(0, 5).join(" ");
  return words.length > 50 ? words.substring(0, 50) + "..." : words;
}

// Kayıtlı planı yükle
function loadSavedPlan(plan) {
  // Plan çıktısını göster
  displayPlanOutput(plan.content, plan.plan_date);

  // Current plan'ı güncelle
  currentPlan = {
    content: plan.content,
    date: plan.plan_date,
    timestamp: new Date(plan.created_at),
  };

  // Plan başlığını çıkar ve mesajda göster
  const planTitle = extractPlanTitle(plan.content) || "Plan";
  addMessageToChat(`📋 "${planTitle}" planı yüklendi.`, "bot");
}

// Mevcut planı chat area'ya yükle (dashboard'dan düzenleme için)
function displayExistingPlan(plan) {
  // Plan çıktısını göster
  displayPlanOutput(plan.content, plan.plan_date);

  // Current plan'ı güncelle
  currentPlan = {
    content: plan.content,
    date: plan.plan_date,
    timestamp: new Date(plan.created_at),
  };

  // Plan başlığını çıkar ve mesajda göster
  const planTitle = extractPlanTitle(plan.content) || "Plan";
  addMessageToChat(
    `📋 "${planTitle}" planı düzenleme için yüklendi. İstediğiniz değişiklikleri belirtebilirsiniz.`,
    "bot"
  );
}
