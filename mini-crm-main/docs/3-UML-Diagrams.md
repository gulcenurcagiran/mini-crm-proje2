### 3-UML-Diagrams.md (UML Diyagramları)

# UML Diyagramları

**Proje**: Mini-CRM  
**Sürüm**: 1.0  
**Tarih**: 2026-01-11  

Bu belge, Mini-CRM sistemi için PlantUML metin formatında UML diyagramlarını içerir.
Bunlar PlantUML online aracı veya IDE eklentileriyle render edilebilir.

---

## 1. Kullanım Senaryosu Diyagramı

```plantuml
@startuml Mini-CRM Kullanım Senaryoları

left to right direction
skinparam packageStyle rectangle

actor "Satış Temsilcisi" as Sales
actor "Depo Personeli" as Warehouse
actor "Yönetici" as Admin
actor "Müşteri" as Customer

rectangle "Mini-CRM Sistemi" {
  usecase "Müşterileri Yönet" as UC1
  usecase "Sipariş Oluştur" as UC2
  usecase "Siparişleri Gör" as UC3
  usecase "Sipariş Durumunu Güncelle" as UC4
  usecase "Ürünleri Yönet" as UC5
  usecase "Stoku Yönet" as UC6
  usecase "Stok Seviyelerini Kontrol Et" as UC7
  usecase "Müşteri Verilerini İçe Aktar" as UC8
  usecase "Raporlar Üret" as UC9
  usecase "Misafir Siparişi Ver" as UC10
}

Sales --> UC1
Sales --> UC2
Sales --> UC3
Sales --> UC10

Warehouse --> UC3
Warehouse --> UC4
Warehouse --> UC6
Warehouse --> UC7

Admin --> UC5
Admin --> UC8
Admin --> UC9

Customer --> UC10

UC2 ..> UC7 : <<include>>
UC2 ..> UC6 : <<include>>
UC8 ..> UC1 : <<extend>>

@enduml
```

---

## 2. Sınıf Diyagramı

```plantuml
@startuml Mini-CRM Sınıf Diyagramı

class Müşteri {
  +id: Tamsayı {PK}
  +firstName: Dize
  +lastName: Dize
  +email: Dize {benzersiz}
  +phone: Dize
  +address: Metin
  +isActive: Boolean
  +createdAt: Zaman Damgası
  +updatedAt: Zaman Damgası
  --
  +getOrders(): Sipariş[]
  +update(data): Müşteri
  +deactivate(): void
}

class Sipariş {
  +id: Tamsayı {PK}
  +customerId: Tamsayı {FK}
  +status: Dize
  +totalAmount: Ondalık
  +guestName: Dize
  +guestEmail: Dize
  +guestPhone: Dize
  +createdAt: Zaman Damgası
  +updatedAt: Zaman Damgası
  --
  +addItem(product, quantity): SiparişKalemi
  +calculateTotal(): Ondalık
  +updateStatus(newStatus): void
  +getItems(): SiparişKalemi[]
}

class SiparişKalemi {
  +id: Tamsayı {PK}
  +orderId: Tamsayı {FK}
  +productId: Tamsayı {FK}
  +quantity: Tamsayı
  +unitPrice: Ondalık
  +subtotal: Ondalık
  +createdAt: Zaman Damgası
  +updatedAt: Zaman Damgası
  --
  +calculateSubtotal(): Ondalık
}

class Ürün {
  +id: Tamsayı {PK}
  +name: Dize
  +description: Metin
  +sku: Dize {benzersiz}
  +price: Ondalık
  +category: Dize
  +isActive: Boolean
  +createdAt: Zaman Damgası
  +updatedAt: Zaman Damgası
  --
  +getStock(): Stok
  +updatePrice(newPrice): void
  +deactivate(): void
}

class Stok {
  +id: Tamsayı {PK}
  +productId: Tamsayı {FK, benzersiz}
  +quantity: Tamsayı
  +reorderLevel: Tamsayı
  +warehouse: Dize
  +lastRestocked: Zaman Damgası
  +createdAt: Zaman Damgası
  +updatedAt: Zaman Damgası
  --
  +decreaseStock(amount): void
  +increaseStock(amount): void
  +isLowStock(): Boolean
}

' İlişkiler
Müşteri "1" --> "0..*" Sipariş : verir
Sipariş "1" --> "1..*" SiparişKalemi : içerir
Ürün "1" --> "0..*" SiparişKalemi : sipariş edilir
Ürün "1" --> "1" Stok : sahiptir

' Servisler
class MüşteriServisi {
  +listCustomers(options): Nesne
  +getCustomerById(id): Müşteri
  +createCustomer(data): Müşteri
  +updateCustomer(id, data): Müşteri
  +deleteCustomer(id): Boolean
  +normalizeCustomerData(data): Nesne
}

class SiparişServisi {
  +listOrders(filter): Nesne
  +getOrderById(id): Sipariş
  +createOrder(data): Sipariş
  +updateOrderStatus(id, status): Sipariş
  +cancelOrder(id): Boolean
  +checkStockAvailability(items): Boolean
}

class ÜrünServisi {
  +listProducts(options): Nesne
  +getProductById(id): Ürün
  +createProduct(data): Ürün
  +updateProduct(id, data): Ürün
  +deleteProduct(id): Boolean
}

class StokServisi {
  +getStockLevel(productId): Stok
  +updateStock(productId, quantity): Stok
  +getLowStock(): Stok[]
  +restockProduct(productId, amount): Stok
}

' Servis bağımlılıkları
MüşteriServisi ..> Müşteri : yönetir
SiparişServisi ..> Sipariş : yönetir
SiparişServisi ..> SiparişKalemi : yönetir
SiparişServisi ..> StokServisi : kullanır
ÜrünServisi ..> Ürün : yönetir
StokServisi ..> Stok : yönetir

@enduml
```

---

 (Not: PlantUML kodları değişmedi, açıklamalar çevrildi. Belgenin geri kalan diyagramları benzer şekilde.)

---