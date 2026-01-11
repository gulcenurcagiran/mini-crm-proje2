const request = require('supertest');
const app = require('../src/app');
const { sequelize, Customer, Order } = require('../src/models');

describe('Orders API', () => {
  beforeAll(async () => {
    // Reset database
    await sequelize.sync({ force: true });
  });

  afterEach(async () => {
    // Clean up after each test
    await sequelize.query('TRUNCATE "orders" RESTART IDENTITY CASCADE');
    await sequelize.query('TRUNCATE "customers" RESTART IDENTITY CASCADE');
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /api/orders', () => {
    let testCustomer;

    beforeEach(async () => {
      // Create a test customer for order tests
      testCustomer = await Customer.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        isActive: true
      });
    });

    it('should create an order with valid data', async () => {
      const orderData = {
        customerId: testCustomer.id,
        items: [
          { productId: 1, quantity: 2, price: 10.50 },
          { productId: 2, quantity: 1, price: 25.00 }
        ],
        status: 'pending'
      };

      const res = await request(app)
        .post('/api/orders')
        .send(orderData)
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.customerId).toBe(testCustomer.id);
      expect(res.body.status).toBe('pending');
      expect(parseFloat(res.body.totalAmount)).toBe(46.00); // (2*10.50 + 1*25.00)
    });

    it('should create a guest order without customerId', async () => {
      const orderData = {
        items: [
          { productId: 1, quantity: 1, price: 15.00 }
        ]
      };

      const res = await request(app)
        .post('/api/orders')
        .send(orderData)
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.customerId).toBeNull();
      expect(parseFloat(res.body.totalAmount)).toBe(15.00);
    });

    it('should reject order with non-existent customer', async () => {
      const orderData = {
        customerId: 99999,
        items: [
          { productId: 1, quantity: 1, price: 10.00 }
        ]
      };

      const res = await request(app)
        .post('/api/orders')
        .send(orderData)
        .expect(400);

      expect(res.body.message).toBe('Customer not found');
    });

    it('should reject order with inactive customer', async () => {
      // Update customer to inactive
      await testCustomer.update({ isActive: false });

      const orderData = {
        customerId: testCustomer.id,
        items: [
          { productId: 1, quantity: 1, price: 10.00 }
        ]
      };

      const res = await request(app)
        .post('/api/orders')
        .send(orderData)
        .expect(400);

      expect(res.body.message).toBe('Customer is inactive');
    });

    it('should reject order with empty items array', async () => {
      const orderData = {
        customerId: testCustomer.id,
        items: []
      };

      const res = await request(app)
        .post('/api/orders')
        .send(orderData)
        .expect(400);

      expect(res.body.message).toBe('Validation error');
    });

    it('should reject order with invalid item data', async () => {
      const orderData = {
        customerId: testCustomer.id,
        items: [
          { productId: -1, quantity: 0, price: 10.00 } // Invalid productId and quantity
        ]
      };

      const res = await request(app)
        .post('/api/orders')
        .send(orderData)
        .expect(400);

      expect(res.body.message).toBe('Validation error');
    });

    it('should use default status "pending" if not provided', async () => {
      const orderData = {
        customerId: testCustomer.id,
        items: [
          { productId: 1, quantity: 1, price: 10.00 }
        ]
      };

      const res = await request(app)
        .post('/api/orders')
        .send(orderData)
        .expect(201);

      expect(res.body.status).toBe('pending');
    });
  });

  describe('GET /api/orders', () => {
    let customer1, customer2;

    beforeEach(async () => {
      // Create test customers
      customer1 = await Customer.create({
        firstName: 'Alice',
        lastName: 'Smith',
        email: 'alice@example.com',
        isActive: true
      });

      customer2 = await Customer.create({
        firstName: 'Bob',
        lastName: 'Jones',
        email: 'bob@example.com',
        isActive: true
      });

      // Create test orders
      await Order.create({
        customerId: customer1.id,
        status: 'pending',
        totalAmount: 100.00
      });

      await Order.create({
        customerId: customer1.id,
        status: 'delivered',
        totalAmount: 50.00
      });

      await Order.create({
        customerId: customer2.id,
        status: 'pending',
        totalAmount: 75.00
      });

      await Order.create({
        customerId: null, // Guest order
        status: 'pending',
        totalAmount: 25.00
      });
    });

    it('should list all orders', async () => {
      const res = await request(app)
        .get('/api/orders')
        .expect(200);

      expect(res.body.data).toHaveLength(4);
      expect(res.body.pagination).toHaveProperty('total', 4);
    });

    it('should filter orders by customerId', async () => {
      const res = await request(app)
        .get(`/api/orders?customerId=${customer1.id}`)
        .expect(200);

      expect(res.body.data).toHaveLength(2);
      expect(res.body.data.every(order => order.customerId === customer1.id)).toBe(true);
    });

    it('should filter orders by status', async () => {
      const res = await request(app)
        .get('/api/orders?status=pending')
        .expect(200);

      expect(res.body.data).toHaveLength(3);
      expect(res.body.data.every(order => order.status === 'pending')).toBe(true);
    });

    it('should filter by both customerId and status', async () => {
      const res = await request(app)
        .get(`/api/orders?customerId=${customer1.id}&status=delivered`)
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].status).toBe('delivered');
    });

    it('should include customer information in response', async () => {
      const res = await request(app)
        .get('/api/orders')
        .expect(200);

      const orderWithCustomer = res.body.data.find(o => o.customerId !== null);
      expect(orderWithCustomer.customer).toBeDefined();
      expect(orderWithCustomer.customer).toHaveProperty('firstName');
      expect(orderWithCustomer.customer).toHaveProperty('email');
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/orders?page=1&limit=2')
        .expect(200);

      expect(res.body.data).toHaveLength(2);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(2);
      expect(res.body.pagination.totalPages).toBe(2);
    });
  });

  describe('GET /api/orders/:id', () => {
    let testOrder;

    beforeEach(async () => {
      const customer = await Customer.create({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        isActive: true
      });

      testOrder = await Order.create({
        customerId: customer.id,
        status: 'pending',
        totalAmount: 99.99
      });
    });

    it('should get order by id', async () => {
      const res = await request(app)
        .get(`/api/orders/${testOrder.id}`)
        .expect(200);

      expect(res.body.id).toBe(testOrder.id);
      expect(res.body.customer).toBeDefined();
      expect(res.body.customer.firstName).toBe('Test');
    });

    it('should return 404 for non-existent order', async () => {
      const res = await request(app)
        .get('/api/orders/99999')
        .expect(404);

      expect(res.body.message).toBe('Order not found');
    });
  });

  describe('PUT /api/orders/:id', () => {
    let testOrder;

    beforeEach(async () => {
      const customer = await Customer.create({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        isActive: true
      });

      testOrder = await Order.create({
        customerId: customer.id,
        status: 'pending',
        totalAmount: 50.00
      });
    });

    it('should update order status', async () => {
      const res = await request(app)
        .put(`/api/orders/${testOrder.id}`)
        .send({ status: 'delivered' })
        .expect(200);

      expect(res.body.status).toBe('delivered');
    });

    it('should update order notes', async () => {
      const res = await request(app)
        .put(`/api/orders/${testOrder.id}`)
        .send({ notes: 'Customer requested express delivery' })
        .expect(200);

      expect(res.body.notes).toBe('Customer requested express delivery');
    });

    it('should return 404 for non-existent order', async () => {
      const res = await request(app)
        .put('/api/orders/99999')
        .send({ status: 'delivered' })
        .expect(404);

      expect(res.body.message).toBe('Order not found');
    });

    it('should reject invalid status', async () => {
      const res = await request(app)
        .put(`/api/orders/${testOrder.id}`)
        .send({ status: 'invalid_status' })
        .expect(400);

      expect(res.body.message).toBe('Validation error');
    });
  });

  describe('DELETE /api/orders/:id', () => {
    let testOrder;

    beforeEach(async () => {
      const customer = await Customer.create({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        isActive: true
      });

      testOrder = await Order.create({
        customerId: customer.id,
        status: 'pending',
        totalAmount: 30.00
      });
    });

    it('should delete existing order', async () => {
      await request(app)
        .delete(`/api/orders/${testOrder.id}`)
        .expect(204);

      // Verify order is deleted
      const order = await Order.findByPk(testOrder.id);
      expect(order).toBeNull();
    });

    it('should return 404 for non-existent order', async () => {
      const res = await request(app)
        .delete('/api/orders/99999')
        .expect(404);

      expect(res.body.message).toBe('Order not found');
    });
  });
});
