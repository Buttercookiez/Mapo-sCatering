const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json"); // <--- Ensure path is correct

// Initialize Firebase Admin (if not already running in this process)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// --- CONSTANTS FROM REACT CODE ---
const EVENT_TYPES = ["Wedding", "Corporate Gala", "Private Dinner", "Birthday", "Other"];

const CATEGORIES = [
    { id: "budget", name: "Budget Friendly", basePrice: 500, desc: "Quality catering essentials at an affordable price point.", inclusions: ["Buffet Service", "Iced Tea", "Basic Styling"] },
    { id: "mid", name: "Mid-Range", basePrice: 950, desc: "A perfect balance of premium flavors and elegant styling.", inclusions: ["Buffet or Plated", "Soup & Salad", "Themed Centerpieces", "Coffee Station"] },
    { id: "high", name: "High-End", basePrice: 1800, desc: "The ultimate VIP experience with signature chef creations.", inclusions: ["Full Plated Service", "Grazing Table", "Wine Pairing", "Luxury Styling", "Event Coordinator"] }
];

const SELECTIONS = [
    { id: "selection1", label: "Intimate (30-60 Pax)", minPax: 30, maxPax: 60, priceMod: 1.15 },
    { id: "selection2", label: "Classic (61-150 Pax)", minPax: 61, maxPax: 150, priceMod: 1.0 },
    { id: "selection3", label: "Grand (150+ Pax)", minPax: 151, maxPax: 1000, priceMod: 0.90 }
];

// --- SEED FUNCTION ---
const seedDatabase = async () => {
    const batch = db.batch();
    const collectionRef = db.collection("packages");
    let count = 0;

    console.log("🌱 Starting seed process...");

    EVENT_TYPES.forEach(event => {
        CATEGORIES.forEach(category => {
            SELECTIONS.forEach(selection => {
                // 1. Calculate Price (Same logic as Frontend)
                let eventMultiplier = 1.0;
                if (event === "Wedding") eventMultiplier = 1.25;
                if (event === "Corporate Gala") eventMultiplier = 1.15;
                if (event === "Private Dinner") eventMultiplier = 1.30;

                const finalPrice = Math.round(category.basePrice * selection.priceMod * eventMultiplier);
                
                // 2. Generate ID and Name
                const docId = `${event.replace(/\s+/g, '').toLowerCase()}-${category.id}-${selection.id}`;
                const packageName = `${event} ${category.name} - ${selection.id === 'selection1' ? 'Lite' : selection.id === 'selection2' ? 'Classic' : 'Grand'}`;

                // 3. Prepare Data Object
                const docRef = collectionRef.doc(docId);
                const data = {
                    id: docId,
                    packageId: docId, // Redundant but matches your screenshot
                    eventType: event,
                    
                    // Category Info
                    category: category.name,
                    categoryId: category.id,
                    description: category.desc,
                    
                    // Selection/Tier Info
                    selectionId: selection.id,
                    selectionLabel: selection.label,
                    minPax: selection.minPax,
                    maxPax: selection.maxPax,
                    
                    // Display & Price
                    name: packageName,
                    pricePerHead: finalPrice,
                    
                    // Arrays
                    inclusions: [
                        ...category.inclusions,
                        selection.id === 'selection3' ? "Free Lechon or Carving Station" : null
                    ].filter(Boolean),

                    // TIMESTAMPS (Critical for Sorting!)
                    createdAt: admin.firestore.Timestamp.now(), // Matches your screenshot
                    lastUpdated: admin.firestore.Timestamp.now() // Matches my recommended hook
                };

                batch.set(docRef, data);
                count++;
            });
        });
    });

    // 4. Commit Batch
    try {
        await batch.commit();
        console.log(`✅ Successfully seeded ${count} packages to Firestore!`);
        console.log("Timestamp fields 'createdAt' and 'lastUpdated' have been added.");
    } catch (error) {
        console.error("❌ Error seeding database:", error);
    }
};

// Run the function
seedDatabase();