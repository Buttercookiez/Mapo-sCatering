const express = require('express');
const router = express.Router();
const { 
  getInventory, 
  addIngredient, 
  updateStock, 
  getDailyOrders 
} = require('../controllers/kitchenController');

// Define the Endpoints
router.get('/inventory', getInventory);       // Fetch all items
router.post('/inventory', addIngredient);     // Add new item
router.put('/inventory/:id', updateStock);    // Update stock level
router.get('/orders', getDailyOrders);        // Fetch orders for a date

module.exports = router;