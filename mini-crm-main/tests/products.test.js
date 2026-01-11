const request = require('supertest');
const app = require('../src/app');
const { sequelize, Product, Stock } = require('../src/models');

describe('Products API', () => {
  beforeAll(async () => {
    // Reset database
    await sequelize.sync({ force: true });
  });

  afterEach(async () => {
    // Clean up after each test
    await sequelize.query('TRUNCATE "stock" RESTART IDENTITY CASCADE');
    await sequelize.query('TRUNCATE "order_items" RESTART IDENTITY CASCADE');
    await sequelize.query('TRUNCATE "products" RESTART IDENTITY CASCADE');
    await sequelize.query('TRUNCATE "orders" RESTART IDENTITY CASCADE');
    await sequelize.query('TRUNCATE "customers" RESTART IDENTITY CASCADE');
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /api/products', () => {
    it('should create a product with valid data', async () => {
      const productData = {
        name: 'Laptop',
        description: 'High-performance laptop',
        price: 999.99,
        sku: 'LAP-001',
        category: 'Electronics',
        initialStock: 50
      };

      const res = await request(app)
        .post('/api/products')
        .send(productData)
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('Laptop');
      expect(parseFloat(res.body.price)).toBe(999.99);
      expect(res.body.sku).toBe('LAP-001');
      expect(res.body.category).toBe('Electronics');
      expect(res.body.isActive).toBe(true);
      
      // Check stock was created
      expect(res.body.stock).toBeDefined();
      expect(res.body.stock.quantity).toBe(50);
    });

    it('should create a product with minimal data', async () => {
      const productData = {
        name: 'Simple Widget',
        price: 19.99
      };

      const res = await request(app)
        .post('/api/products')
        .send(productData)
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('Simple Widget');
      expect(res.body.stock.quantity).toBe(0); // Default initialStock
    });

    it('should reject product with missing name', async () => {
      const productData = {
        price: 99.99
      };

      const res = await request(app)
        .post('/api/products')
        .send(productData)
        .expect(400);

      expect(res.body.message).toBe('Validation error');
    });

    it('should reject product with invalid price', async () => {
      const productData = {
        name: 'Test Product',
        price: -10.00
      };

      const res = await request(app)
        .post('/api/products')
        .send(productData)
        .expect(400);

      expect(res.body.message).toBe('Validation error');
    });

    it('should reject product with duplicate SKU', async () => {
      const productData = {
        name: 'Product 1',
        price: 50.00,
        sku: 'UNIQUE-SKU'
      };

      // Create first product
      await request(app)
        .post('/api/products')
        .send(productData)
        .expect(201);

      // Try to create second with same SKU
      const duplicateData = {
        name: 'Product 2',
        price: 60.00,
        sku: 'UNIQUE-SKU'
      };

      const res = await request(app)
        .post('/api/products')
        .send(duplicateData)
        .expect(400);

      expect(res.body.message).toBe('SKU already exists');
    });

    it('should handle negative initial stock', async () => {
      const productData = {
        name: 'Test Product',
        price: 50.00,
        initialStock: -10
      };

      const res = await request(app)
        .post('/api/products')
        .send(productData)
        .expect(400);

      expect(res.body.message).toBe('Validation error');
    });
  });

  describe('GET /api/products', () => {
    beforeEach(async () => {
      // Create test products
      await Product.create({
        name: 'Laptop',
        price: 999.99,
        category: 'Electronics',
        isActive: true
      });
      await Stock.create({ productId: 1, quantity: 50 });

      await Product.create({
        name: 'Mouse',
        price: 29.99,
        category: 'Electronics',
        isActive: true
      });
      await Stock.create({ productId: 2, quantity: 100 });

      await Product.create({
        name: 'Desk',
        price: 299.99,
        category: 'Furniture',
        isActive: true
      });
      await Stock.create({ productId: 3, quantity: 25 });

      await Product.create({
        name: 'Old Product',
        price: 19.99,
        category: 'Electronics',
        isActive: false
      });
      await Stock.create({ productId: 4, quantity: 0 });
    });

    it('should list all products', async () => {
      const res = await request(app)
        .get('/api/products')
        .expect(200);

      expect(res.body.data).toHaveLength(4);
      expect(res.body.pagination).toHaveProperty('total', 4);
      
      // Check stock is included
      expect(res.body.data[0].stock).toBeDefined();
    });

    it('should filter products by category', async () => {
      const res = await request(app)
        .get('/api/products?category=Electronics')
        .expect(200);

      expect(res.body.data).toHaveLength(3);
      expect(res.body.data.every(p => p.category === 'Electronics')).toBe(true);
    });

    it('should filter products by active status', async () => {
      const res = await request(app)
        .get('/api/products?isActive=true')
        .expect(200);

      expect(res.body.data).toHaveLength(3);
      expect(res.body.data.every(p => p.isActive === true)).toBe(true);
    });

    it('should filter inactive products', async () => {
      const res = await request(app)
        .get('/api/products?isActive=false')
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('Old Product');
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/products?page=1&limit=2')
        .expect(200);

      expect(res.body.data).toHaveLength(2);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(2);
      expect(res.body.pagination.totalPages).toBe(2);
    });

    it('should combine filters', async () => {
      const res = await request(app)
        .get('/api/products?category=Electronics&isActive=true')
        .expect(200);

      expect(res.body.data).toHaveLength(2);
      expect(res.body.data.every(p => 
        p.category === 'Electronics' && p.isActive === true
      )).toBe(true);
    });
  });

  describe('GET /api/products/:id', () => {
    let testProduct;

    beforeEach(async () => {
      testProduct = await Product.create({
        name: 'Test Laptop',
        description: 'Great laptop',
        price: 1299.99,
        sku: 'LAP-TEST-001',
        category: 'Electronics',
        isActive: true
      });
      await Stock.create({ 
        productId: testProduct.id, 
        quantity: 75,
        reservedQuantity: 5,
        reorderLevel: 10
      });
    });

    it('should get product by id', async () => {
      const res = await request(app)
        .get(`/api/products/${testProduct.id}`)
        .expect(200);

      expect(res.body.id).toBe(testProduct.id);
      expect(res.body.name).toBe('Test Laptop');
      expect(res.body.stock).toBeDefined();
      expect(res.body.stock.quantity).toBe(75);
      expect(res.body.stock.reservedQuantity).toBe(5);
    });

    it('should return 404 for non-existent product', async () => {
      const res = await request(app)
        .get('/api/products/99999')
        .expect(404);

      expect(res.body.message).toBe('Product not found');
    });
  });

  describe('PUT /api/products/:id', () => {
    let testProduct;

    beforeEach(async () => {
      testProduct = await Product.create({
        name: 'Original Name',
        description: 'Original description',
        price: 100.00,
        sku: 'ORIG-001',
        category: 'Category A',
        isActive: true
      });
      await Stock.create({ productId: testProduct.id, quantity: 50 });
    });

    it('should update product with valid data', async () => {
      const updateData = {
        name: 'Updated Name',
        price: 150.00,
        description: 'Updated description'
      };

      const res = await request(app)
        .put(`/api/products/${testProduct.id}`)
        .send(updateData)
        .expect(200);

      expect(res.body.name).toBe('Updated Name');
      expect(parseFloat(res.body.price)).toBe(150.00);
      expect(res.body.description).toBe('Updated description');
      // Original values should remain
      expect(res.body.sku).toBe('ORIG-001');
    });

    it('should update only specified fields', async () => {
      const updateData = {
        price: 125.00
      };

      const res = await request(app)
        .put(`/api/products/${testProduct.id}`)
        .send(updateData)
        .expect(200);

      expect(parseFloat(res.body.price)).toBe(125.00);
      expect(res.body.name).toBe('Original Name'); // Unchanged
    });

    it('should update isActive status', async () => {
      const updateData = {
        isActive: false
      };

      const res = await request(app)
        .put(`/api/products/${testProduct.id}`)
        .send(updateData)
        .expect(200);

      expect(res.body.isActive).toBe(false);
    });

    it('should return 404 when updating non-existent product', async () => {
      const updateData = {
        name: 'New Name'
      };

      const res = await request(app)
        .put('/api/products/99999')
        .send(updateData)
        .expect(404);

      expect(res.body.message).toBe('Product not found');
    });

    it('should reject invalid price in update', async () => {
      const updateData = {
        price: -50.00
      };

      const res = await request(app)
        .put(`/api/products/${testProduct.id}`)
        .send(updateData)
        .expect(400);

      expect(res.body.message).toBe('Validation error');
    });

    it('should reject duplicate SKU in update', async () => {
      // Create second product
      const product2 = await Product.create({
        name: 'Product 2',
        price: 200.00,
        sku: 'PROD-002',
        category: 'Category B'
      });

      // Try to update product2 with product1's SKU
      const updateData = {
        sku: 'ORIG-001'
      };

      const res = await request(app)
        .put(`/api/products/${product2.id}`)
        .send(updateData)
        .expect(400);

      expect(res.body.message).toBe('SKU already exists');
    });
  });

  describe('DELETE /api/products/:id', () => {
    let testProduct;

    beforeEach(async () => {
      testProduct = await Product.create({
        name: 'Product to Delete',
        price: 50.00,
        category: 'Test'
      });
      await Stock.create({ productId: testProduct.id, quantity: 10 });
    });

    it('should delete existing product', async () => {
      await request(app)
        .delete(`/api/products/${testProduct.id}`)
        .expect(204);

      // Verify product is deleted
      const product = await Product.findByPk(testProduct.id);
      expect(product).toBeNull();

      // Verify stock is also deleted (CASCADE)
      const stock = await Stock.findOne({ where: { productId: testProduct.id } });
      expect(stock).toBeNull();
    });

    it('should return 404 when deleting non-existent product', async () => {
      const res = await request(app)
        .delete('/api/products/99999')
        .expect(404);

      expect(res.body.message).toBe('Product not found');
    });

    // Note: We can't easily test FK constraint without creating orders
    // That's covered in integration scenarios
  });

  describe('PUT /api/products/:id/stock', () => {
    let testProduct;

    beforeEach(async () => {
      testProduct = await Product.create({
        name: 'Stock Test Product',
        price: 100.00,
        category: 'Test'
      });
      await Stock.create({ 
        productId: testProduct.id, 
        quantity: 50,
        reservedQuantity: 0,
        reorderLevel: 10
      });
    });

    it('should set stock to specific quantity', async () => {
      const res = await request(app)
        .put(`/api/products/${testProduct.id}/stock`)
        .send({ quantity: 100, operation: 'set' })
        .expect(200);

      expect(res.body.quantity).toBe(100);
    });

    it('should add stock', async () => {
      const res = await request(app)
        .put(`/api/products/${testProduct.id}/stock`)
        .send({ quantity: 25, operation: 'add' })
        .expect(200);

      expect(res.body.quantity).toBe(75); // 50 + 25
    });

    it('should subtract stock', async () => {
      const res = await request(app)
        .put(`/api/products/${testProduct.id}/stock`)
        .send({ quantity: 20, operation: 'subtract' })
        .expect(200);

      expect(res.body.quantity).toBe(30); // 50 - 20
    });

    it('should use "set" as default operation', async () => {
      const res = await request(app)
        .put(`/api/products/${testProduct.id}/stock`)
        .send({ quantity: 200 })
        .expect(200);

      expect(res.body.quantity).toBe(200);
    });

    it('should reject subtracting more than available', async () => {
      const res = await request(app)
        .put(`/api/products/${testProduct.id}/stock`)
        .send({ quantity: 100, operation: 'subtract' })
        .expect(400);

      expect(res.body.message).toBe('Insufficient stock for operation');
    });

    it('should reject negative quantity', async () => {
      const res = await request(app)
        .put(`/api/products/${testProduct.id}/stock`)
        .send({ quantity: -10, operation: 'set' })
        .expect(400);

      expect(res.body.message).toBe('Validation error');
    });

    it('should return 404 for non-existent product', async () => {
      const res = await request(app)
        .put('/api/products/99999/stock')
        .send({ quantity: 100 })
        .expect(404);

      expect(res.body.message).toBe('Product not found');
    });

    it('should reject invalid operation', async () => {
      const res = await request(app)
        .put(`/api/products/${testProduct.id}/stock`)
        .send({ quantity: 50, operation: 'invalid' })
        .expect(400);

      expect(res.body.message).toBe('Validation error');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long product names', async () => {
      const longName = 'A'.repeat(300); // Over 255 char limit

      const res = await request(app)
        .post('/api/products')
        .send({ name: longName, price: 50.00 })
        .expect(400);

      expect(res.body.message).toBe('Validation error');
    });

    it('should handle very large prices', async () => {
      const res = await request(app)
        .post('/api/products')
        .send({ name: 'Expensive Item', price: 9999999.99 })
        .expect(400);

      expect(res.body.message).toBe('Validation error');
    });

    it('should handle empty product list', async () => {
      const res = await request(app)
        .get('/api/products')
        .expect(200);

      expect(res.body.data).toHaveLength(0);
      expect(res.body.pagination.total).toBe(0);
    });

    it('should handle pagination beyond available pages', async () => {
      await Product.create({ name: 'Product 1', price: 10.00 });
      
      const res = await request(app)
        .get('/api/products?page=999&limit=10')
        .expect(200);

      expect(res.body.data).toHaveLength(0);
      expect(res.body.pagination.page).toBe(999);
    });
  });
});
