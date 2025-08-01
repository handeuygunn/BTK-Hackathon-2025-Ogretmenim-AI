// Öğrenci Analizleri JavaScript

// Dummy öğrenci verileri
const dummyStudents = [
  {
    id: 1,
    name: "Ali Yılmaz",
    age: 5,
    avatar: "👦",
    notes: [
      {
        id: 1,
        content:
          "Bugün çok aktif ve enerjikti. Diğer çocuklarla iyi etkileşim kurdu.",
        category: "sosyal",
        date: "2024-01-15",
        categoryLabel: "Sosyal Beceriler",
      },
      {
        id: 2,
        content:
          "Matematik etkinliklerinde zorlanıyor, ekstra destek gerekebilir.",
        category: "akademik",
        date: "2024-01-10",
        categoryLabel: "Akademik",
      },
    ],
  },
  {
    id: 2,
    name: "Zeynep Kaya",
    age: 4,
    avatar: "👧",
    notes: [
      {
        id: 3,
        content: "Çok yaratıcı bir çocuk. Resim yapmayı çok seviyor.",
        category: "yaraticilik",
        date: "2024-01-14",
        categoryLabel: "Yaratıcılık",
      },
    ],
  },
  {
    id: 3,
    name: "Mehmet Demir",
    age: 5,
    avatar: "👦",
    notes: [
      {
        id: 4,
        content:
          "Bazen içine kapanık oluyor. Sosyal aktivitelere katılımı artırılmalı.",
        category: "sosyal",
        date: "2024-01-12",
        categoryLabel: "Sosyal Beceriler",
      },
    ],
  },
  {
    id: 4,
    name: "Ayşe Özkan",
    age: 4,
    avatar: "👧",
    notes: [],
  },
  {
    id: 5,
    name: "Can Arslan",
    age: 5,
    avatar: "👦",
    notes: [
      {
        id: 5,
        content:
          "Liderlik özellikleri gösteriyor. Grup etkinliklerini yönetmeyi seviyor.",
        category: "sosyal",
        date: "2024-01-13",
        categoryLabel: "Sosyal Beceriler",
      },
    ],
  },
  {
    id: 6,
    name: "Elif Yıldız",
    age: 4,
    avatar: "👧",
    notes: [],
  },
];

let selectedStudent = null;
let currentNotes = [];

// Sayfa yüklendiğinde çalışacak fonksiyon
document.addEventListener("DOMContentLoaded", function () {
  loadStudents();
  setupSearchFunctionality();
  setupEnterKeyForChat();
});

// Öğrencileri yükle
function loadStudents() {
  const studentsList = document.getElementById("students-list");
  studentsList.innerHTML = "";

  dummyStudents.forEach((student) => {
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
            <span>${student.age} yaş</span>
        </div>
    `;

  return div;
}

// Öğrenci seç
function selectStudent(student) {
  selectedStudent = student;
  currentNotes = [...student.notes];

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
  document.getElementById(
    "selected-student-age"
  ).textContent = `${student.age} yaş`;

  // Chat'i sıfırla
  resetChat();

  // Notları yükle
  loadNotes();

  // Chat tab'ını aktif yap
  switchTab("chat");
}

// Chat'i sıfırla
function resetChat() {
  const chatMessages = document.getElementById("chat-messages");
  chatMessages.innerHTML = `
        <div class="chat-message bot-message">
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <p>Merhaba! ${selectedStudent.name} hakkında ne öğrenmek istiyorsunuz?</p>
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
    // API'ye mesaj gönder
    const response = await fetch("/api/analiz", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: message,
        student_id: selectedStudent.id,
        student_name: selectedStudent.name,
      }),
    });

    const data = await response.json();

    // Loading'i kaldır
    loadingDiv.remove();

    if (data.success) {
      // Bot cevabını ekle
      addMessageToChat(data.response, "bot");
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

  const filteredStudents = dummyStudents.filter((student) =>
    student.name.toLowerCase().includes(searchTerm)
  );

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
function saveNote() {
  const noteText = document.getElementById("note-text").value.trim();
  const noteCategory = document.getElementById("note-category").value;

  if (!noteText) {
    alert("Lütfen gözlem metnini girin.");
    return;
  }

  if (!selectedStudent) {
    alert("Lütfen önce bir öğrenci seçin.");
    return;
  }

  const categoryLabels = {
    genel: "Genel",
    sosyal: "Sosyal Beceriler",
    akademik: "Akademik",
    yaraticilik: "Yaratıcılık",
    davranis: "Davranış",
  };

  const newNote = {
    id: Date.now(),
    content: noteText,
    category: noteCategory,
    categoryLabel: categoryLabels[noteCategory],
    date: new Date().toISOString().split("T")[0],
  };

  // Not'u ekle
  currentNotes.unshift(newNote);
  selectedStudent.notes.unshift(newNote);

  // Notları yeniden yükle
  loadNotes();

  // Modal'ı kapat
  closeNoteModal();

  // Başarı mesajı (isteğe bağlı)
  console.log("Not kaydedildi:", newNote);
}

// Modal dışına tıklandığında kapat
document.addEventListener("click", function (e) {
  const modal = document.getElementById("note-modal");
  if (e.target === modal) {
    closeNoteModal();
  }
});
