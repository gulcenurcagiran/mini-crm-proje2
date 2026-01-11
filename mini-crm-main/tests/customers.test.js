const request = require('supertest');
const app = require('../src/app');
const { sequelize, Customer } = require('../src/models');

describe('Customers API', () => {
  // Database is already synced by first test file
  beforeAll(async () => {
    // await sequelize.sync({ force: true });
  });

  // Proper teardown: close connection after all tests
  afterAll(async () => {
    // Connection will be closed by the last test file
    // await sequelize.close();
  });

  // Clean up after each test to prevent interference
  afterEach(async () => {
    // Use CASCADE to handle FK constraints
    await sequelize.query('TRUNCATE "orders" RESTART IDENTITY CASCADE');
    await sequelize.query('TRUNCATE "customers" RESTART IDENTITY CASCADE');
  });

  describe('GET /api/customers', () => {
    test('returns empty array when no customers exist', async () => {
      const res = await request(app).get('/api/customers');
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(0);
    });

    test('returns customers with pagination when they exist', async () => {
      // Create test data
      await Customer.create({ firstName: 'Test1', lastName: 'User1' });
      await Customer.create({ firstName: 'Test2', lastName: 'User2' });

      const res = await request(app).get('/api/customers');
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.total).toBe(2);
    });
  });

  describe('GET /api/customers/:id', () => {
    test('returns customer when found', async () => {
      const customer = await Customer.create({ 
        firstName: 'Test', 
        lastName: 'User',
        email: 'test@example.com'
      });

      const res = await request(app).get(`/api/customers/${customer.id}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.id).toBe(customer.id);
      expect(res.body.firstName).toBe('Test');
    });

    test('returns 404 when customer not found', async () => {
      const res = await request(app).get('/api/customers/99999');
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Customer not found');
    });
  });

  describe('POST /api/customers', () => {
    test('creates customer with valid data', async () => {
      const customerData = { 
        firstName: 'Test', 
        lastName: 'User',
        email: 'test@example.com',
        phone: '1234567890'
      };

      const res = await request(app)
        .post('/api/customers')
        .send(customerData);

      expect(res.statusCode).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.firstName).toBe(customerData.firstName);
      expect(res.body.lastName).toBe(customerData.lastName);
    });

    test('creates customer with minimal data (no email/phone)', async () => {
      const customerData = { firstName: 'Test', lastName: 'User' };

      const res = await request(app)
        .post('/api/customers')
        .send(customerData);

      expect(res.statusCode).toBe(201);
      expect(res.body.id).toBeDefined();
    });

    test('rejects customer with missing firstName', async () => {
      const customerData = { lastName: 'User' };

      const res = await request(app)
        .post('/api/customers')
        .send(customerData);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Validation error');
    });

    test('rejects customer with invalid email', async () => {
      const customerData = { 
        firstName: 'Test',
        email: 'invalid-email'
      };

      const res = await request(app)
        .post('/api/customers')
        .send(customerData);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Validation error');
    });
  });

  describe('PUT /api/customers/:id', () => {
    test('updates customer with valid data', async () => {
      const customer = await Customer.create({ firstName: 'Test', lastName: 'User' });

      const updateData = { firstName: 'Updated', email: 'updated@example.com' };

      const res = await request(app)
        .put(`/api/customers/${customer.id}`)
        .send(updateData);

      expect(res.statusCode).toBe(200);
      expect(res.body.firstName).toBe('Updated');
      expect(res.body.email).toBe('updated@example.com');
    });

    test('returns 404 when updating non-existent customer', async () => {
      const res = await request(app)
        .put('/api/customers/99999')
        .send({ firstName: 'Test' });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/customers/:id', () => {
    test('deletes existing customer', async () => {
      const customer = await Customer.create({ firstName: 'Test', lastName: 'User' });

      const res = await request(app).delete(`/api/customers/${customer.id}`);

      expect(res.statusCode).toBe(204);

      // Verify customer is deleted
      const deletedCustomer = await Customer.findByPk(customer.id);
      expect(deletedCustomer).toBeNull();
    });

    test('returns 404 when deleting non-existent customer', async () => {
      const res = await request(app).delete('/api/customers/99999');
      expect(res.statusCode).toBe(404);
    });
  });
});
