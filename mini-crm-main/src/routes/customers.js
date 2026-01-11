const express = require('express');
const router = express.Router();
const customerService = require('../services/customerService');
const logger = require('../lib/logger');
const { validateRequest } = require('../middleware/validation');
const { createCustomerSchema, updateCustomerSchema } = require('../validators/customerValidator');

/**
 * @swagger
 * /customers:
 *   get:
 *     summary: List all customers
 *     tags: [Customers]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of customers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Customer'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginatedResponse/properties/pagination'
 */
router.get('/', async (req, res, next) => {
  try {
    const customers = await customerService.listCustomers();
    res.json(customers);
  } catch (err) {
    logger.error('Error listing customers', { err });
    next(err);
  }
});

/**
 * @swagger
 * /customers/{id}:
 *   get:
 *     summary: Get customer by ID
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', async (req, res, next) => {
  try {
    const customer = await customerService.getCustomerById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    res.json(customer);
  } catch (err) {
    logger.error('Error getting customer', { err, customerId: req.params.id });
    next(err);
  }
});

/**
 * @swagger
 * /customers:
 *   post:
 *     summary: Create a new customer
 *     tags: [Customers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CustomerInput'
 *           example:
 *             firstName: "John"
 *             lastName: "Doe"
 *             email: "john.doe@example.com"
 *             phone: "+1234567890"
 *             address: "123 Main St"
 *     responses:
 *       201:
 *         description: Customer created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/', validateRequest(createCustomerSchema), async (req, res, next) => {
  try {
    const customer = await customerService.createCustomer(req.body);
    res.status(201).json(customer);
  } catch (err) {
    logger.error('Error creating customer', { err });
    next(err);
  }
});

/**
 * @swagger
 * /customers/{id}:
 *   put:
 *     summary: Update customer
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Customer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CustomerInput'
 *     responses:
 *       200:
 *         description: Customer updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.put('/:id', validateRequest(updateCustomerSchema), async (req, res, next) => {
  try {
    const customer = await customerService.updateCustomer(req.params.id, req.body);
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    res.json(customer);
  } catch (err) {
    logger.error('Error updating customer', { err, customerId: req.params.id });
    next(err);
  }
});

/**
 * @swagger
 * /customers/{id}:
 *   delete:
 *     summary: Delete customer
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Customer ID
 *     responses:
 *       204:
 *         description: Customer deleted successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await customerService.deleteCustomer(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    res.status(204).send();
  } catch (err) {
    logger.error('Error deleting customer', { err, customerId: req.params.id });
    next(err);
  }
});

module.exports = router;
