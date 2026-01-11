const { z } = require('zod');

/**
 * Customer validation schemas using Zod
 * These schemas define the structure and validation rules for customer data
 */

const createCustomerSchema = z.object({
  firstName: z.string()
    .min(1, 'First name is required')
    .max(100, 'First name must be less than 100 characters')
    .trim(),
  
  lastName: z.string()
    .max(100, 'Last name must be less than 100 characters')
    .trim()
    .optional()
    .nullable(),
  
  email: z.string()
    .email('Invalid email format')
    .max(255, 'Email must be less than 255 characters')
    .trim()
    .optional()
    .nullable(),
  
  phone: z.string()
    .max(20, 'Phone must be less than 20 characters')
    .trim()
    .optional()
    .nullable(),
  
  address: z.string()
    .max(500, 'Address must be less than 500 characters')
    .trim()
    .optional()
    .nullable()
});

const updateCustomerSchema = z.object({
  firstName: z.string()
    .min(1, 'First name is required')
    .max(100, 'First name must be less than 100 characters')
    .trim()
    .optional(),
  
  lastName: z.string()
    .max(100, 'Last name must be less than 100 characters')
    .trim()
    .optional()
    .nullable(),
  
  email: z.string()
    .email('Invalid email format')
    .max(255, 'Email must be less than 255 characters')
    .trim()
    .optional()
    .nullable(),
  
  phone: z.string()
    .max(20, 'Phone must be less than 20 characters')
    .trim()
    .optional()
    .nullable(),
  
  address: z.string()
    .max(500, 'Address must be less than 500 characters')
    .trim()
    .optional()
    .nullable(),
  
  isActive: z.boolean().optional()
}).strict(); // Don't allow extra fields

module.exports = {
  createCustomerSchema,
  updateCustomerSchema
};
