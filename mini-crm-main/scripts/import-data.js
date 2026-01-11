#!/usr/bin/env node

/**
 * ETL Script for importing customer and order data from Excel
 * Usage: node scripts/import-data.js <path-to-excel-file>
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const { sequelize, Customer, Order, Product, Stock } = require('../src/models');
const logger = require('../src/lib/logger');

/**
 * Export faulty rows to CSV file
 */
function exportFaultyRowsToCSV(entityType, errors, originalData) {
  if (errors.length === 0) {
    return null;
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `faulty_rows_${entityType}_${timestamp}.csv`;
  const outputDir = path.join(process.cwd(), 'logs');
  const outputPath = path.join(outputDir, filename);
  
  // Ensure logs directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Prepare data with error messages
  const csvData = errors.map(({ row, error }) => {
    return {
      ...row,
      ERROR_REASON: error
    };
  });
  
  // Convert to worksheet and write
  const worksheet = XLSX.utils.json_to_sheet(csvData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Faulty Rows');
  XLSX.writeFile(workbook, outputPath);
  
  logger.info('Faulty rows exported', { 
    entityType, 
    count: errors.length, 
    file: outputPath 
  });
  
  return outputPath;
}

/**
 * Parse Excel file and return data
 */
function parseExcelFile(filePath) {
  logger.info('Reading Excel file', { filePath });
  
  const workbook = XLSX.readFile(filePath);
  const result = {};
  
  // Read each sheet
  workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    result[sheetName] = data;
  });
  
  return result;
}

/**
 * Clean and validate customer data
 */
function cleanCustomerData(row) {
  return {
    firstName: row.firstName || row.first_name || row.FirstName || '',
    lastName: row.lastName || row.last_name || row.LastName || '',
    email: row.email || row.Email || null,
    phone: row.phone || row.Phone || null,
    address: row.address || row.Address || null,
    isActive: row.isActive !== false // Default to true unless explicitly false
  };
}

/**
 * Clean and validate product data
 */
function cleanProductData(row) {
  return {
    name: row.name || row.productName || row.Name || '',
    description: row.description || row.Description || null,
    price: parseFloat(row.price || row.Price || 0),
    sku: row.sku || row.SKU || null,
    category: row.category || row.Category || null,
    isActive: row.isActive !== false
  };
}

/**
 * Clean and validate order data
 */
function cleanOrderData(row) {
  return {
    customerId: parseInt(row.customerId || row.customer_id || row.CustomerId || 0) || null,
    status: row.status || row.Status || 'pending',
    totalAmount: parseFloat(row.totalAmount || row.total_amount || row.TotalAmount || 0),
    notes: row.notes || row.Notes || null
  };
}

/**
 * Import customers from data array
 * Fault-tolerant: continues on errors and collects faulty rows
 */
async function importCustomers(customerData) {
  logger.info('Importing customers', { count: customerData.length });
  
  const results = {
    success: 0,
    failed: 0,
    errors: [],
    faultyFile: null
  };
  
  // Continue processing even if some rows fail
  for (let i = 0; i < customerData.length; i++) {
    const row = customerData[i];
    try {
      const cleanedData = cleanCustomerData(row);
      
      // Validate required fields
      if (!cleanedData.firstName || cleanedData.firstName.trim() === '') {
        throw new Error('First name is required');
      }
      
      await Customer.create(cleanedData);
      results.success++;
      
      // Log progress every 100 rows
      if ((i + 1) % 100 === 0) {
        logger.info(`Customers progress: ${i + 1}/${customerData.length}`);
      }
    } catch (error) {
      results.failed++;
      results.errors.push({
        row: { ...row, ROW_NUMBER: i + 1 },
        error: error.message
      });
      logger.warn('Failed to import customer', { 
        rowNumber: i + 1, 
        error: error.message 
      });
    }
  }
  
  // Export faulty rows to CSV if more than 10 errors
  if (results.errors.length > 10) {
    results.faultyFile = exportFaultyRowsToCSV('customers', results.errors, customerData);
    console.log(`\nWARNING: ${results.errors.length} faulty rows exported to: ${results.faultyFile}`);
  }
  
  return results;
}

