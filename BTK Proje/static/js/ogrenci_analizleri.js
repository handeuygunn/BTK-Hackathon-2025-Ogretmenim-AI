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
      students = data.students.map(student => ({
        id: student.id,
        name: `${student.name} ${student.surname}`,
        age: calculateAge(student.birth_date) || 5, // Eğer yaş yoksa varsayılan 5
        avatar: getRandomAvatar(),
        class: student.class_name || student.sinif,
        notes: [] // Notlar ayrı API'den gelecek
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

// Yaş hesapla (doğum tarihinden)
function calculateAge(birthDate) {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
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
            <span>${student.age} yaş</span>
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
  document.getElementById(
    "selected-student-age"
  ).textContent = `${student.age} yaş`;

  // Chat'i sıfırla
  resetChat();

  // Notları API'den yükle
  loadNotesFromAPI(student.id);

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

  try {
    // API'ye notu gönder
    const response = await fetch("/api/student-notes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        student_id: selectedStudent.id,
        content: noteText,
        category: noteCategory
      }),
    });

    const data = await response.json();

    if (data.success) {
      // Başarılı kayıt sonrası notları yeniden yükle
      await loadNotesFromAPI(selectedStudent.id);
      
      // Modal'ı kapat
      closeNoteModal();
      
      // Başarı mesajı göster
      showSuccessMessage("Gözlem başarıyla kaydedildi!");
    } else {
      alert("Not kaydedilirken hata oluştu: " + data.error);
    }
  } catch (error) {
    console.error("API hatası:", error);
    alert("Bağlantı hatası oluştu. Lütfen tekrar deneyin.");
  }
}

// Başarı mesajı göster
function showSuccessMessage(message) {
  // Basit bir toast notification göster
  const toast = document.createElement("div");
  toast.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    background: #48bb78;
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 1000;
    animation: slideIn 0.3s ease;
  `;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Modal dışına tıklandığında kapat
document.addEventListener("click", function (e) {
  const modal = document.getElementById("note-modal");
  if (e.target === modal) {
    closeNoteModal();
  }
});
