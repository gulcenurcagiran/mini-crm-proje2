const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Mini-CRM API',
      version: '1.0.0',
      description: 'RESTful API for managing customers, orders, products, and inventory',
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development server'
      },
    ],
    components: {
      schemas: {
        Customer: {
          type: 'object',
          required: ['firstName'],
          properties: {
            id: {
              type: 'integer',
              description: 'Customer ID',
              example: 1
            },
            firstName: {
              type: 'string',
              description: 'First name',
              example: 'John'
            },
            lastName: {
              type: 'string',
              description: 'Last name',
              example: 'Doe'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email address',
              example: 'john.doe@example.com'
            },
            phone: {
              type: 'string',
              description: 'Phone number',
              example: '+1234567890'
            },
            address: {
              type: 'string',
              description: 'Address',
              example: '123 Main St, City, State 12345'
            },
            isActive: {
              type: 'boolean',
              description: 'Active status',
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        CustomerInput: {
          type: 'object',
          required: ['firstName'],
          properties: {
            firstName: {
              type: 'string',
              description: 'First name',
              example: 'John'
            },
            lastName: {
              type: 'string',
              description: 'Last name',
              example: 'Doe'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email address',
              example: 'john.doe@example.com'
            },
            phone: {
              type: 'string',
              description: 'Phone number',
              example: '+1234567890'
            },
            address: {
              type: 'string',
              description: 'Address',
              example: '123 Main St, City, State 12345'
            },
            isActive: {
              type: 'boolean',
              description: 'Active status',
              default: true
            }
          }
        },
        Order: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Order ID',
              example: 1
            },
            customerId: {
              type: 'integer',
              nullable: true,
              description: 'Customer ID (null for guest orders)',
              example: 1
            },
            status: {
              type: 'string',
              enum: ['pending', 'processing', 'shipped', 'completed', 'cancelled'],
              description: 'Order status',
              example: 'pending'
            },
            totalAmount: {
              type: 'number',
              format: 'decimal',
              description: 'Total order amount',
              example: 129.99
            },
            notes: {
              type: 'string',
              description: 'Order notes',
              example: 'Please deliver before 5 PM'
            },
            items: {
              type: 'array',
              description: 'Order items',
              items: {
                $ref: '#/components/schemas/OrderItem'
              }
            },
            customer: {
              $ref: '#/components/schemas/Customer'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        OrderItem: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Order item ID',
              example: 1
            },
            orderId: {
              type: 'integer',
              description: 'Order ID',
              example: 1
            },
            productId: {
              type: 'integer',
              description: 'Product ID',
              example: 1
            },
            quantity: {
              type: 'integer',
              description: 'Quantity',
              example: 2
            },
            price: {
              type: 'number',
              format: 'decimal',
              description: 'Price at time of purchase',
              example: 29.99
            }
          }
        },
        OrderInput: {
          type: 'object',
          required: ['items'],
          properties: {
            customerId: {
              type: 'integer',
              nullable: true,
              description: 'Customer ID (null for guest orders)',
              example: 1
            },
            status: {
              type: 'string',
              enum: ['pending', 'processing', 'shipped', 'completed', 'cancelled'],
              default: 'pending',
              description: 'Order status'
            },
            items: {
              type: 'array',
              description: 'Order items',
              items: {
                type: 'object',
                required: ['productId', 'quantity', 'price'],
                properties: {
                  productId: {
                    type: 'integer',
                    description: 'Product ID',
                    example: 1
                  },
                  quantity: {
                    type: 'integer',
                    minimum: 1,
                    description: 'Quantity',
                    example: 2
                  },
                  price: {
                    type: 'number',
                    format: 'decimal',
                    minimum: 0,
                    description: 'Price per unit',
                    example: 29.99
                  }
                }
              }
            },
            notes: {
              type: 'string',
              description: 'Order notes',
              example: 'Please deliver before 5 PM'
            }
          }
        },
        OrderUpdate: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['pending', 'processing', 'shipped', 'completed', 'cancelled'],
              description: 'Order status'
            },
            notes: {
              type: 'string',
              description: 'Order notes'
            }
          }
        },
        Product: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Product ID',
              example: 1
            },
            name: {
              type: 'string',
              description: 'Product name',
              example: 'Laptop'
            },
            description: {
              type: 'string',
              description: 'Product description',
              example: 'High-performance laptop'
            },
            price: {
              type: 'number',
              format: 'decimal',
              description: 'Product price',
              example: 999.99
            },
            sku: {
              type: 'string',
              description: 'SKU code',
              example: 'LAP001'
            },
            category: {
              type: 'string',
              description: 'Product category',
              example: 'Electronics'
            },
            isActive: {
              type: 'boolean',
              description: 'Active status',
              example: true
            },
            stock: {
              $ref: '#/components/schemas/Stock'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        ProductInput: {
          type: 'object',
          required: ['name', 'price'],
          properties: {
            name: {
              type: 'string',
              description: 'Product name',
              example: 'Laptop'
            },
            description: {
              type: 'string',
              description: 'Product description',
              example: 'High-performance laptop'
            },
            price: {
              type: 'number',
              format: 'decimal',
              minimum: 0,
              description: 'Product price',
              example: 999.99
            },
            sku: {
              type: 'string',
              description: 'SKU code',
              example: 'LAP001'
            },
            category: {
              type: 'string',
              description: 'Product category',
              example: 'Electronics'
            },
            isActive: {
              type: 'boolean',
              description: 'Active status',
              default: true
            }
          }
        },
        Stock: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Stock ID',
              example: 1
            },
            productId: {
              type: 'integer',
              description: 'Product ID',
              example: 1
            },
            quantity: {
              type: 'integer',
              description: 'Available quantity',
              example: 50
            },
            reservedQuantity: {
              type: 'integer',
              description: 'Reserved quantity',
              example: 5
            },
            reorderLevel: {
              type: 'integer',
              description: 'Reorder level threshold',
              example: 10
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        StockUpdate: {
          type: 'object',
          required: ['quantity', 'operation'],
          properties: {
            quantity: {
              type: 'integer',
              minimum: 1,
              description: 'Quantity to add/subtract',
              example: 10
            },
            operation: {
              type: 'string',
              enum: ['add', 'subtract', 'set'],
              description: 'Operation type',
              example: 'add'
            }
          }
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              description: 'Array of items'
            },
            pagination: {
              type: 'object',
              properties: {
                page: {
                  type: 'integer',
                  description: 'Current page',
                  example: 1
                },
                limit: {
                  type: 'integer',
                  description: 'Items per page',
                  example: 50
                },
                total: {
                  type: 'integer',
                  description: 'Total items',
                  example: 100
                },
                totalPages: {
                  type: 'integer',
                  description: 'Total pages',
                  example: 2
                }
              }
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Error message',
              example: 'Validation error'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                    example: 'email'
                  },
                  message: {
                    type: 'string',
                    example: 'Invalid email format'
                  }
                }
              }
            },
            traceId: {
              type: 'string',
              description: 'Request trace ID for debugging',
              example: 'abc123'
            }
          }
        }
      },
      responses: {
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                message: 'Resource not found'
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                message: 'Validation error',
                errors: [
                  {
                    field: 'email',
                    message: 'Invalid email format'
                  }
                ]
              }
            }
          }
        },
        RateLimitError: {
          description: 'Rate limit exceeded',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    example: 'Too many requests, please try again later'
                  }
                }
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Customers',
        description: 'Customer management endpoints'
      },
      {
        name: 'Orders',
        description: 'Order management endpoints'
      },
      {
        name: 'Products',
        description: 'Product management endpoints'
      },
      {
        name: 'Stock',
        description: 'Stock/inventory management endpoints'
      }
    ]
  },
  apis: ['./src/routes/*.js', './src/app.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
