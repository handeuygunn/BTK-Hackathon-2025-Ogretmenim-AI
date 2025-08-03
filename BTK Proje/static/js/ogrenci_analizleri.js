// Öğrenci Analizleri JavaScript

let students = []; // Gerçek öğrenci verileri API'den gelecek
let selectedStudent = null;
let currentNotes = [];

// Sayfa yüklendiğinde çalışacak fonksiyon
document.addEventListener("DOMContentLoaded", function () {
  loadStudentsFromAPI();
  setupSearchFunctionality();
  setupEnterKeyForChat();
});

// API'den öğrencileri yükle
async function loadStudentsFromAPI() {
  try {
    const response = await fetch("/api/students");
    const data = await response.json();

    if (data.success) {
      students = data.students.map((student) => ({
        id: student.id,
        name: `${student.name} ${student.surname}`,
        avatar: getRandomAvatar(),
        class: student.class_name || student.sinif,
        notes: [], // Notlar ayrı API'den gelecek
      }));
      loadStudents();
    } else {
      console.error("Öğrenci verilerini yüklerken hata:", data.error);
      // Fallback olarak boş liste göster
      students = [];
      loadStudents();
    }
  } catch (error) {
    console.error("API hatası:", error);
    // Fallback olarak boş liste göster
    students = [];
    loadStudents();
  }
}

// Rastgele avatar seç
function getRandomAvatar() {
  const avatars = ["👦", "👧"];
  return avatars[Math.floor(Math.random() * avatars.length)];
}

// Öğrencileri yükle
function loadStudents() {
  const studentsList = document.getElementById("students-list");
  studentsList.innerHTML = "";

  if (students.length === 0) {
    studentsList.innerHTML = `
      <div class="no-students">
        <i class="fas fa-users"></i>
        <p>Henüz öğrenci bulunmuyor</p>
      </div>
    `;
    return;
  }

  students.forEach((student) => {
    const studentItem = createStudentItem(student);
    studentsList.appendChild(studentItem);
  });
}

// Öğrenci item'ı oluştur
function createStudentItem(student) {
  const div = document.createElement("div");
  div.className = "student-item";
  div.onclick = () => selectStudent(student);

  div.innerHTML = `
        <div class="student-avatar">${student.avatar}</div>
        <div class="student-details">
            <h4>${student.name}</h4>
            <span>${student.class || "Anaokulu"}</span>
        </div>
    `;

  return div;
}

// Öğrenci seç
function selectStudent(student) {
  selectedStudent = student;

  // Önceki seçimi temizle
  document.querySelectorAll(".student-item").forEach((item) => {
    item.classList.remove("active");
  });

  // Yeni seçimi işaretle
  event.currentTarget.classList.add("active");

  // Welcome state'i gizle, analysis panelini göster
  document.getElementById("welcome-state").style.display = "none";
  document.getElementById("student-analysis").style.display = "flex";

  // Öğrenci bilgilerini güncelle
  document.getElementById("selected-student-name").textContent = student.name;

  // Önce notları yükle, sonra chat'i başlat
  loadNotesFromAPI(student.id).then(() => {
    // Notlar yüklendikten sonra chat'i sıfırla ki doğru bilgiyi göstersin
    resetChat();
  });

  // Chat tab'ını aktif yap
  switchTab("chat");
}

// API'den notları yükle
async function loadNotesFromAPI(studentId) {
  try {
    const response = await fetch(`/api/student-notes/${studentId}`);
    const data = await response.json();

    if (data.success) {
      currentNotes = data.notes;
      console.log(`DEBUG: ${currentNotes.length} gözlem yüklendi`);
    } else {
      console.error("Notları yüklerken hata:", data.error);
      currentNotes = [];
    }
  } catch (error) {
    console.error("API hatası:", error);
    currentNotes = [];
  }

  // Notları göster
  loadNotes();
}

