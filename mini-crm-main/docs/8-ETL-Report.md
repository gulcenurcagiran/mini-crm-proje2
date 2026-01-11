# ETL ve Veri Aktarım Raporu

**Proje**: Mini-CRM
**Tarih**: 2026-01-11
**Script**: `scripts/import-data.js`
**Kaynak Dosya**: `musteri_listesi.xlsx`

---

## 1. Giriş
Bu rapor, Mini-CRM projesi kapsamında eski sistemden (Excel) yeni veritabanına veri göçü (Migration) işlemini ve bu süreçte kullanılan ETL (Extract, Transform, Load) metodolojisini açıklar.

Geliştirilen `import-data.js` scripti, veri bütünlüğünü korumak adına **"Hata Toleranslı" (Fault-Tolerant)** bir yaklaşımla tasarlanmıştır. Script, hatalı satırları tespit edip raporlarken, temiz verilerin aktarımını kesintisiz sürdürür.

## 2. Veri Kalitesi ve Tespit Edilen Sorunlar
Müşteri tarafından iletilen kaynak Excel dosyasında aşağıdaki veri kalitesi sorunları analiz edilmiştir:

* **Format Sorunları:** İsim alanlarında gereksiz karakterler ve telefon numaralarında standart dışı formatlar.
* **Eksik Veriler:** Bazı müşteri kayıtlarında "İsim" veya "E-posta" gibi kritik alanların boş olması.
* **Veri Tipi Uyuşmazlıkları:** Sayısal olması gereken alanlarda metin karakterlerinin bulunması.

## 3. ETL Süreci ve Metodoloji

Script, verileri satır satır işleyerek aşağıdaki adımları uygular:

### 3.1. Extract (Veri Okuma)
* `xlsx` kütüphanesi kullanılarak Excel dosyasındaki "Customers", "Products" ve "Orders" sayfaları otomatik algılanır ve JSON formatına çevrilir.
* Script, sayfa isimlerini büyük/küçük harf duyarlılığı olmadan (Case-Insensitive) algılayacak şekilde tasarlanmıştır.

### 3.2. Transform & Validate (Dönüştürme ve Doğrulama)
Veriler veritabanına yazılmadan önce temel bir temizlik ve doğrulama aşamasından geçer:
* **Alan Eşleştirme (Mapping):** Excel'deki farklı sütun isimlendirmeleri (örn: `First Name`, `first_name`, `FirstName`) veritabanı şemasına uygun tek bir formata (`firstName`) dönüştürülür.
* **Zorunlu Alan Kontrolü:** Veritabanı bütünlüğü için kritik olan alanların (Örn: Müşteri adı, Ürün fiyatı) dolu olup olmadığı kontrol edilir.
* **Veri Tipi Hazırlığı:**
    * `isActive` alanı, Excel'den gelen veriye göre `true/false` olarak ayarlanır.
    * Fiyat ve stok bilgileri sayısal değerlere (`parseFloat`, `parseInt`) dönüştürülür.

### 3.3. Load (Yükleme ve Hata Yönetimi)
* **Satır Bazlı İşleme:** Script, tüm dosyayı tek seferde yüklemek yerine satır satır ilerler. Bu sayede bir satırdaki hata tüm işlemi durdurmaz.
* **Hata Yakalama (Try-Catch):** Veritabanına yazma işlemi (`create`) sırasında bir hata oluşursa (Örn: Veritabanı kısıtlamaları veya veri tipi hatası), ilgili satır "Başarısız" olarak işaretlenir ve işlem bir sonraki satırdan devam eder.
* **İlerleme Logları:** Her 100 kayıtta bir konsola ilerleme durumu basılır.

## 4. Hata Raporlama Mekanizması

Script, aktarım sırasında oluşan hataları kaybetmemek için gelişmiş bir raporlama sistemi içerir:

* **Faulty Rows Export (Hatalı Satır Dışa Aktarımı):**
    Aktarım sırasında hata alınan satırlar, hatanın sebebiyle (`ERROR_REASON`) birlikte bellekte toplanır.
* **CSV Çıktısı:**
    Eğer hata sayısı belirli bir eşiği (10) geçerse, sistem otomatik olarak `logs/` klasörüne zaman damgalı bir CSV dosyası üretir.
    * *Örnek Dosya Adı:* `logs/faulty_rows_customers_2026-01-11.csv`

Bu dosya, sistem yöneticisinin hatalı verileri Excel'de açıp düzeltmesi ve tekrar sisteme yükleyebilmesi için hazır bir format sunar.

## 5. Sonuç

Veri aktarım scripti başarıyla hazırlanmış ve aşağıdaki yeteneklere sahiptir:
* Excel dosyasını okuma ve şemaya eşleme.
* Eksik veya hatalı verileri tespit edip ayıklama.
* Temiz verileri veritabanına kaydetme.
* Hatalı verileri, düzeltilmesi amacıyla harici bir rapor (CSV) olarak sunma.

Bu yaklaşım sayesinde, "kirli veri" veritabanını bozmadan izole edilmiş olur.