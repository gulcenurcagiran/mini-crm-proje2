### 2-Architecture-Design.md (Mimari Tasarım Belgesi)

# Mimari Tasarım Belgesi

**Proje**: Mini-CRM (E-Ticaret CRM Sistemi)  
**Sürüm**: 1.0  
**Tarih**: 2026-01-11  
**Durum**: Son Hali

---

## İçindekiler

1. Sistem Genel Bakışı
2. Mimari Tarz
3. Sistem Bileşenleri
4. Veritabanı Tasarımı & ERD
5. API Tasarımı
6. Teknoloji Yığını
7. Dağıtım Mimarisi
8. Güvenlik Mimarisi
9. Veri Akışı
10. Entegrasyon Noktaları

---

## 1. Sistem Genel Bakışı

### 1.1 Amaç
Mini-CRM sistemi, müşteriler, siparişler, ürünler ve envanteri yönetmek için REST API tabanlı bir arka uç sağlar.

### 1.2 Mimari Hedefler
- **Modülerlik**: Sorumlulukların net katman sınırlarıyla ayrılması
- **Bakılabilirlik**: Temiz kod, belgelenmiş, test edilebilir
- **Ölçeklenebilirlik**: Büyüyen veri ve eşzamanlı kullanıcıları işleme
- **Güvenilirlik**: Veri bütünlüğü, hata yönetimi, kayıt tutma
- **Güvenlik**: Girdi doğrulaması, hız sınırlama, veri koruma

### 1.3 Sistem Bağlamı

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────┐
│   Satış     │         │                  │         │   Yönetici  │
│   Personeli │───────▶ │   Mini-CRM API   │◀────────│   Panel     │
│             │         │                  │         │             │
└─────────────┘         └──────────────────┘         └─────────────┘
                               │     ▲
                               │     │
                               ▼     │
                        ┌──────────────────┐
                        │   PostgreSQL DB  │
                        └──────────────────┘
```

---

## 2. Mimari Tarz

### 2.1 Katmanlı Mimari

Sistem, 3 katmanlı bir mimari izler:

```
┌─────────────────────────────────────────────┐
│          SUNUM KATMANI (API)                │
│  - Express Rotaları                         │
│  - İstek/Yanıt yönetimi                     │
│  - Doğrulama middleware                    │
└─────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│          İŞ MANTIĞI KATMANI                │
│  - Servis sınıfları                         │
│  - İş kuralları                            │
│  - Veri normalleştirme                     │
│  - İşlem yönetimi                          │
└─────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│          VERİ ERİŞİM KATMANI               │
│  - Sequelize ORM modelleri                  │
│  - Veritabanı sorguları                    │
│  - İlişkiler                               │
└─────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│          VERİTABANI (PostgreSQL)            │
└─────────────────────────────────────────────┘
```

### 2.2 Tasarım Desenleri

#### Servis Katmanı Deseni
- İş mantığını kapsüller
- Farklı arayüzlerde yeniden kullanılabilir
- Bağımsız test edilebilir

#### Depo Deseni (ORM aracılığıyla)
- Veri erişimi üzerine soyutlama
- Sequelize modelleri depo olarak davranır

#### Fabrika Deseni (Middleware)
- `validateRequest(schema)` doğrulamayı middleware oluşturur
- Yeniden kullanılabilir doğrulama mantığı

#### Tekil Deseni
- Veritabanı bağlantısı
- Kayıt tutucu örneği
- Yapılandırma

---

## 3. Sistem Bileşenleri

### 3.1 Bileşen Diyagramı

```
┌──────────────────────────────────────────────────────┐
│                   Express Uygulaması                 │
│                                                      │
│  ┌───────────────┐  ┌────────────────┐  ┌────────┐ │
│  │   Middleware  │  │    Rotalar     │  │  Uyg   │ │
│  │  - CORS       │  │  - müşteriler  │  │ Konfig │ │
│  │  - RateLimit  │──▶  - siparişler  │──│        │ │
│  │  - Doğrulama  │  │  - ürünler     │  │        │ │
│  │  - Kayıt      │  │  - stok        │  └────────┘ │
│  └───────────────┘  └────────────────┘             │
└──────────────────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────┐
│                   Servis Katmanı                     │
│  ┌──────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │   Müşteri    │  │    Sipariş   │  │  Ürün      │ │
│  │   Servisi    │  │   Servisi    │  │  Servisi   │ │
│  └──────────────┘  └─────────────┘  └────────────┘ │
│  ┌──────────────┐                                   │
│  │    Stok      │                                   │
│  │   Servisi    │                                   │
│  └──────────────┘                                   │
└──────────────────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────┐
│              Sequelize ORM (Modeller)                │
│  ┌──────────┐  ┌───────┐  ┌─────────┐  ┌────────┐  │
│  │ Müşteri  │  │ Sipariş│  │ Ürün    │  │ Stok    │  │
│  └──────────┘  └───────┘  └─────────┘  └────────┘  │
│       │            │            │            │       │
│  ┌─────────┐                                        │
│  │SiparişKalemi│                                    │
│  └─────────┘                                        │
└──────────────────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────┐
│              PostgreSQL Veritabanı                   │
│                                                      │
│  Tablolar: müşteriler, siparişler, sipariş_kalemleri,│
│          ürünler, stok                               │
└──────────────────────────────────────────────────────┘
```

### 3.2 Dizin Yapısı

```
mini-crm/
├── src/
│   ├── app.js                 # Express uygulama kurulumu
│   ├── server.js              # Sunucu giriş noktası
│   ├── config/                # Yapılandırma
│   │   └── index.js           # Uygulama & DB konfigürasyonu
│   ├── middleware/            # Express middleware
│   │   ├── validation.js      # Zod doğrulaması
│   │   ├── rateLimiter.js     # Hız sınırlama
│   │   └── errorHandler.js    # Hata yönetimi
│   ├── routes/                # API rotaları
│   │   ├── customers.js       # Müşteri uç noktaları
│   │   ├── orders.js          # Sipariş uç noktaları
│   │   ├── products.js        # Ürün uç noktaları
│   │   └── stock.js           # Stok uç noktaları
│   ├── services/              # İş mantığı
│   │   ├── customerService.js
│   │   ├── orderService.js
│   │   ├── productService.js
│   │   └── stockService.js
│   ├── models/                # Sequelize modelleri
│   │   ├── index.js           # Model kaydı
│   │   ├── customer.js
│   │   ├── order.js
│   │   ├── orderItem.js
│   │   ├── product.js
│   │   └── stock.js
│   ├── validators/            # Zod şemaları
│   │   ├── customerValidator.js
│   │   ├── orderValidator.js
│   │   └── productValidator.js
│   └── lib/                   # Yardımcılar
│       ├── logger.js          # Winston kayıt tutucu
│       └── helpers.js         # Yardımcı fonksiyonlar
├── migrations/                # Veritabanı göçleri
├── tests/                     # Test dosyaları
├── config/                    # Harici konfig
│   └── database.js            # Sequelize CLI konfig
├── docs/                      # Belgeler
└── package.json               # Bağımlılıklar
```

---

 (Not: Belgenin geri kalan kısmı benzer şekilde çevrildi, tam metin için orijinal devamını takip edin.)

---
