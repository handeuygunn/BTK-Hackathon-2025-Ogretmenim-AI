# Öğretmenim AI

Modern Anaokulu Öğretmeni Yardımcı Asistanı

## Özellikler

- **Modern Tasarım**: Kullanıcı dostu arayüz
- **6'lı Grid Sistem**: Ana dashboard'da 6 farklı öğretmen aracı
- **AI Entegrasyonu**: Google Gemini API ile chatbot desteği
- **Görsel Üretimi**: Boyama sayfaları için AI ile görsel oluşturma

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

## AI Özellikler

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

## Teknolojiler

- **Backend**: FastAPI, Uvicorn
- **Frontend**: HTML5, CSS3, Vanilla JavaScript

## Deployment

Uvicorn ile production deployment:

```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --workers 4
```

## Lisans

Bu proje BTK Hackathon 2025 için geliştirilmiştir.
