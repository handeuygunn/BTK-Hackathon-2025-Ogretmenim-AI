let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let selectedDate = null;
let dailyPlans = []; 
let currentSelectedPlan = null; 

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

// Takvimi başlat
async function initializeCalendar() {
  await loadDailyPlans(); // Günlük planları yükle
  generateCalendar(currentMonth, currentYear);

  // Bugünün planını göster
  const today = new Date();
  const todayString = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const todayPlan = dailyPlans.find((plan) => plan.plan_date === todayString);
  updatePlanPanel(today, todayPlan);

  // Bugünü seç
  setTimeout(() => {
    const todayElement = document.querySelector(".calendar-day.today");
    if (todayElement) {
      todayElement.classList.add("selected");
      selectedDate = today;
    }
  }, 100);
}

// Takvim oluştur
function generateCalendar(month, year) {
  const monthYearElement = document.getElementById("month-year");
  const calendarDaysElement = document.getElementById("calendar-days");

  if (!monthYearElement || !calendarDaysElement) return;

  // Başlık güncelle
  monthYearElement.textContent = `${months[month]} ${year}`;

  // Ayın ilk günü ve son günü
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  // Pazartesi'yi 0 yapmak için (0=Pazar -> 6=Pazartesi olarak düzenle)
  const startingDayOfWeek = (firstDay.getDay() + 6) % 7;

  // Önceki ayın son günleri
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const daysInPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate();

  // Calendar days container'ı temizle
  calendarDaysElement.innerHTML = "";

  // Önceki ayın günleri
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const dayElement = createDayElement(
      daysInPrevMonth - i,
      "other-month",
      prevMonth,
      prevYear
    );
    calendarDaysElement.appendChild(dayElement);
  }

  // Bu ayın günleri
  const today = new Date();
  for (let day = 1; day <= daysInMonth; day++) {
    const isToday =
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear();

    const dayElement = createDayElement(
      day,
      isToday ? "today" : "",
      month,
      year
    );
    calendarDaysElement.appendChild(dayElement);
  }

  // Sonraki ayın günleri (42 hücreyi doldur)
  const cellsUsed = startingDayOfWeek + daysInMonth;
  const remainingCells = 42 - cellsUsed;
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;

  for (let day = 1; day <= remainingCells; day++) {
    const dayElement = createDayElement(
      day,
      "other-month",
      nextMonth,
      nextYear
    );
    calendarDaysElement.appendChild(dayElement);
  }
}

// Gün elementi oluştur
function createDayElement(day, className, month, year) {
  const dayElement = document.createElement("div");
  dayElement.className = `calendar-day ${className}`;
  dayElement.textContent = day;

  // Tarih string'i oluştur
  const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(
    day
  ).padStart(2, "0")}`;

  // Bu tarih için plan var mı kontrol et
  const planForDate = dailyPlans.find((plan) => plan.plan_date === dateString);
  if (planForDate && !className.includes("other-month")) {
    dayElement.classList.add("has-plan");
    dayElement.title = "Bu tarih için günlük plan mevcut";
  }

  // Tıklama olayı ekle
  dayElement.addEventListener("click", (event) => {
    selectDate(day, month, year, event, planForDate);
  });

  return dayElement;
}

// Tarih seç
function selectDate(day, month, year, event, planForDate = null) {
  // Önceki seçimi kaldır
  const prevSelected = document.querySelector(".calendar-day.selected");
  if (prevSelected) {
    prevSelected.classList.remove("selected");
  }

  // Yeni seçimi işaretle
  event.target.classList.add("selected");
  selectedDate = new Date(year, month, day);

  console.log("Seçilen tarih:", selectedDate.toLocaleDateString("tr-TR"));

  // Sağ paneli güncelle
  updatePlanPanel(selectedDate, planForDate);

  // Eğer bu tarih için plan varsa ve modal açma isteniyorsa
  if (planForDate && event.detail === 2) {
    // Double click için modal aç
    showPlanModal(planForDate);
  }
}

// Önceki ay
function previousMonth() {
  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  generateCalendar(currentMonth, currentYear);
}

// Sonraki ay
function nextMonth() {
  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  generateCalendar(currentMonth, currentYear);
}

// Bugüne git
function goToToday() {
  const today = new Date();
  currentMonth = today.getMonth();
  currentYear = today.getFullYear();
  generateCalendar(currentMonth, currentYear);

  // Bugünü seç
  setTimeout(() => {
    const todayElement = document.querySelector(".calendar-day.today");
    if (todayElement) {
      todayElement.click();
    }
  }, 100);
}

// Sayfa yüklendiğinde takvimi başlat
document.addEventListener("DOMContentLoaded", function () {
  initializeCalendar();
});

// Günlük planları yükle
async function loadDailyPlans() {
  try {
    const response = await fetch("/api/get-daily-plans", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (data.success) {
      dailyPlans = data.plans;
      console.log("Günlük planlar yüklendi:", dailyPlans.length, "plan");
    } else {
      console.error("Günlük planları yükleme hatası:", data.error);
      dailyPlans = [];
    }
  } catch (error) {
    console.error("API hatası:", error);
    dailyPlans = [];
  }
}

// Plan modal'ını göster
function showPlanModal(plan) {
  currentSelectedPlan = plan;

  const modal = document.getElementById("plan-modal");
  const title = document.getElementById("plan-modal-title");
  const body = document.getElementById("plan-modal-body");

  // Tarih formatla
  const planDate = new Date(plan.plan_date).toLocaleDateString("tr-TR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  title.innerHTML = `📅 ${planDate} - Günlük Plan`;

  // Plan içeriğini formatla ve göster
  body.innerHTML = formatPlanContent(plan.content);

  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

// Plan modal'ını kapat
function closePlanModal() {
  const modal = document.getElementById("plan-modal");
  modal.classList.remove("active");
  document.body.style.overflow = "auto";
  currentSelectedPlan = null;
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

// Planı düzenle
function editPlan() {
  if (currentSelectedPlan) {
    // Günlük plan sayfasına yönlendir
    window.location.href = "/gunluk-plan";
  }
}

// Planı sil
async function deletePlan() {
  if (!currentSelectedPlan) return;

  const confirmDelete = confirm("Bu planı silmek istediğinizden emin misiniz?");
  if (!confirmDelete) return;

  try {
    const response = await fetch(
      `/api/delete-daily-plan/${currentSelectedPlan.id}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (data.success) {
      // Başarılı silme
      alert("Plan başarıyla silindi!");
      closePlanModal();

      // Planları yeniden yükle ve takvimi güncelle
      await loadDailyPlans();
      generateCalendar(currentMonth, currentYear);
    } else {
      alert("Plan silme hatası: " + data.error);
    }
  } catch (error) {
    console.error("Plan silme hatası:", error);
    alert("Plan silinirken bir hata oluştu.");
  }
}

