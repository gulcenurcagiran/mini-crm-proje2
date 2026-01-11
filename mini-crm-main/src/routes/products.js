const express = require('express');
const router = express.Router();
const productService = require('../services/productService');
const logger = require('../lib/logger');
const { validateRequest } = require('../middleware/validation');
const { 
  createProductSchema, 
  updateProductSchema,
  updateStockSchema
} = require('../validators/productValidator');

/**
 * @swagger
 * /products:
 *   get:
 *     summary: List all products
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
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
 *         description: List of products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginatedResponse/properties/pagination'
 */
router.get('/', async (req, res, next) => {
  try {
    const options = {
      category: req.query.category,
      isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      page: req.query.page ? parseInt(req.query.page) : 1,
      limit: req.query.limit ? parseInt(req.query.limit) : 50
    };
    
    const result = await productService.listProducts(options);
    res.json(result);
  } catch (err) {
    logger.error('Error listing products', { err });
    next(err);
  }
});

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product details with stock
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', async (req, res, next) => {
  try {
    const product = await productService.getProductById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json(product);
  } catch (err) {
    logger.error('Error getting product', { err, productId: req.params.id });
    next(err);
  }
});

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductInput'
 *           example:
 *             name: "Laptop"
 *             description: "High-performance laptop"
 *             price: 999.99
 *             sku: "LAP001"
 *             category: "Electronics"
 *             isActive: true
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/', validateRequest(createProductSchema), async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.body);
    res.status(201).json(product);
  } catch (err) {
    // Handle unique constraint violations (duplicate SKU)
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'SKU already exists' });
    }
    
    logger.error('Error creating product', { err });
    next(err);
  }
});

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Update product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductInput'
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.put('/:id', validateRequest(updateProductSchema), async (req, res, next) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json(product);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'SKU already exists' });
    }
    
    logger.error('Error updating product', { err, productId: req.params.id });
    next(err);
  }
});

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     responses:
 *       204:
 *         description: Product deleted successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       400:
 *         description: Cannot delete product referenced in orders
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await productService.deleteProduct(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.status(204).send();
  } catch (err) {
    // Handle foreign key constraint (product in orders)
    if (err.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ 
        message: 'Cannot delete product that is referenced in orders' 
      });
    }
    
    logger.error('Error deleting product', { err, productId: req.params.id });
    next(err);
  }
});

/**
 * @swagger
 * /products/{id}/stock:
 *   put:
 *     summary: Update product stock
 *     tags: [Stock]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StockUpdate'
 *           example:
 *             quantity: 10
 *             operation: "add"
 *     responses:
 *       200:
 *         description: Stock updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Stock'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       400:
 *         description: Insufficient stock or validation error
 */
router.put('/:id/stock', validateRequest(updateStockSchema), async (req, res, next) => {
  try {
    const { quantity, operation } = req.body;
    const stock = await productService.updateStock(req.params.id, quantity, operation);
    
    res.json(stock);
  } catch (err) {
    if (err.message === 'Stock record not found') {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    if (err.message === 'Insufficient stock') {
      return res.status(400).json({ message: 'Insufficient stock for operation' });
    }
    
    logger.error('Error updating stock', { err, productId: req.params.id });
    next(err);
  }
});

module.exports = router;
