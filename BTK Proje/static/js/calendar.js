// Calendar JavaScript Functions
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let selectedDate = null;

// Ay isimleri (Türkçe)
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
function initializeCalendar() {
  generateCalendar(currentMonth, currentYear);
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
  const startingDayOfWeek = firstDay.getDay();

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

  // Tıklama olayı ekle
  dayElement.addEventListener("click", (event) => {
    selectDate(day, month, year, event);
  });

  return dayElement;
}

// Tarih seç
function selectDate(day, month, year, event) {
  // Önceki seçimi kaldır
  const prevSelected = document.querySelector(".calendar-day.selected");
  if (prevSelected) {
    prevSelected.classList.remove("selected");
  }

  // Yeni seçimi işaretle
  event.target.classList.add("selected");
  selectedDate = new Date(year, month, day);

  console.log("Seçilen tarih:", selectedDate.toLocaleDateString("tr-TR"));
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
