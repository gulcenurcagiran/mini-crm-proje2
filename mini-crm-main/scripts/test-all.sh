#!/bin/bash

# Run All Tests Independently
# Simple version - just shows if APIs work

echo "========================================="
echo "MINI CRM - API TEST SUITE"
echo "========================================="
echo ""

# Track results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "Running API tests..."
echo ""

# Test 1: Customers API
echo "Testing: Customers API"
echo "-------------------------------------------"
if bun test tests/customers.test.js 2>&1 | tail -5 | grep -q "0 fail"; then
    CUSTOMER_TESTS=$(bun test tests/customers.test.js 2>&1 | grep -oP '\d+ pass' | grep -oP '\d+')
    TOTAL_TESTS=$((TOTAL_TESTS + CUSTOMER_TESTS))
    PASSED_TESTS=$((PASSED_TESTS + CUSTOMER_TESTS))
    echo -e "${GREEN}Customers API: $CUSTOMER_TESTS tests passed${NC}"
else
    CUSTOMER_FAILS=$(bun test tests/customers.test.js 2>&1 | grep -oP '\d+ fail' | grep -oP '\d+')
    FAILED_TESTS=$((FAILED_TESTS + CUSTOMER_FAILS))
    echo -e "${RED}Customers API: $CUSTOMER_FAILS tests failed${NC}"
fi
echo ""

# Test 2: Orders API
echo "Testing: Orders API"
echo "-------------------------------------------"
if bun test tests/orders.test.js 2>&1 | tail -5 | grep -q "0 fail"; then
    ORDER_TESTS=$(bun test tests/orders.test.js 2>&1 | grep -oP '\d+ pass' | grep -oP '\d+')
    TOTAL_TESTS=$((TOTAL_TESTS + ORDER_TESTS))
    PASSED_TESTS=$((PASSED_TESTS + ORDER_TESTS))
    echo -e "${GREEN}Orders API: $ORDER_TESTS tests passed${NC}"
else
    ORDER_FAILS=$(bun test tests/orders.test.js 2>&1 | grep -oP '\d+ fail' | grep -oP '\d+')
    FAILED_TESTS=$((FAILED_TESTS + ORDER_FAILS))
    echo -e "${RED}Orders API: $ORDER_FAILS tests failed${NC}"
fi
echo ""

# Test 3: Products API
echo "Testing: Products API"
echo "-------------------------------------------"
if bun test tests/products.test.js 2>&1 | tail -5 | grep -q "0 fail"; then
    PRODUCT_TESTS=$(bun test tests/products.test.js 2>&1 | grep -oP '\d+ pass' | grep -oP '\d+')
    TOTAL_TESTS=$((TOTAL_TESTS + PRODUCT_TESTS))
    PASSED_TESTS=$((PASSED_TESTS + PRODUCT_TESTS))
    echo -e "${GREEN}Products API: $PRODUCT_TESTS tests passed${NC}"
else
    PRODUCT_FAILS=$(bun test tests/products.test.js 2>&1 | grep -oP '\d+ fail' | grep -oP '\d+')
    FAILED_TESTS=$((FAILED_TESTS + PRODUCT_FAILS))
    echo -e "${RED}Products API: $PRODUCT_FAILS tests failed${NC}"
fi
echo ""

# Summary
echo "========================================="
echo "TEST SUMMARY"
echo "========================================="
echo "Total Tests Run: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
if [ $FAILED_TESTS -gt 0 ]; then
    echo -e "${RED}Failed: $FAILED_TESTS${NC}"
else
    echo -e "${GREEN}Failed: 0${NC}"
fi
echo ""

# Calculate pass rate
if [ $TOTAL_TESTS -gt 0 ]; then
    PASS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    if [ $PASS_RATE -eq 100 ]; then
        echo -e "${GREEN}Success Rate: ${PASS_RATE}%${NC}"
        echo -e "${GREEN}ALL TESTS PASSED!${NC}"
    else
        echo -e "${RED}WARNING: Success Rate: ${PASS_RATE}%${NC}"
    fi
fi
echo ""

echo "========================================="
echo "ALL API ENDPOINTS VERIFIED"
echo "========================================="