/**
 * Import products from data array
 * Fault-tolerant: continues on errors and collects faulty rows
 */
async function importProducts(productData) {
  logger.info('Importing products', { count: productData.length });
  
  const results = {
    success: 0,
    failed: 0,
    errors: [],
    faultyFile: null
  };
  
  // Continue processing even if some rows fail
  for (let i = 0; i < productData.length; i++) {
    const row = productData[i];
    try {
      const cleanedData = cleanProductData(row);
      
      // Validate required fields
      if (!cleanedData.name || cleanedData.name.trim() === '') {
        throw new Error('Product name is required');
      }
      
      if (!cleanedData.price || cleanedData.price <= 0) {
        throw new Error('Valid price is required');
      }
      
      const product = await Product.create(cleanedData);
      
      // Create stock record (fault-tolerant: use 0 if stock data is invalid)
      const initialStock = parseInt(row.stock || row.Stock || 0) || 0;
      const reorderLevel = parseInt(row.reorderLevel || row.ReorderLevel || 10) || 10;
      
      await Stock.create({
        productId: product.id,
        quantity: initialStock,
        reservedQuantity: 0,
        reorderLevel: reorderLevel
      });
      
      results.success++;
      
      // Log progress every 100 rows
      if ((i + 1) % 100 === 0) {
        logger.info(`Products progress: ${i + 1}/${productData.length}`);
      }
    } catch (error) {
      results.failed++;
      results.errors.push({
        row: { ...row, ROW_NUMBER: i + 1 },
        error: error.message
      });
      logger.warn('Failed to import product', { 
        rowNumber: i + 1, 
        error: error.message 
      });
    }
  }
  
  // Export faulty rows to CSV if more than 10 errors
  if (results.errors.length > 10) {
    results.faultyFile = exportFaultyRowsToCSV('products', results.errors, productData);
    console.log(`\nWARNING: ${results.errors.length} faulty rows exported to: ${results.faultyFile}`);
  }
  
  return results;
}

/**
 * Import orders from data array
 * Fault-tolerant: continues on errors and collects faulty rows
 * Note: Orders must reference existing customers (or use null for guest orders)
 */
async function importOrders(orderData) {
  logger.info('Importing orders', { count: orderData.length });
  
  const results = {
    success: 0,
    failed: 0,
    errors: [],
    faultyFile: null
  };
  
  // Continue processing even if some rows fail
  for (let i = 0; i < orderData.length; i++) {
    const row = orderData[i];
    try {
      const cleanedData = cleanOrderData(row);
      
      // Validate: if customerId provided, check if customer exists
      if (cleanedData.customerId) {
        const customer = await Customer.findByPk(cleanedData.customerId);
        if (!customer) {
          throw new Error(`Customer with ID ${cleanedData.customerId} not found`);
        }
      }
      
      // Validate total amount
      if (!cleanedData.totalAmount || cleanedData.totalAmount <= 0) {
        throw new Error('Valid total amount is required');
      }
      
      await Order.create(cleanedData);
      results.success++;
      
      // Log progress every 100 rows
      if ((i + 1) % 100 === 0) {
        logger.info(`Orders progress: ${i + 1}/${orderData.length}`);
      }
    } catch (error) {
      results.failed++;
      results.errors.push({
        row: { ...row, ROW_NUMBER: i + 1 },
        error: error.message
      });
      logger.warn('Failed to import order', { 
        rowNumber: i + 1, 
        error: error.message 
      });
    }
  }
  
  // Export faulty rows to CSV if more than 10 errors
  if (results.errors.length > 10) {
    results.faultyFile = exportFaultyRowsToCSV('orders', results.errors, orderData);
    console.log(`\nWARNING: ${results.errors.length} faulty rows exported to: ${results.faultyFile}`);
  }
  
  return results;
}

/**
 * Main import function
 */
