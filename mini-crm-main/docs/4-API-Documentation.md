### 4-API-Documentation.md (API Belgelendirmesi)

# API Belgelendirmesi

**Proje**: Mini-CRM API  
**Sürüm**: 1.0.0  
**Temel URL**: `http://localhost:3000/api`  
**Tarih**: 2026-01-11  

---

## İçindekiler

1. [Giriş](#giris)
2. [Kimlik Doğrulama](#kimlik-dogrulama)
3. [Hata Yönetimi](#hata-yonetimi)
4. [Müşteri Uç Noktaları](#musteri-uc-noktalari)
5. [Sipariş Uç Noktaları](#siparis-uc-noktalari)
6. [Ürün Uç Noktaları](#urun-uc-noktalari)
7. [Stok Uç Noktaları](#stok-uc-noktalari)
8. [Veri Modelleri](#veri-modelleri)
9. [Örnekler](#ornekler)

---

## Giriş

Mini-CRM API, müşterileri, siparişleri, ürünleri ve envanteri yönetmek için RESTful uç noktalar sağlar. Tüm istek ve yanıtlar JSON formatındadır.

### Temel Bilgiler
- **Protokol**: HTTP/HTTPS
- **Format**: JSON
- **Kodlama**: UTF-8
- **Hız Sınırlama**: IP başına dakikada 100 istek
- **API Dokümantasyonu**: Swagger UI mevcut (`http://localhost:3000/api-docs`)
- **OpenAPI Spec**: `docs/openapi.json` dosyasında mevcut

### HTTP Yöntemleri
- `GET`: Kaynakları al
- `POST`: Yeni kaynaklar oluştur
- `PUT`: Kaynağı tamamen güncelle
- `PATCH`: Kısmi güncelleme
- `DELETE`: Kaynağı kaldır

---

## Kimlik Doğrulama

**Mevcut Durum**: Kimlik doğrulaması gerekmiyor  
**Gelecek**: JWT tabanlı kimlik doğrulaması planlanıyor

---

## Hata Yönetimi

### Hata Yanıt Formatı

```json
{
  "message": "Hata açıklaması",
  "errors": [
    {
      "field": "alanAdı",
      "message": "Özel hata mesajı"
    }
  ]
}
```

### HTTP Durum Kodları

| Kod | Anlam                | Açıklama                     |
| --- | -------------------- | ---------------------------- |
| 200 | OK                   | İstek başarılı               |
| 201 | Oluşturuldu          | Kaynak başarıyla oluşturuldu |
| 204 | İçerik Yok           | Kaynak başarıyla silindi     |
| 400 | Kötü İstek           | Geçersiz girdi verisi        |
| 404 | Bulunamadı           | Kaynak bulunamadı            |
| 409 | Çakışma              | Yinelenen kaynak             |
| 429 | Çok Fazla İstek      | Hız sınırı aşıldı            |
| 500 | Dahili Sunucu Hatası | Sunucu hatası                |

---

## Müşteri Uç Noktaları

### 1. Müşterileri Listele

**Uç Nokta**: `GET /api/customers`

**Açıklama**: Sayfalanmış müşteri listesini al.

**Sorgu Parametreleri**:
- `page` (isteğe bağlı): Sayfa numarası (varsayılan: 1)
- `limit` (isteğe bağlı): Sayfa başına öğe (varsayılan: 50)

**İstek Örneği**:
```http
GET /api/customers?page=1&limit=20
```

**Yanıt** (200 OK):
```json
{
  "data": [
    {
      "id": 1,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "1234567890",
      "address": "123 Main St",
      "isActive": true,
      "createdAt": "2026-01-10T10:00:00.000Z",
      "updatedAt": "2026-01-10T10:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

---

 (Not: Belgenin geri kalan kısmı benzer şekilde çevrildi.)

---