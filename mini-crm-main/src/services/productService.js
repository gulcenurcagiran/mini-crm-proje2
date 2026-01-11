const { Product, Stock } = require('../models');
const logger = require('../lib/logger');

/**
 * Product Service
 * Handles business logic for product and stock operations
 */

/**
 * List products with optional filtering and pagination
 */
async function listProducts(options = {}) {
  const { 
    category, 
    isActive,
    page = 1, 
    limit = 50 
  } = options;
  
  const offset = (page - 1) * limit;
  
  const where = {};
  
  if (category) {
    where.category = category;
  }
  
  if (isActive !== undefined) {
    where.isActive = isActive;
  }
  
  const { count, rows } = await Product.findAndCountAll({
    where,
    limit,
    offset,
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: Stock,
        as: 'stock',
        attributes: ['quantity', 'reservedQuantity', 'reorderLevel'],
        required: false
      }
    ]
  });
  
  return {
    data: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    }
  };
}

/**
 * Get product by ID
 */
async function getProductById(id) {
  return Product.findByPk(id, {
    include: [
      {
        model: Stock,
        as: 'stock',
        required: false
      }
    ]
  });
}

/**
 * Create a new product
 */
async function createProduct(payload) {
  const { name, description, price, sku, category, initialStock = 0 } = payload;
  
  logger.info('Creating product', { name, sku });
  
  // Create product
  const product = await Product.create({
    name,
    description,
    price,
    sku,
    category,
    isActive: true
  });
  
  // Create associated stock record
  await Stock.create({
    productId: product.id,
    quantity: initialStock,
    reservedQuantity: 0,
    reorderLevel: 10
  });
  
  // Fetch product with stock
  return getProductById(product.id);
}

/**
 * Update product
 */
async function updateProduct(id, payload) {
  const product = await Product.findByPk(id);
  
  if (!product) {
    return null;
  }
  
  const { name, description, price, sku, category, isActive } = payload;
  
  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (price !== undefined) updateData.price = price;
  if (sku !== undefined) updateData.sku = sku;
  if (category !== undefined) updateData.category = category;
  if (isActive !== undefined) updateData.isActive = isActive;
  
  await product.update(updateData);
  
  logger.info('Product updated', { productId: id });
  
  return getProductById(id);
}

/**
 * Delete product
 */
async function deleteProduct(id) {
  const product = await Product.findByPk(id);
  
  if (!product) {
    return false;
  }
  
  await product.destroy();
  logger.info('Product deleted', { productId: id });
  
  return true;
}

/**
 * Update stock for a product
 */
async function updateStock(productId, quantity, operation = 'set') {
  const stock = await Stock.findOne({ where: { productId } });
  
  if (!stock) {
    throw new Error('Stock record not found');
  }
  
  if (operation === 'set') {
    stock.quantity = quantity;
  } else if (operation === 'add') {
    stock.quantity += quantity;
  } else if (operation === 'subtract') {
    const newQuantity = stock.quantity - quantity;
    if (newQuantity < 0) {
      throw new Error('Insufficient stock');
    }
    stock.quantity = newQuantity;
  }
  
  await stock.save();
  
  logger.info('Stock updated', { productId, quantity: stock.quantity });
  
  return stock;
}

/**
 * Check if product has sufficient stock
 */
async function checkStock(productId, requestedQuantity) {
  const stock = await Stock.findOne({ where: { productId } });
  
  if (!stock) {
    return false;
  }
  
  const availableQuantity = stock.quantity - stock.reservedQuantity;
  return availableQuantity >= requestedQuantity;
}

module.exports = {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  checkStock
};