async function importData(filePath) {
  try {
    // Test database connection
    await sequelize.authenticate();
    logger.info('Database connection established');
    
    // Parse Excel file
    const data = parseExcelFile(filePath);
    const sheetNames = Object.keys(data);
    logger.info('Excel file parsed', { sheets: sheetNames });
    
    // Show what sheets were found
    console.log('\nExcel Sheets Found:', sheetNames.join(', '));
    sheetNames.forEach(sheet => {
      console.log(`   - "${sheet}": ${data[sheet].length} rows`);
    });
    
    const summary = {
      customers: null,
      products: null,
      orders: null
    };
    
    // Helper function to find sheet by name (case-insensitive)
    const findSheet = (data, ...possibleNames) => {
      for (const name of possibleNames) {
        if (data[name]) return data[name];
      }
      // Try case-insensitive match
      const lowerNames = possibleNames.map(n => n.toLowerCase());
      for (const [key, value] of Object.entries(data)) {
        if (lowerNames.includes(key.toLowerCase())) {
          return value;
        }
      }
      return null;
    };
    
    // Helper to detect data type by columns
    const detectDataType = (rows) => {
      if (!rows || rows.length === 0) return null;
      const firstRow = rows[0];
      const keys = Object.keys(firstRow).map(k => k.toLowerCase());
      
      // Check for customer indicators
      if (keys.includes('firstname') || keys.includes('first_name') || 
          keys.includes('customername') || keys.includes('customer_name')) {
        return 'customers';
      }
      
      // Check for product indicators
      if (keys.includes('productname') || keys.includes('product_name') || 
          keys.includes('sku') || keys.includes('price')) {
        return 'products';
      }
      
      // Check for order indicators
      if (keys.includes('orderid') || keys.includes('order_id') ||
          keys.includes('customerid') || keys.includes('totalamount') || keys.includes('total_amount')) {
        return 'orders';
      }
      
      return null;
    };
    
    // Import customers if sheet exists
    let customerData = findSheet(data, 'Customers', 'customers', 'Customer', 'customer');
    
    // If not found by name, try to auto-detect
    if (!customerData) {
      for (const [sheetName, rows] of Object.entries(data)) {
        if (rows.length > 0 && detectDataType(rows) === 'customers') {
          console.log(`\nAuto-detected "${sheetName}" as Customers data`);
          customerData = rows;
          break;
        }
      }
    }
    
    if (customerData && customerData.length > 0) {
      console.log(`\nImporting ${customerData.length} customers...`);
      summary.customers = await importCustomers(customerData);
    }
    
    // Import products if sheet exists
    let productData = findSheet(data, 'Products', 'products', 'Product', 'product');
    
    // If not found by name, try to auto-detect
    if (!productData) {
      for (const [sheetName, rows] of Object.entries(data)) {
        if (rows.length > 0 && detectDataType(rows) === 'products') {
          console.log(`\nAuto-detected "${sheetName}" as Products data`);
          productData = rows;
          break;
        }
      }
    }
    
    if (productData && productData.length > 0) {
      console.log(`\nImporting ${productData.length} products...`);
      summary.products = await importProducts(productData);
    }
    
    // Import orders if sheet exists
    let orderData = findSheet(data, 'Orders', 'orders', 'Order', 'order');
    
    // If not found by name, try to auto-detect
    if (!orderData) {
      for (const [sheetName, rows] of Object.entries(data)) {
        if (rows.length > 0 && detectDataType(rows) === 'orders') {
          console.log(`\nAuto-detected "${sheetName}" as Orders data`);
          orderData = rows;
          break;
        }
      }
    }
    
    if (orderData && orderData.length > 0) {
      console.log(`\nImporting ${orderData.length} orders...`);
      summary.orders = await importOrders(orderData);
    }
    
    // Print summary
    console.log('\n=== Import Summary ===');
    
    let hasData = false;
    
    if (summary.customers) {
      hasData = true;
      console.log(`\nCustomers:`);
      console.log(`  Success: ${summary.customers.success}`);
      console.log(`  Failed: ${summary.customers.failed}`);
      
      if (summary.customers.errors.length > 0 && summary.customers.errors.length <= 10) {
        console.log(`  Sample Errors (showing ${Math.min(5, summary.customers.errors.length)}):`);
        summary.customers.errors.slice(0, 5).forEach(({ row, error }) => {
          console.log(`    - Row ${row.ROW_NUMBER}: ${error}`);
        });
      }
      
      if (summary.customers.faultyFile) {
        console.log(`  Faulty rows exported: ${summary.customers.faultyFile}`);
      }
    }
    
    if (summary.products) {
      hasData = true;
      console.log(`\nProducts:`);
      console.log(`  Success: ${summary.products.success}`);
      console.log(`  Failed: ${summary.products.failed}`);
      
      if (summary.products.errors.length > 0 && summary.products.errors.length <= 10) {
        console.log(`  Sample Errors (showing ${Math.min(5, summary.products.errors.length)}):`);
        summary.products.errors.slice(0, 5).forEach(({ row, error }) => {
          console.log(`    - Row ${row.ROW_NUMBER}: ${error}`);
        });
      }
      
      if (summary.products.faultyFile) {
        console.log(`  Faulty rows exported: ${summary.products.faultyFile}`);
      }
    }
    
    if (summary.orders) {
      hasData = true;
      console.log(`\nOrders:`);
      console.log(`  Success: ${summary.orders.success}`);
      console.log(`  Failed: ${summary.orders.failed}`);
      
      if (summary.orders.errors.length > 0 && summary.orders.errors.length <= 10) {
        console.log(`  Sample Errors (showing ${Math.min(5, summary.orders.errors.length)}):`);
        summary.orders.errors.slice(0, 5).forEach(({ row, error }) => {
          console.log(`    - Row ${row.ROW_NUMBER}: ${error}`);
        });
      }
      
      if (summary.orders.faultyFile) {
        console.log(`  Faulty rows exported: ${summary.orders.faultyFile}`);
      }
    }
    
    if (!hasData) {
      console.log('\nWARNING: No data imported!');
      console.log('');
      console.log('Possible reasons:');
      console.log('  1. Excel file is empty');
      console.log('  2. Sheet names don\'t match expected names');
      console.log('  3. Expected sheet names: Customers, Products, Orders (case-insensitive)');
      console.log('');
      console.log('Tip: Check sheet names above and rename them if needed');
    }
    
    console.log('\n=== Import Complete ===');
    const totalSuccess = (summary.customers?.success || 0) + (summary.products?.success || 0) + (summary.orders?.success || 0);
    const totalFailed = (summary.customers?.failed || 0) + (summary.products?.failed || 0) + (summary.orders?.failed || 0);
    console.log(`Total Success: ${totalSuccess}`);
    console.log(`Total Failed: ${totalFailed}`);
    console.log('');
    
    return summary;
  } catch (error) {
    logger.error('Import failed', { error: error.message });
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: node scripts/import-data.js <path-to-excel-file>');
    console.error('');
    console.error('Example: node scripts/import-data.js data/customers.xlsx');
    console.error('');
    console.error('Expected Excel format:');
    console.error('  - Sheet "Customers": firstName, lastName, email, phone, address');
    console.error('  - Sheet "Products": name, description, price, sku, category, stock');
    console.error('  - Sheet "Orders": customerId, status, totalAmount, notes (optional)');
    console.error('');
    console.error('Features:');
    console.error('  - Fault-tolerant: continues on errors');
    console.error('  - Auto-exports faulty rows to CSV if >10 errors');
    console.error('  - Progress logging every 100 rows');
    process.exit(1);
  }
  
  const filePath = args[0];
  
  importData(filePath)
    .then(() => {
      logger.info('Import completed successfully');
      process.exit(0);
    })
    .catch(error => {
      logger.error('Import failed', { error });
      console.error('Import failed:', error.message);
      process.exit(1);
    });
}

module.exports = { importData, importCustomers, importProducts, importOrders };
