const express = require("express");
const router = express.Router();

const { addPackage, updatePackage, deletePackage } = require("../controllers/packageController");

// Matches /api/packages
router.post("/", addPackage);
router.put("/:id", updatePackage);
router.delete("/:id", deletePackage);

module.exports = router;