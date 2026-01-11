const express = require('express');
const router = express.Router();
const orderService = require('../services/orderService');
const logger = require('../lib/logger');
const { validateRequest } = require('../middleware/validation');
const { 
  createOrderSchema, 
  updateOrderSchema, 
  orderFilterSchema 
} = require('../validators/orderValidator');

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: List all orders with optional filtering
 *     tags: [Orders]
 *     parameters:
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: integer
 *         description: Filter by customer ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, shipped, completed, cancelled]
 *         description: Filter by order status
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
 *         description: List of orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginatedResponse/properties/pagination'
 */
router.get('/', async (req, res, next) => {
  try {
    // Validate query parameters
    const validatedQuery = orderFilterSchema.parse(req.query);
    
    const options = {
      customerId: validatedQuery.customerId ? parseInt(validatedQuery.customerId) : undefined,
      status: validatedQuery.status,
      page: validatedQuery.page ? parseInt(validatedQuery.page) : 1,
      limit: validatedQuery.limit ? parseInt(validatedQuery.limit) : 50
    };
    
    const result = await orderService.listOrders(options);
    res.json(result);
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ 
        message: 'Invalid query parameters', 
        errors: err.errors 
      });
    }
    logger.error('Error listing orders', { err });
    next(err);
  }
});

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order details with items
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json(order);
  } catch (err) {
    logger.error('Error getting order', { err, orderId: req.params.id });
    next(err);
  }
});

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrderInput'
 *           example:
 *             customerId: 1
 *             status: "pending"
 *             items:
 *               - productId: 1
 *                 quantity: 2
 *                 price: 29.99
 *               - productId: 2
 *                 quantity: 1
 *                 price: 49.99
 *             notes: "Please deliver before 5 PM"
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/', validateRequest(createOrderSchema), async (req, res, next) => {
  try {
    const order = await orderService.createOrder(req.body);
    res.status(201).json(order);
  } catch (err) {
    // Handle business logic errors
    if (err.message === 'Customer not found' || err.message === 'Customer is inactive') {
      return res.status(400).json({ message: err.message });
    }
    
    logger.error('Error creating order', { err });
    next(err);
  }
});

/**
 * @swagger
 * /orders/{id}:
 *   put:
 *     summary: Update order (status, notes)
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrderUpdate'
 *     responses:
 *       200:
 *         description: Order updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.put('/:id', validateRequest(updateOrderSchema), async (req, res, next) => {
  try {
    const order = await orderService.updateOrder(req.params.id, req.body);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json(order);
  } catch (err) {
    logger.error('Error updating order', { err, orderId: req.params.id });
    next(err);
  }
});

/**
 * @swagger
 * /orders/{id}:
 *   delete:
 *     summary: Delete/cancel order
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID
 *     responses:
 *       204:
 *         description: Order deleted successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await orderService.deleteOrder(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.status(204).send();
  } catch (err) {
    logger.error('Error deleting order', { err, orderId: req.params.id });
    next(err);
  }
});

module.exports = router;
