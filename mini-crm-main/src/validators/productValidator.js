const { z } = require('zod');

/**
 * Product validation schemas using Zod
 */

const createProductSchema = z.object({
  name: z.string()
    .min(1, 'Product name is required')
    .max(255, 'Product name must be less than 255 characters')
    .trim(),
  
  description: z.string()
    .max(2000, 'Description must be less than 2000 characters')
    .trim()
    .optional()
    .nullable(),
  
  price: z.number()
    .positive('Price must be positive')
    .max(999999.99, 'Price is too large'),
  
  sku: z.string()
    .max(100, 'SKU must be less than 100 characters')
    .trim()
    .optional()
    .nullable(),
  
  category: z.string()
    .max(100, 'Category must be less than 100 characters')
    .trim()
    .optional()
    .nullable(),
  
  initialStock: z.number()
    .int('Initial stock must be an integer')
    .min(0, 'Initial stock cannot be negative')
    .optional()
    .default(0)
}).strict();

const updateProductSchema = z.object({
  name: z.string()
    .min(1, 'Product name is required')
    .max(255, 'Product name must be less than 255 characters')
    .trim()
    .optional(),
  
  description: z.string()
    .max(2000, 'Description must be less than 2000 characters')
    .trim()
    .optional()
    .nullable(),
  
  price: z.number()
    .positive('Price must be positive')
    .max(999999.99, 'Price is too large')
    .optional(),
  
  sku: z.string()
    .max(100, 'SKU must be less than 100 characters')
    .trim()
    .optional()
    .nullable(),
  
  category: z.string()
    .max(100, 'Category must be less than 100 characters')
    .trim()
    .optional()
    .nullable(),
  
  isActive: z.boolean().optional()
}).strict();

const updateStockSchema = z.object({
  quantity: z.number()
    .int('Quantity must be an integer')
    .min(0, 'Quantity cannot be negative'),
  
  operation: z.enum(['set', 'add', 'subtract'])
    .optional()
    .default('set')
}).strict();

module.exports = {
  createProductSchema,
  updateProductSchema,
  updateStockSchema
};