// Chat'i sıfırla
function resetChat() {
  const chatMessages = document.getElementById("chat-messages");

  // Gözlem sayısını kontrol et
  const observationCount = currentNotes.length;
  const observationInfo =
    observationCount > 0
      ? `Bu öğrenci hakkında ${observationCount} gözlemim var ve sorularınızı cevaplanırken bunları dikkate alacağım.`
      : "Bu öğrenci hakkında henüz gözlemim bulunmuyor, genel deneyimlerimle yardımcı olacağım.";

  chatMessages.innerHTML = `
        <div class="chat-message bot-message">
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <div>
                  <p><strong>Merhaba!</strong> ${selectedStudent.name} hakkında ne öğrenmek istiyorsunuz?</p>
                  <p style="font-size: 0.9rem; color: #718096; margin-top: 0.5rem;">
                    📝 ${observationInfo}
                  </p>
                </div>
            </div>
        </div>
    `;

  // Input'u temizle
  document.getElementById("chat-input").value = "";
}

// Tab değiştir
function switchTab(tabName) {
  // Tüm tab butonlarını pasif yap
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.remove("active");
  });

  // Tüm tab içeriklerini gizle
  document.querySelectorAll(".tab-content").forEach((content) => {
    content.classList.remove("active");
  });

  // Seçilen tab'ı aktif yap
  document
    .querySelector(`[onclick="switchTab('${tabName}')"]`)
    .classList.add("active");
  document.getElementById(`${tabName}-tab`).classList.add("active");

  // Progress tab'ına geçildiğinde gelişim analizini yükle
  if (tabName === "progress" && selectedStudent) {
    loadStudentProgress();
  }
}

