const express = require("express");
const router = express.Router();

const { addItem, updateItem, deleteItem} = require("../controllers/inventoryController");

router.post("/", addItem)
router.put("/:id", updateItem)
router.delete("/:id", deleteItem)


module.exports = router