const admin = require('firebase-admin');

// --------------------------------------------------------
// TODO: REPLACE WITH PATH TO YOUR SERVICE ACCOUNT KEY JSON
// --------------------------------------------------------
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const collectionName = "inventory"; // Change this to your actual collection name

const generateDate = () => {
    // Returns a string format similar to your screenshot or a Firestore Timestamp
    // For this script, we'll use a standard JS date string for compatibility
    return new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' });
};

const inventoryData = [
  // --- FURNITURE ---
  {
    category: "Furniture",
    name: "Monobloc Chair (White)",
    price: 450, // Replacement price
    sku: "FUR-MONO-001",
    lastUpdated: generateDate(),
    stock: { quantityInUse: 0, quantityTotal: 200, threshold: 50, unit: "Pcs" }
  },
  {
    category: "Furniture",
    name: "Tiffany Chair (Gold)",
    price: 2500,
    sku: "FUR-TIFF-002",
    lastUpdated: generateDate(),
    stock: { quantityInUse: 0, quantityTotal: 100, threshold: 20, unit: "Pcs" }
  },
  {
    category: "Furniture",
    name: "Round Table (10-Seater)",
    price: 3500,
    sku: "FUR-RND-003",
    lastUpdated: generateDate(),
    stock: { quantityInUse: 0, quantityTotal: 30, threshold: 5, unit: "Pcs" }
  },
  {
    category: "Furniture",
    name: "Rectangular Buffet Table",
    price: 2800,
    sku: "FUR-BUF-004",
    lastUpdated: generateDate(),
    stock: { quantityInUse: 0, quantityTotal: 15, threshold: 2, unit: "Pcs" }
  },
  {
    category: "Furniture",
    name: "Cocktail Table (High)",
    price: 1500,
    sku: "FUR-COCK-005",
    lastUpdated: generateDate(),
    stock: { quantityInUse: 0, quantityTotal: 20, threshold: 5, unit: "Pcs" }
  },

  // --- LINENS ---
  {
    category: "Linens",
    name: "Seat Cover (Off-White)",
    price: 150,
    sku: "LIN-SEAT-001",
    lastUpdated: generateDate(),
    stock: { quantityInUse: 0, quantityTotal: 300, threshold: 50, unit: "Pcs" }
  },
  {
    category: "Linens",
    name: "Table Cloth (Round/White)",
    price: 450,
    sku: "LIN-TAB-002",
    lastUpdated: generateDate(),
    stock: { quantityInUse: 0, quantityTotal: 50, threshold: 10, unit: "Pcs" }
  },
  {
    category: "Linens",
    name: "Table Runner (Gold Satin)",
    price: 120,
    sku: "LIN-RUN-003",
    lastUpdated: generateDate(),
    stock: { quantityInUse: 0, quantityTotal: 40, threshold: 5, unit: "Pcs" }
  },
  {
    category: "Linens",
    name: "Table Skirting (Cream)",
    price: 600,
    sku: "LIN-SKRT-004",
    lastUpdated: generateDate(),
    stock: { quantityInUse: 0, quantityTotal: 20, threshold: 2, unit: "Pcs" }
  },
  {
    category: "Linens",
    name: "Table Napkin (Cloth)",
    price: 35,
    sku: "LIN-NAP-005",
    lastUpdated: generateDate(),
    stock: { quantityInUse: 0, quantityTotal: 500, threshold: 100, unit: "Pcs" }
  },

  // --- DINING ---
  {
    category: "Dining",
    name: "Dinner Plate (Melamine)",
    price: 180,
    sku: "DIN-PLT-001",
    lastUpdated: generateDate(),
    stock: { quantityInUse: 0, quantityTotal: 400, threshold: 50, unit: "Pcs" }
  },
  {
    category: "Dining",
    name: "Spoon & Fork Set (Stainless)",
    price: 50,
    sku: "DIN-SPO-002",
    lastUpdated: generateDate(),
    stock: { quantityInUse: 0, quantityTotal: 400, threshold: 50, unit: "Pairs" }
  },
  {
    category: "Dining",
    name: "Water Goblet Glass",
    price: 120,
    sku: "DIN-GOB-003",
    lastUpdated: generateDate(),
    stock: { quantityInUse: 0, quantityTotal: 300, threshold: 30, unit: "Pcs" }
  },
  {
    category: "Dining",
    name: "Highball Glass",
    price: 80,
    sku: "DIN-HIB-004",
    lastUpdated: generateDate(),
    stock: { quantityInUse: 0, quantityTotal: 300, threshold: 30, unit: "Pcs" }
  },
  {
    category: "Dining",
    name: "Soup Bowl (Ceramic)",
    price: 90,
    sku: "DIN-BWL-005",
    lastUpdated: generateDate(),
    stock: { quantityInUse: 0, quantityTotal: 200, threshold: 20, unit: "Pcs" }
  },

  // --- EQUIPMENT ---
  {
    category: "Equipment",
    name: "Chafing Dish (Roll Top)",
    price: 4500,
    sku: "EQP-CHAF-001",
    lastUpdated: generateDate(),
    stock: { quantityInUse: 0, quantityTotal: 24, threshold: 4, unit: "Sets" }
  },
  {
    category: "Equipment",
    name: "Industrial Rice Cooker",
    price: 8500,
    sku: "EQP-RICE-002",
    lastUpdated: generateDate(),
    stock: { quantityInUse: 0, quantityTotal: 5, threshold: 1, unit: "Units" }
  },
  {
    category: "Equipment",
    name: "Juice Dispenser (Double)",
    price: 6000,
    sku: "EQP-JUICE-003",
    lastUpdated: generateDate(),
    stock: { quantityInUse: 0, quantityTotal: 4, threshold: 1, unit: "Units" }
  },
  {
    category: "Equipment",
    name: "Coffee Percolator (100 Cups)",
    price: 5500,
    sku: "EQP-COFF-004",
    lastUpdated: generateDate(),
    stock: { quantityInUse: 0, quantityTotal: 3, threshold: 1, unit: "Units" }
  },
  {
    category: "Equipment",
    name: "Kawa (Large Wok)",
    price: 2500,
    sku: "EQP-KAWA-005",
    lastUpdated: generateDate(),
    stock: { quantityInUse: 0, quantityTotal: 6, threshold: 2, unit: "Pcs" }
  },

  // --- DECORATIONS ---
  {
    category: "Decorations",
    name: "Table Centerpiece (Candelabra)",
    price: 1200,
    sku: "DEC-CAND-001",
    lastUpdated: generateDate(),
    stock: { quantityInUse: 0, quantityTotal: 30, threshold: 5, unit: "Pcs" }
  },
  {
    category: "Decorations",
    name: "Backdrop Stand (Adjustable)",
    price: 3000,
    sku: "DEC-BACK-002",
    lastUpdated: generateDate(),
    stock: { quantityInUse: 0, quantityTotal: 4, threshold: 1, unit: "Sets" }
  },
  {
    category: "Decorations",
    name: "Red Carpet (10 meters)",
    price: 1500,
    sku: "DEC-CARP-003",
    lastUpdated: generateDate(),
    stock: { quantityInUse: 0, quantityTotal: 2, threshold: 1, unit: "Rolls" }
  },
  {
    category: "Decorations",
    name: "Artificial Flower Vase",
    price: 800,
    sku: "DEC-FLOW-004",
    lastUpdated: generateDate(),
    stock: { quantityInUse: 0, quantityTotal: 50, threshold: 10, unit: "Pcs" }
  },
  {
    category: "Decorations",
    name: "Tivoli Lights (String)",
    price: 900,
    sku: "DEC-LITE-005",
    lastUpdated: generateDate(),
    stock: { quantityInUse: 0, quantityTotal: 20, threshold: 5, unit: "Sets" }
  },

  // --- STRUCTURES ---
  {
    category: "Structures",
    name: "Tolda / Tent (12x12)",
    price: 8000,
    sku: "STR-TENT-001",
    lastUpdated: generateDate(),
    stock: { quantityInUse: 0, quantityTotal: 10, threshold: 2, unit: "Sets" }
  },
  {
    category: "Structures",
    name: "Tolda / Tent (20x20)",
    price: 15000,
    sku: "STR-TENT-002",
    lastUpdated: generateDate(),
    stock: { quantityInUse: 0, quantityTotal: 5, threshold: 1, unit: "Sets" }
  },
  {
    category: "Structures",
    name: "Portable Stage Panel (4x8)",
    price: 5000,
    sku: "STR-STG-003",
    lastUpdated: generateDate(),
    stock: { quantityInUse: 0, quantityTotal: 12, threshold: 4, unit: "Pcs" }
  },
  {
    category: "Structures",
    name: "Wooden Backdrop Panel",
    price: 3500,
    sku: "STR-WALL-004",
    lastUpdated: generateDate(),
    stock: { quantityInUse: 0, quantityTotal: 6, threshold: 1, unit: "Pcs" }
  },
  {
    category: "Structures",
    name: "Bamboo Arch (Entrance)",
    price: 2500,
    sku: "STR-ARCH-005",
    lastUpdated: generateDate(),
    stock: { quantityInUse: 0, quantityTotal: 2, threshold: 1, unit: "Pcs" }
  },

  // --- MISCELLANEOUS ---
  {
    category: "Miscellaneous",
    name: "Ice Chest / Cooler (100L)",
    price: 4000,
    sku: "MSC-COOL-001",
    lastUpdated: generateDate(),
    stock: { quantityInUse: 0, quantityTotal: 10, threshold: 2, unit: "Units" }
  },
  {
    category: "Miscellaneous",
    name: "Extension Cord (Heavy Duty)",
    price: 850,
    sku: "MSC-CORD-002",
    lastUpdated: generateDate(),
    stock: { quantityInUse: 0, quantityTotal: 20, threshold: 5, unit: "Pcs" }
  },
  {
    category: "Miscellaneous",
    name: "Industrial Fan",
    price: 3500,
    sku: "MSC-FAN-003",
    lastUpdated: generateDate(),
    stock: { quantityInUse: 0, quantityTotal: 8, threshold: 2, unit: "Units" }
  },
  {
    category: "Miscellaneous",
    name: "Dishwashing Liquid (Gallon)",
    price: 400,
    sku: "MSC-SOAP-004",
    lastUpdated: generateDate(),
    stock: { quantityInUse: 0, quantityTotal: 50, threshold: 10, unit: "Gallons" }
  },
  {
    category: "Miscellaneous",
    name: "Serving Tray (Non-Slip)",
    price: 450,
    sku: "MSC-TRAY-005",
    lastUpdated: generateDate(),
    stock: { quantityInUse: 0, quantityTotal: 30, threshold: 5, unit: "Pcs" }
  }
];

async function seedDatabase() {
  const batch = db.batch();

  inventoryData.forEach((item) => {
    // We create a new reference with a random ID, or you can use item.sku as the ID
    const docRef = db.collection(collectionName).doc(); 
    batch.set(docRef, item);
  });

  try {
    await batch.commit();
    console.log(`Successfully seeded ${inventoryData.length} items into '${collectionName}'.`);
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seedDatabase();