// Öğrenci gelişim analizi yükle
async function loadStudentProgress() {
  console.log("DEBUG: loadStudentProgress çağrıldı");

  if (!selectedStudent) {
    console.error("DEBUG: Seçili öğrenci yok");
    return;
  }

  const progressContainer = document.querySelector(
    "#progress-tab .progress-cards"
  );
  if (!progressContainer) {
    console.error("DEBUG: Progress container bulunamadı");
    return;
  }

  // Loading göster
  progressContainer.innerHTML = `
    <div style="text-align: center; padding: 3rem; color: #718096; grid-column: 1 / -1;">
      <i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: #667eea; margin-bottom: 1rem;"></i>
      <p style="font-size: 1.1rem; margin-bottom: 0.5rem;">Gemini AI Gelişim Analizi</p>
      <p style="font-size: 0.9rem;">${selectedStudent.name} için detaylı analiz yapılıyor...</p>
    </div>
  `;

  try {
    console.log(
      `DEBUG: ${selectedStudent.id} için gelişim analizi getiriliyor...`
    );

    const response = await fetch(
      `/api/student-progress/${selectedStudent.id}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();
    console.log("DEBUG: Progress API Response:", data);

    if (data.success) {
      displayStudentProgress(data);
    } else {
      throw new Error(data.error || "Gelişim analizi yüklenirken hata oluştu");
    }
  } catch (error) {
    console.error("DEBUG: Progress API hatası:", error);
    progressContainer.innerHTML = `
      <div style="text-align: center; padding: 3rem; color: #e53e3e; grid-column: 1 / -1;">
        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
        <p style="font-size: 1.1rem; margin-bottom: 0.5rem;">Analiz Hatası</p>
        <p style="font-size: 0.9rem; margin-bottom: 1rem;">Gelişim analizi yüklenirken hata oluştu</p>
        <button onclick="loadStudentProgress()" style="padding: 0.75rem 1.5rem; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.9rem;">
          <i class="fas fa-redo"></i> Tekrar Dene
        </button>
      </div>
    `;
  }
}

// Gelişim analizini göster
function displayStudentProgress(data) {
  console.log("DEBUG: displayStudentProgress çağrıldı", data);

  const progressContainer = document.querySelector(
    "#progress-tab .progress-cards"
  );

  // Puan renklerini belirle
  function getScoreColor(score) {
    if (score >= 80) return "#22c55e"; // Yeşil
    if (score >= 60) return "#eab308"; // Sarı
    if (score >= 40) return "#f97316"; // Turuncu
    return "#ef4444"; // Kırmızı
  }

  // Puan seviyesini belirle
  function getScoreLevel(score) {
    if (score >= 80) return "Mükemmel";
    if (score >= 60) return "İyi";
    if (score >= 40) return "Orta";
    return "Geliştirilmeli";
  }

  // Progress card'ları oluştur
  const progressCards = [
    { key: "yaraticilik", title: "Yaratıcılık", icon: "🎨" },
    { key: "sosyal", title: "Sosyal Beceriler", icon: "🤝" },
    { key: "genel", title: "Genel Gelişim", icon: "📈" },
    { key: "davranis", title: "Davranış", icon: "😊" },
    { key: "akademik", title: "Akademik Gelişim", icon: "📚" },
  ];

  let progressHTML = "";

  progressCards.forEach((card) => {
    const score = data.scores[card.key] || 75;
    const color = getScoreColor(score);
    const level = getScoreLevel(score);

    progressHTML += `
      <div class="progress-card">
        <div class="progress-icon">${card.icon}</div>
        <div class="progress-info">
          <h5>${card.title}</h5>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${score}%; background: linear-gradient(135deg, ${color}, ${color}AA);"></div>
          </div>
          <div class="progress-score">
            <span style="color: ${color}; font-weight: 600;">${level}</span>
            <span style="float: right; color: #4a5568; font-weight: 600;">${score}/100</span>
          </div>
        </div>
      </div>
    `;
  });

  // Gemini analizini ekle
  const formattedAnalysis = formatMarkdownToHTML(data.analysis);

  progressHTML += `
    <div class="progress-analysis" style="grid-column: 1 / -1;">
      <h4>
        <i class="fas fa-robot" style="color: #667eea; margin-right: 0.5rem;"></i>
        Gemini AI Gelişim Analizi
      </h4>
      <div class="analysis-content">${formattedAnalysis}</div>
    </div>
  `;

  progressContainer.innerHTML = progressHTML;

  // Progress bar animasyonları için delay ekle
  setTimeout(() => {
    document.querySelectorAll(".progress-fill").forEach((fill, index) => {
      setTimeout(() => {
        fill.style.transform = "scaleX(1)";
      }, index * 200);
    });
  }, 100);
}

// Mesaj gönder
async function sendMessage() {
  const input = document.getElementById("chat-input");
  const message = input.value.trim();

  if (!message || !selectedStudent) return;

  // Kullanıcı mesajını ekle
  addMessageToChat(message, "user");
  input.value = "";

  // Loading göster
  const loadingDiv = addLoadingMessage();

  try {
    // Öğrencinin mevcut gözlemlerini al
    const studentObservations = currentNotes.map((note) => ({
      content: note.content,
      category: note.categoryLabel,
      date: note.date,
    }));

    console.log(
      `DEBUG: ${selectedStudent.name} için ${studentObservations.length} gözlem gönderiliyor:`,
      studentObservations
    );

    // API'ye mesaj gönder (gözlemlerle birlikte)
    const response = await fetch("/api/analiz", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: message,
        student_id: selectedStudent.id,
        student_name: selectedStudent.name,
        student_observations: studentObservations,
      }),
    });

    const data = await response.json();
    console.log("DEBUG: API Response:", data);

    // Loading'i kaldır
    loadingDiv.remove();

    if (data.success) {
      // Gözlem sayısını göster (eğer varsa)
      let botMessage = data.response;
      if (data.observations_count > 0) {
        console.log(`DEBUG: ${data.observations_count} gözlem kullanıldı`);
      }

      // Bot cevabını ekle
      addMessageToChat(botMessage, "bot");
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

  // Bot mesajlarında Markdown formatını HTML'e çevir
  const formattedMessage =
    sender === "bot" ? formatMarkdownToHTML(message) : message;

  messageDiv.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">
            <div>${formattedMessage}</div>
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
            <p>Düşünüyorum... <i class="fas fa-spinner fa-spin"></i></p>
        </div>
    `;

  chatMessages.appendChild(loadingDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  return loadingDiv;
}

// Enter tuşu ile mesaj gönderme
function setupEnterKeyForChat() {
  document
    .getElementById("chat-input")
    .addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        sendMessage();
      }
    });
}

// Arama fonksiyonalitesi
function setupSearchFunctionality() {
  const searchInput = document.getElementById("student-search");
  searchInput.addEventListener("input", function (e) {
    const searchTerm = e.target.value.toLowerCase();
    filterStudents(searchTerm);
  });
}

// Öğrencileri filtrele
function filterStudents(searchTerm) {
  const studentsList = document.getElementById("students-list");
  studentsList.innerHTML = "";

  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchTerm)
  );

  if (filteredStudents.length === 0) {
    studentsList.innerHTML = `
      <div class="no-students">
        <i class="fas fa-search"></i>
        <p>Arama kriterine uygun öğrenci bulunamadı</p>
      </div>
    `;
    return;
  }

  filteredStudents.forEach((student) => {
    const studentItem = createStudentItem(student);
    studentsList.appendChild(studentItem);
  });
}

