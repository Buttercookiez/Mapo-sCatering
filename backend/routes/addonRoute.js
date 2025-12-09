const express = require("express");
const router = express.Router();

const { 
    createAddon, 
    updateAddon, 
    deleteAddon, 
    getAllAddons 
} = require("../controllers/addonController");

// Matches /api/addons
router.get("/", getAllAddons);
router.post("/", createAddon);
router.put("/:id", updateAddon);
router.delete("/:id", deleteAddon);

module.exports = router;