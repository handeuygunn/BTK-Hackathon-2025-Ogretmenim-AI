# Öğretmenim AI

Proje Tanıtımı:

Bu proje, anaokulu öğretmenlerinin günlük planlama, yaratıcı içerik üretimi ve öğrenci gözlem süreçlerini dijitalleştirerek kolaylaştırmayı amaçlayan bir yapay zeka destekli asistan sistemidir. Google’ın Gemini büyük dil modeli (LLM) kullanılarak geliştirilen sistem, öğretmenin ihtiyaç duyduğu materyalleri otomatik olarak üretir. Kullanıcı ve içerik verileriyle birlikte öğrenci gözlemleri de PostgreSQL veritabanında güvenli şekilde saklanır. Sistem Python tabanlı bir API aracılığıyla çalışmakta, veritabanı ve yapay zeka bileşenleriyle entegre şekilde işlemektedir.

Sistem Özellikleri:

1. Günlük Planlama Asistanı
Öğretmen ve asistan öğretmen, günlük eğitim planlarını sistem üzerinden kolaylıkla oluşturabilir.

Planlar otomatik olarak takvime kaydedilir.

Elle yazım ihtiyacı ortadan kalkar, planlama süresi ciddi oranda kısalır.

Zaman tasarrufu sağlanarak öğretmenlerin öğrencilerle daha fazla birebir vakit geçirmesi mümkün hâle gelir.

2. Yaratıcı Çalışma Asistanı
Gemini modeli, öğretmenin seçtiği herhangi bir konuda özgün ve eğitici içerikler üretir.

Boyama sayfaları, etkinlik dökümanları, çalışma kâğıtları gibi materyaller oluşturulur.

İçerikler dijital ortamda ya da çıktı alınarak kullanılabilir; öğretim sürecine doğrudan entegre edilir.

3. Öğrenci Analiz ve Gözlem Modülü
Sistem, her öğrencinin günlük gelişim gözlemlerinin kaydedilmesini ve bu gözlemlerden otomatik raporlar üretilmesini sağlar.

Öğretmenler, gözlemleri sisteme düzenli olarak girer.

Bu gözlemler PostgreSQL veritabanında saklanır, böylece veri güvenliği ve kalıcılığı sağlanır.

Otomatik raporlar sayesinde öğrencilerin bireysel gelişimi düzenli ve veri temelli biçimde takip edilebilir.

4. Oyun Asistanı
Öğretmenin belirlediği kurallar ve hedefler doğrultusunda özgün, öğretim hedeflerine uygun oyunlar oluşturulur.

Oyunlar pedagojik hedeflerle uyumlu biçimde yapılandırılır.

Oyun temelli öğrenmeyi destekler ve sınıf içi etkileşimi artırır.

5. Hikâye Asistanı
Öğretmenin seçtiği tema veya kazanıma uygun olarak hikâyeler otomatik şekilde oluşturulur.

Hikâyeler, anlatı temelli öğrenmeye katkı sağlar.

Dil gelişimi, değerler eğitimi ve sosyal-duygusal öğrenme alanlarında destekleyici bir araç olarak kullanılabilir.



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
│   ├── dashboard.html     # Ana dashboard
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