// Notları yükle
function loadNotes() {
  const notesList = document.getElementById("notes-list");
  notesList.innerHTML = "";

  if (currentNotes.length === 0) {
    notesList.innerHTML = `
            <div style="text-align: center; color: #718096; padding: 2rem;">
                <i class="fas fa-sticky-note" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                <p>Henüz gözlem eklenmemiş.</p>
            </div>
        `;
    return;
  }

  currentNotes.forEach((note) => {
    const noteItem = createNoteItem(note);
    notesList.appendChild(noteItem);
  });
}

// Not item'ı oluştur
function createNoteItem(note) {
  const div = document.createElement("div");
  div.className = "note-item";

  const date = new Date(note.date).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  div.innerHTML = `
        <div class="note-header">
            <span class="note-category">${note.categoryLabel}</span>
            <span class="note-date">${date}</span>
            <button class="delete-note-btn" onclick="deleteNote(${note.id})" title="Gözlemi Sil">
                <i class="fas fa-trash"></i>
            </button>
        </div>
        <div class="note-content">${note.content}</div>
    `;

  return div;
}

// Yeni not ekle modal
function addNewNote() {
  document.getElementById("note-modal").classList.add("active");
  document.getElementById("note-text").value = "";
  document.getElementById("note-category").value = "genel";
}

// Note modal'ını kapat
function closeNoteModal() {
  document.getElementById("note-modal").classList.remove("active");
}

// Notu kaydet
async function saveNote() {
  console.log("DEBUG: saveNote fonksiyonu çağrıldı");

  const noteText = document.getElementById("note-text").value.trim();
  const noteCategory = document.getElementById("note-category").value;

  console.log("DEBUG: noteText:", noteText);
  console.log("DEBUG: noteCategory:", noteCategory);
  console.log("DEBUG: selectedStudent:", selectedStudent);

  if (!noteText) {
    alert("Lütfen gözlem metnini girin.");
    return;
  }

  if (!selectedStudent) {
    alert("Lütfen önce bir öğrenci seçin.");
    return;
  }

  // Loading göster
  const saveButton = document.querySelector("#note-modal .save-btn");
  if (!saveButton) {
    console.error("DEBUG: Save button bulunamadı!");
    return;
  }

  const originalText = saveButton.textContent;
  saveButton.textContent = "Kaydediliyor...";
  saveButton.disabled = true;

  try {
    console.log("DEBUG: Gözlem kaydediliyor...", {
      student_id: selectedStudent.id,
      content: noteText,
      category: noteCategory,
    });

    // API'ye gözlemi gönder - Gemini formatlaması ile
    const response = await fetch("/api/student-notes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        student_id: selectedStudent.id,
        content: noteText,
        category: noteCategory,
      }),
    });

    const data = await response.json();
    console.log("DEBUG: API Response:", data);

    if (data.success) {
      // Gemini'nin formatladığı gözlemi göster
      if (data.formatted_content) {
        showFormattedObservation(
          data.original_content,
          data.formatted_content,
          data.original_category,
          data.gemini_response
        );
      }

      // Notları yeniden yükle ve chat'i güncelle
      await loadNotesFromAPI(selectedStudent.id);

      // Chat'i güncelle (gözlem sayısı değiştiği için)
      if (
        document
          .querySelector(".tab-btn.active")
          ?.textContent.includes("Analiz Sohbeti")
      ) {
        updateChatWithNewObservationCount();
      }

      // Modal'ı kapat
      closeNoteModal();

      // Başarı mesajı göster
      showSuccessMessage(
        "Gözlem Gemini AI tool call ile formatlandı ve kaydedildi!"
      );
    } else {
      alert("Gözlem kaydedilirken hata oluştu: " + data.error);
    }
  } catch (error) {
    console.error("API hatası:", error);
    alert("Bağlantı hatası oluştu. Lütfen tekrar deneyin.");
  } finally {
    // Button'ı eski haline döndür
    saveButton.textContent = originalText;
    saveButton.disabled = false;
  }
}

