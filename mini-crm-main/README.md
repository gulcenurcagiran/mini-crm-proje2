# Mini-CRM Projesi

Bu proje, "Bilgisayar Mühendisliğinde Özel Konular" dersi kapsamında geliştirilen; müşteri, sipariş, ürün ve stok yönetimini sağlayan kapsamlı bir Backend API projesidir.

Yarım kalmış bir projeyi devralma senaryosu üzerine kurulu olan bu çalışmada; eksik API'lar tamamlanmış, veritabanı mimarisi onarılmış, test süreçleri işletilmiş ve "kirli veri" içeren Excel dosyaları için ETL süreçleri geliştirilmiştir.

## 🚀 Özellikler

- **RESTful API:** Müşteri, Sipariş, Ürün ve Stok yönetimi için tam CRUD desteği.
- **Veri Doğrulama:** Girilen verilerin tutarlılığı için Validasyon katmanı.
- **ETL Süreci:** Bozuk formatlı Excel verilerinin temizlenerek veritabanına aktarılması.
- **Raporlama:** Hatalı veri kayıtlarının CSV olarak raporlanması.
- **Güvenlik:** Rate Limiting ve temel güvenlik önlemleri.
- **Test:** Unit ve Entegrasyon testleri ile %100 kapsama oranı.

## 🛠 Teknoloji Yığını

- **Runtime:** Node.js
- **Framework:** Express.js
- **Veritabanı:** PostgreSQL
- **ORM:** Sequelize
- **Test:** Jest / Supertest
- **Dokümantasyon:** Swagger / OpenAPI

## 📂 Proje Yapısı

```text
mini-crm/
├── docs/                 # Proje Raporları ve Dokümantasyon
├── src/
│   ├── config/           # Veritabanı ve ortam ayarları
│   ├── models/           # Sequelize veritabanı modelleri
│   ├── routes/           # API yönlendirmeleri (Endpointler)
│   ├── services/         # İş mantığı katmanı (Business Logic)
│   ├── validators/       # İstek doğrulama şemaları
│   └── app.js            # Uygulama giriş noktası
├── migrations/           # Veritabanı şema geçmişi
├── scripts/              # ETL ve yardımcı araçlar
├── tests/                # Test senaryoları
└── package.json

⚙️ Kurulum ve Çalıştırma
Projeyi yerel ortamınızda çalıştırmak için aşağıdaki adımları takip edin.

1. Gereksinimler
Node.js (v18 veya üzeri)

PostgreSQL Veritabanı

2. Kurulum
Repoyu klonlayın ve bağımlılıkları yükleyin:

Bash

npm install
3. Çevre Değişkenleri (.env)
Ana dizinde .env dosyası oluşturun ve veritabanı bilgilerinizi girin:

Kod snippet'i

DB_USERNAME=postgres
DB_PASSWORD=sifreniz
DB_DATABASE=mini_crm_db
DB_HOST=127.0.0.1
DB_PORT=5432
NODE_ENV=development
PORT=3000
4. Veritabanı Hazırlığı (Migration)
Tabloları oluşturmak için migration komutunu çalıştırın:

Bash

npx sequelize-cli db:migrate
5. Uygulamayı Başlatma
Geliştirme modunda başlatmak için:

Bash

npm run dev
veya standart başlatma:

Bash

npm start
Sunucu http://localhost:3000 adresinde çalışacaktır.

🧪 Testleri Çalıştırma
Projenin test kapsamını kontrol etmek için:

Bash

npm test
Tüm testler çalıştırılacak ve sonuç raporu terminalde gösterilecektir.

📊 Veri Aktarımı (ETL Scripti)
Müşterinin sağladığı Excel dosyasını (.xlsx) sisteme aktarmak ve hatalı verileri temizlemek için:

Bash

node scripts/import-data.js <dosya_yolu.xlsx>
Örnek: node scripts/import-data.js data/musteri_listesi.xlsx

Bu işlem sonucunda hatalı kayıtlar logs/ klasörüne CSV formatında raporlanır.

📚 Dokümantasyon
Proje ile ilgili detaylı teknik raporlara docs/ klasöründen ulaşabilirsiniz:

1-Requirements-Analysis.md - Gereksinim Analizi

2-Architecture-Design.md - Mimari Tasarım

3-UML-Diagrams.md - UML Diyagramları

4-API-Documentation.md - API Dokümantasyonu

5-Test-Report.md - Test Sonuç Raporu

6-Final-Delivery-Package.md - Teslim Paketi Özeti

7-CI-CD-Pipelines.md - CI/CD Süreçleri

8-ETL-Report.md - Veri Aktarım Raporu

API Endpointlerini görsel olarak incelemek için proje çalışırken: http://localhost:3000/api-docs adresini ziyaret edebilirsiniz.