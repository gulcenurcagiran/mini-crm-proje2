const { Customer } = require('../models');
const logger = require('../lib/logger');

/**
 * Normalizes phone number by removing non-digit characters
 */
function normalizePhone(phone) {
  if (!phone) return null;
  return phone.replace(/\D/g, '');
}

/**
 * Normalizes email by converting to lowercase and trimming
 */
function normalizeEmail(email) {
  if (!email) return null;
  return email.toLowerCase().trim();
}

/**
 * Normalizes customer data before saving
 */
function normalizeCustomerData(data) {
  return {
    ...data,
    firstName: data.firstName?.trim(),
    lastName: data.lastName?.trim(),
    email: normalizeEmail(data.email),
    phone: normalizePhone(data.phone),
    address: data.address?.trim()
  };
}

async function listCustomers(options = {}) {
  const { page = 1, limit = 50 } = options;
  const offset = (page - 1) * limit;
  
  const { count, rows } = await Customer.findAndCountAll({
    limit,
    offset,
    order: [['createdAt', 'DESC']]
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

async function getCustomerById(id) {
  return Customer.findByPk(id);
}

async function createCustomer(payload) {
  const normalizedData = normalizeCustomerData(payload);
  logger.info('Creating customer', { firstName: normalizedData.firstName });
  
  const customer = await Customer.create(normalizedData);
  return customer;
}

async function updateCustomer(id, payload) {
  const customer = await Customer.findByPk(id);
  
  if (!customer) {
    return null;
  }
  
  const normalizedData = normalizeCustomerData(payload);
  await customer.update(normalizedData);
  
  logger.info('Customer updated', { customerId: id });
  return customer;
}

async function deleteCustomer(id) {
  const customer = await Customer.findByPk(id);
  
  if (!customer) {
    return false;
  }
  
  await customer.destroy();
  logger.info('Customer deleted', { customerId: id });
  
  return true;
}

module.exports = {
  listCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer
};