// Gözlemi sil
async function deleteNote(noteId) {
  if (!confirm("Bu gözlemi silmek istediğinizden emin misiniz?")) {
    return;
  }

  // Delete butonunu devre dışı bırak
  const deleteButton = document.querySelector(`button[onclick="deleteNote(${noteId})"]`);
  if (deleteButton) {
    deleteButton.disabled = true;
    deleteButton.textContent = "Siliniyor...";
  }

  try {
    console.log(`DEBUG: Gözlem siliniyor... ID: ${noteId}`);

    const response = await fetch(`/api/student-notes/${noteId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("DEBUG: Delete API Response:", data);

    if (data.success) {
      // Notları yeniden yükle
      await loadNotesFromAPI(selectedStudent.id);

      // Chat'i güncelle (gözlem sayısı değiştiği için)
      if (
        document
          .querySelector(".tab-btn.active")
          ?.textContent.includes("Analiz Sohbeti")
      ) {
        updateChatWithNewObservationCount();
      }

      // Başarı mesajı göster
      showSuccessMessage("Gözlem başarıyla silindi!");
    } else {
      throw new Error(data.error || "Silme işlemi başarısız");
    }
  } catch (error) {
    console.error("API hatası:", error);
    
    // Hata mesajını daha anlaşılır yap
    let errorMessage = "Bağlantı hatası oluştu. Lütfen tekrar deneyin.";
    if (error.message && error.message !== "Failed to fetch") {
      errorMessage = error.message;
    }
    
    alert(errorMessage);
    
    // Delete butonunu tekrar aktif et
    if (deleteButton) {
      deleteButton.disabled = false;
      deleteButton.textContent = "🗑️";
    }
  }
}

// Chat'i yeni gözlem sayısıyla güncelle
function updateChatWithNewObservationCount() {
  const chatMessages = document.getElementById("chat-messages");
  const firstBotMessage = chatMessages.querySelector(".bot-message");

  if (firstBotMessage && selectedStudent) {
    const observationCount = currentNotes.length;
    const observationInfo =
      observationCount > 0
        ? `Bu öğrenci hakkında ${observationCount} gözlemim var ve sorularınızı cevaplanırken bunları dikkate alacağım.`
        : "Bu öğrenci hakkında henüz gözlemim bulunmuyor, genel deneyimlerimle yardımcı olacağım.";

    firstBotMessage.innerHTML = `
      <div class="message-avatar">
        <i class="fas fa-robot"></i>
      </div>
      <div class="message-content">
        <div>
          <p><strong>Merhaba!</strong> ${selectedStudent.name} hakkında ne öğrenmek istiyorsunuz?</p>
          <p style="font-size: 0.9rem; color: #718096; margin-top: 0.5rem;">
            📝 ${observationInfo}
          </p>
        </div>
      </div>
    `;
  }
}

// Modal dışına tıklandığında kapat
document.addEventListener("click", function (e) {
  const modal = document.getElementById("note-modal");
  if (e.target === modal) {
    closeNoteModal();
  }
});

// Markdown formatını HTML'e çevir
function formatMarkdownToHTML(text) {
  if (!text) return "";

  // Markdown'ı HTML'e çevir
  let formatted = text
    // Bold text (**text** → <strong>text</strong>)
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    // Italic text (*text* → <em>text</em>)
    .replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, "<em>$1</em>")
    // Headers (### text → <h3>text</h3>)
    .replace(/^### (.*$)/gim, "<h3>$1</h3>")
    .replace(/^## (.*$)/gim, "<h2>$1</h2>")
    .replace(/^# (.*$)/gim, "<h1>$1</h1>")
    // Lists (- item → <li>item</li>)
    .replace(/^[\s]*[-•]\s+(.*$)/gim, "<li>$1</li>")
    // Numbered lists (1. item → <li>item</li>)
    .replace(/^[\s]*\d+\.\s+(.*$)/gim, "<li>$1</li>")
    // Line breaks (double newline → paragraph break)
    .replace(/\n\s*\n/g, "</p><p>")
    // Single line breaks
    .replace(/\n/g, "<br>");

  // Wrap consecutive <li> elements in <ul>
  formatted = formatted.replace(
    /(<li>.*?<\/li>(?:\s*<li>.*?<\/li>)*)/gs,
    "<ul>$1</ul>"
  );

  // Wrap in paragraph if not already wrapped
  if (
    !formatted.startsWith("<h") &&
    !formatted.startsWith("<ul") &&
    !formatted.startsWith("<p>")
  ) {
    formatted = "<p>" + formatted + "</p>";
  }

  return formatted;
}
