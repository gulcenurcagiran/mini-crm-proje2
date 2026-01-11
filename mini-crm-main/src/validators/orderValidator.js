const { z } = require('zod');

/**
 * Order validation schemas using Zod
 * These schemas define the structure and validation rules for order data
 */

// Schema for order items
const orderItemSchema = z.object({
  productId: z.number().int().positive('Product ID must be a positive integer'),
  quantity: z.number().int().positive('Quantity must be a positive integer').max(10000, 'Quantity too large'),
  price: z.number().positive('Price must be positive').optional() // Optional, can be fetched from product
});

// Schema for creating an order
const createOrderSchema = z.object({
  customerId: z.number()
    .int('Customer ID must be an integer')
    .positive('Customer ID must be positive')
    .optional()
    .nullable(), // nullable for guest orders
  
  items: z.array(orderItemSchema)
    .min(1, 'At least one item is required')
    .max(100, 'Too many items in order'),
  
  status: z.enum(['pending', 'preparing', 'ready', 'delivered', 'cancelled'])
    .optional()
    .default('pending'),
  
  notes: z.string()
    .max(1000, 'Notes must be less than 1000 characters')
    .trim()
    .optional()
    .nullable()
}).strict();

// Schema for updating an order
const updateOrderSchema = z.object({
  status: z.enum(['pending', 'preparing', 'ready', 'delivered', 'cancelled'])
    .optional(),
  
  notes: z.string()
    .max(1000, 'Notes must be less than 1000 characters')
    .trim()
    .optional()
    .nullable()
}).strict();

// Schema for query filters
const orderFilterSchema = z.object({
  customerId: z.string().regex(/^\d+$/, 'Customer ID must be numeric').optional(),
  status: z.enum(['pending', 'preparing', 'ready', 'delivered', 'cancelled']).optional(),
  page: z.string().regex(/^\d+$/, 'Page must be numeric').optional(),
  limit: z.string().regex(/^\d+$/, 'Limit must be numeric').optional()
});

module.exports = {
  createOrderSchema,
  updateOrderSchema,
  orderFilterSchema,
  orderItemSchema
};
