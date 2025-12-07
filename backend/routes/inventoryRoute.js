const express = require("express");
const router = express.Router();

const { addItem, updateItem, deleteItem, moveStock} = require("../controllers/inventoryController");

router.post("/", addItem)
router.put("/:id", updateItem)
router.delete("/:id", deleteItem)
router.post("/move", moveStock)


module.exports = router