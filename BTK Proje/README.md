# Öğretmenim AI 🎓

Modern öğretmen asistanı platformu - FastAPI ile geliştirilmiş web uygulaması

## 🚀 Özellikler

- **Modern Tasarım**: Responsive ve kullanıcı dostu arayüz
- **6'lı Grid Sistem**: Ana dashboard'da 6 farklı öğretmen aracı
- **FastAPI Backend**: Hızlı ve güvenli API
- **AI Entegrasyonu**: Google Gemini API ile chatbot desteği
- **Görsel Üretimi**: Boyama sayfaları için AI ile görsel oluşturma
- **Animasyonlu UI**: Smooth geçişler ve hover efektleri

## 📁 Proje Yapısı

```
BTK Proje/
├── app.py                    # FastAPI uygulaması
├── requirements.txt          # Python bağımlılıkları
├── README.md                # Proje dokümantasyonu
├── templates/               # HTML şablonları
│   ├── login.html          # Giriş sayfası
│   ├── eceteacher.html     # Ana dashboard
│   └── boyama_sayfasi.html # Boyama sayfası
└── static/                 # Statik dosyalar
    ├── css/                # Stil dosyaları
    │   ├── login.css       # Giriş sayfası stilleri
    │   ├── dashboard.css   # Dashboard stilleri
    │   ├── chatbot.css     # Chatbot modal stilleri
    │   └── boyama_sayfasi.css # Boyama sayfası stilleri
    └── js/                 # JavaScript dosyaları
        ├── chatbot.js      # Chatbot fonksiyonları
        └── boyama_sayfasi.js # Boyama sayfası fonksiyonları
```

## 🎯 Sayfa Yapısı

### 1. Giriş Sayfası (`/login`)

- Modern login formu
- Animated background
- Responsive tasarım

### 2. Ana Dashboard (`/dashboard`)

- 6'lı grid layout
- Her kart farklı öğretmen aracı
- Hover animasyonları
- Modal chatbot'lar

### 3. Boyama Sayfası (`/boyama-sayfasi`)

- Split-screen tasarım
- Sol: Chat arayüzü
- Sağ: Görsel galerisi
- AI ile görsel üretimi

## 🤖 AI Özellikler

### Chatbot Kategorileri

1. **Günlük Plan**: Eğitim planları oluşturma
2. **Etkinlik/Oyun Planı**: Aktivite önerileri
3. **Öğrenci Analizleri**: Gelişim takibi
4. **Hikayeler**: Eğitici hikaye yazma
5. **Takvim**: Program yönetimi

### Görsel Üretimi

- **Boyama/Çalışma Sayfaları**: AI ile görsel oluşturma
- Google Gemini API entegrasyonu
- Base64 görsel işleme
- Otomatik indirme özelliği

## 🛠️ Kurulum

1. **Sanal ortam oluşturun:**

```bash
python -m venv venv
source venv/bin/activate  # macOS/Linux
# veya
venv\Scripts\activate     # Windows
```

2. **Bağımlılıkları yükleyin:**

```bash
pip install -r requirements.txt
```

3. **Uygulamayı çalıştırın:**

```bash
python app.py
```

4. **Tarayıcıda açın:**

```
http://localhost:8000
```

## 🎯 Sayfalar

### 🔐 Giriş Sayfası (`/login`)

- Modern gradient tasarım
- Animasyonlu form elemanları
- Font Awesome ikonlar
- Responsive tasarım

### 📊 Ana Dashboard (`/dashboard`)

- 6'lı grid sistem
- Her kart için özel ikonlar:
  - 📅 **Günlük Plan**
  - 🎮 **Etkinlik/Oyun Planı**
  - 🎨 **Boyama/Çalışma Sayfaları**
  - 📊 **Öğrenci Analizleri**
  - 📚 **Hikayeler**
  - 🗓️ **Takvim**

## 🎨 Tasarım Özellikleri

- **Renk Paleti**: Gradient mavi-mor tonları
- **Tipografi**: System font stack (optimum performans)
- **Animasyonlar**: CSS transitions ve transforms
- **Responsive**: Mobile-first yaklaşım
- **Glassmorphism**: Modern cam efekti tasarım

## 📱 Responsive Breakpoints

- **Desktop**: 1024px+
- **Tablet**: 768px - 1023px
- **Mobile**: 480px - 767px
- **Small Mobile**: <480px

## 🔧 Geliştirme

### Yeni sayfa ekleme:

1. `templates/` klasörüne HTML dosyası ekleyin
2. `static/css/` klasörüne stil dosyası ekleyin
3. `app.py` dosyasına route ekleyin

### CSS güncelleme:

- Login sayfası: `static/css/login.css`
- Dashboard: `static/css/dashboard.css`

## 📦 Teknolojiler

- **Backend**: FastAPI, Uvicorn
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Icons**: Font Awesome 6
- **Template Engine**: Jinja2

## 🚀 Deployment

Uvicorn ile production deployment:

```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --workers 4
```

## 📄 Lisans

Bu proje eğitim amaçlı geliştirilmiştir.
