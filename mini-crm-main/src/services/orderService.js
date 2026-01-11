const { Order, Customer, OrderItem, Stock, sequelize } = require('../models');
const logger = require('../lib/logger');

/**
 * Order Service
 * Handles business logic for order operations
 */

/**
 * Calculate total amount from items
 * In a real system, this would validate against product prices
 */
function calculateTotalAmount(items) {
  return items.reduce((sum, item) => {
    const price = item.price || 0;
    const quantity = item.quantity || 0;
    return sum + (price * quantity);
  }, 0);
}

/**
 * List orders with optional filtering and pagination
 */
async function listOrders(options = {}) {
  const { 
    customerId, 
    status, 
    page = 1, 
    limit = 50 
  } = options;
  
  const offset = (page - 1) * limit;
  
  const where = {};
  
  // Filter by customer ID if provided
  if (customerId) {
    where.customerId = customerId;
  }
  
  // Filter by status if provided
  if (status) {
    where.status = status;
  }
  
  const { count, rows } = await Order.findAndCountAll({
    where,
    limit,
    offset,
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: Customer,
        as: 'customer',
        attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
        required: false // Allow orders without customers (guest orders)
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
 * Get order by ID with customer and items
 */
async function getOrderById(id) {
  return Order.findByPk(id, {
    include: [
      {
        model: Customer,
        as: 'customer',
        attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
        required: false
      },
      {
        model: OrderItem,
        as: 'items',
        attributes: ['id', 'productId', 'quantity', 'price']
      }
    ]
  });
}

/**
 * Create a new order
 * Note: In a real system, this would also create OrderItem records
 * and validate stock availability
 */
async function createOrder(payload) {
  const { customerId, items, status = 'pending', notes } = payload;
  
  // Validate customer exists if customerId provided
  if (customerId) {
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }
    
    if (!customer.isActive) {
      throw new Error('Customer is inactive');
    }
  }
  
  // Validate stock availability for all items
  await validateStockAvailability(items);
  
  // Calculate total amount
  const totalAmount = calculateTotalAmount(items);
  
  logger.info('Creating order', { 
    customerId: customerId || 'guest', 
    itemCount: items.length,
    totalAmount 
  });
  
  // Create order (and optionally order items if products exist)
  const order = await sequelize.transaction(async (t) => {
    // Create the order
    const newOrder = await Order.create({
      customerId: customerId || null,
      status,
      totalAmount,
      notes: notes || null
    }, { transaction: t });
    
    logger.info('Order created', { orderId: newOrder.id });
    
    return newOrder;
  });
  
  // Try to create order items (outside transaction, won't fail order creation)
  // This will succeed if products exist in database
  for (const item of items) {
    try {
      await OrderItem.create({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price
      });
    } catch (itemError) {
      logger.warn(`Could not create order item for product ${item.productId}`, {
        orderId: order.id,
        error: itemError.message
      });
    }
  }
  
  // Return order with items (if any were created)
  return getOrderById(order.id);
}

/**
 * Update order status
 */
async function updateOrder(id, payload) {
  const order = await Order.findByPk(id);
  
  if (!order) {
    return null;
  }
  
  const { status, notes } = payload;
  
  const updateData = {};
  if (status !== undefined) updateData.status = status;
  if (notes !== undefined) updateData.notes = notes;
  
  await order.update(updateData);
  
  logger.info('Order updated', { 
    orderId: id, 
    status: status || order.status 
  });
  
  return order;
}

/**
 * Delete/cancel order
 */
async function deleteOrder(id) {
  const order = await Order.findByPk(id);
  
  if (!order) {
    return false;
  }
  
  // In production, you might want to soft-delete by setting status to 'cancelled'
  // instead of hard delete
  await order.destroy();
  
  logger.info('Order deleted', { orderId: id });
  
  return true;
}

/**
 * Validate stock availability for order items
 * Note: Only validates if products have stock records
 * Does not prevent orders for products without stock tracking
 */
async function validateStockAvailability(items) {
  for (const item of items) {
    const stock = await Stock.findOne({ 
      where: { productId: item.productId } 
    });
    
    // If no stock record exists, allow the order (product might not track stock)
    if (!stock) {
      logger.debug(`No stock record for product ${item.productId}, allowing order`);
      continue;
    }
    
    const availableQuantity = stock.quantity - stock.reservedQuantity;
    
    if (availableQuantity < item.quantity) {
      throw new Error(
        `Insufficient stock for product ${item.productId}. ` +
        `Available: ${availableQuantity}, Requested: ${item.quantity}`
      );
    }
  }
  
  return true;
}

module.exports = {
  listOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  validateStockAvailability
};
