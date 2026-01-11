# Swagger/OpenAPI Setup

**Status**: Complete  
**Date**: 2026-01-11

---

## Overview

Swagger UI has been successfully integrated into the Mini-CRM API, providing interactive API documentation accessible via a web interface.

---

## Access

### Swagger UI Endpoint
```
http://localhost:3000/api-docs
```

When the server is running, navigate to this URL in your browser to access the interactive API documentation.

---

## Features

### Interactive Documentation
- Browse all API endpoints
- View request/response schemas
- Test endpoints directly from the browser
- See example requests and responses

### Complete API Coverage
- **Customers**: 5 endpoints (GET list, GET by ID, POST, PUT, DELETE)
- **Orders**: 5 endpoints (GET list, GET by ID, POST, PUT, DELETE)
- **Products**: 5 endpoints (GET list, GET by ID, POST, PUT, DELETE)
- **Stock**: 1 endpoint (PUT update stock)

### Schema Definitions
- Customer (with input schema)
- Order (with items and input schema)
- Product (with stock and input schema)
- Stock (with update schema)
- Error responses
- Pagination responses

---

## Installation

Dependencies were installed using Bun:

```bash
bun add swagger-ui-express swagger-jsdoc
```

**Installed packages:**
- `swagger-ui-express@5.0.1` - Swagger UI for Express
- `swagger-jsdoc@6.2.8` - JSDoc to OpenAPI converter

---

## Configuration

### Swagger Config File
**Location**: `src/config/swagger.js`

This file contains:
- OpenAPI 3.0.0 specification
- API metadata (title, version, description)
- Server URLs (development and production)
- Component schemas (Customer, Order, Product, Stock, etc.)
- Response definitions
- Tags for endpoint grouping

### Integration
**File**: `src/app.js`

Swagger UI is mounted at `/api-docs`:
```javascript
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Mini-CRM API Documentation'
}));
```

---

## Route Annotations

All route files have been annotated with JSDoc comments that are automatically converted to OpenAPI specifications:

### Example Annotation
```javascript
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
 *     responses:
 *       200:
 *         description: List of customers
 */
```

### Annotated Files
- `src/routes/customers.js` - All 5 endpoints
- `src/routes/orders.js` - All 5 endpoints
- `src/routes/products.js` - All 6 endpoints (including stock)

---

## OpenAPI JSON Export

**Location**: `docs/openapi.json`

A standalone OpenAPI 3.0.0 JSON specification file is available for:
- Importing into other tools (Postman, Insomnia, etc.)
- Code generation
- API gateway integration
- Documentation generation

---

## Usage

### Start the Server
```bash
bun run dev
```

### Access Swagger UI
1. Open browser
2. Navigate to: `http://localhost:3000/api-docs`
3. Browse and test API endpoints

### Test Endpoints
1. Click on any endpoint in Swagger UI
2. Click "Try it out"
3. Fill in parameters/request body
4. Click "Execute"
5. View response

---

## API Endpoints in Swagger

### Customers
- `GET /api/customers` - List customers (with pagination)
- `GET /api/customers/{id}` - Get customer by ID
- `POST /api/customers` - Create customer
- `PUT /api/customers/{id}` - Update customer
- `DELETE /api/customers/{id}` - Delete customer

### Orders
- `GET /api/orders` - List orders (with filtering)
- `GET /api/orders/{id}` - Get order by ID
- `POST /api/orders` - Create order
- `PUT /api/orders/{id}` - Update order
- `DELETE /api/orders/{id}` - Delete order

### Products
- `GET /api/products` - List products (with filtering)
- `GET /api/products/{id}` - Get product by ID
- `POST /api/products` - Create product
- `PUT /api/products/{id}` - Update product
- `DELETE /api/products/{id}` - Delete product

### Stock
- `PUT /api/products/{id}/stock` - Update product stock

---

## Schema Examples

### Customer Input
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "address": "123 Main St",
  "isActive": true
}
```

### Order Input
```json
{
  "customerId": 1,
  "status": "pending",
  "items": [
    {
      "productId": 1,
      "quantity": 2,
      "price": 29.99
    }
  ],
  "notes": "Please deliver before 5 PM"
}
```

### Product Input
```json
{
  "name": "Laptop",
  "description": "High-performance laptop",
  "price": 999.99,
  "sku": "LAP001",
  "category": "Electronics",
  "isActive": true
}
```

### Stock Update
```json
{
  "quantity": 10,
  "operation": "add"
}
```

---

## Benefits

1. **Interactive Testing**: Test APIs directly from browser
2. **Auto-Generated Docs**: Always up-to-date with code
3. **Schema Validation**: See exact request/response formats
4. **Example Requests**: Pre-filled examples for quick testing
5. **Error Documentation**: All error responses documented
6. **Team Collaboration**: Share API docs easily

---

## Future Enhancements

Possible improvements:
- Add authentication documentation (when JWT is implemented)
- Add more detailed examples
- Add response examples for all endpoints
- Add rate limiting documentation
- Add CORS configuration details

---

## Troubleshooting

### Swagger UI Not Loading
- Ensure server is running: `bun run dev`
- Check URL: `http://localhost:3000/api-docs`
- Check browser console for errors

### Endpoints Not Showing
- Verify route files have JSDoc annotations
- Check `src/config/swagger.js` has correct `apis` path
- Restart server after adding new annotations

### Schema Errors
- Verify JSDoc syntax is correct
- Check component schema references
- Ensure all required fields are marked

---

## Summary

Swagger/OpenAPI is fully integrated and operational:
- 16 API endpoints documented
- Complete schema definitions
- Interactive testing interface
- OpenAPI JSON export available
- Auto-generated from code annotations

**Access**: `http://localhost:3000/api-docs`

---

**Status**: Complete  
**Version**: 1.0.0  
**Last Updated**: 2026-01-11