document.addEventListener("click", function (event) {
  const modal = document.getElementById("plan-modal");
  if (event.target === modal) {
    closePlanModal();
  }
});

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    closePlanModal();
  }
});

// Sağ paneldeki plan görüntülemesini güncelle
function updatePlanPanel(date, planForDate = null) {
  const titleElement = document.getElementById("selected-date-title");
  const contentElement = document.getElementById("plan-panel-content");

  if (!titleElement || !contentElement) return;

  // Tarih formatla
  const formattedDate = date.toLocaleDateString("tr-TR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Başlığı güncelle
  titleElement.innerHTML = `📅 ${formattedDate}`;

  // İçeriği güncelle
  if (planForDate) {
    contentElement.innerHTML = `
      <div class="plan-content">
        ${formatPlanContent(planForDate.content)}
      </div>
      <div class="plan-actions">
        <button class="plan-action-btn" onclick="showPlanModal(${JSON.stringify(
          planForDate
        ).replace(/"/g, "&quot;")})">
          <i class="fas fa-expand"></i> Detaylar
        </button>
        <button class="plan-action-btn" onclick="editPlanFromPanel()">
          <i class="fas fa-edit"></i> Düzenle
        </button>
      </div>
    `;
  } else {
    contentElement.innerHTML = `
      <div class="no-plan-message">
        <div class="no-plan-icon">📋</div>
        <p>Bu tarih için plan bulunamadı</p>
        <button class="create-plan-btn" onclick="window.location.href='/gunluk-plan'">
          <i class="fas fa-plus"></i> Plan Oluştur
        </button>
      </div>
    `;
  }
}

// Panel'den plan düzenleme
function editPlanFromPanel() {
  if (selectedDate) {
    // Seçili tarihi localStorage'a kaydet ve günlük plan sayfasına git
    localStorage.setItem(
      "editPlanDate",
      selectedDate.toISOString().split("T")[0]
    );
    window.location.href = "/gunluk-plan";
  }
}

// Bugünün planını yenile
function refreshTodayPlan() {
  const today = new Date();
  const todayString = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  // Bugünün planını bul
  const todayPlan = dailyPlans.find((plan) => plan.plan_date === todayString);

  // Panel'i güncelle
  updatePlanPanel(today, todayPlan);

  // Takvimi de güncelle
  currentMonth = today.getMonth();
  currentYear = today.getFullYear();
  generateCalendar(currentMonth, currentYear);

  // Bugünü seç
  setTimeout(() => {
    const todayElement = document.querySelector(".calendar-day.today");
    if (todayElement) {
      todayElement.classList.add("selected");
      selectedDate = today;
    }
  }, 100);
}
