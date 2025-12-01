const db = require("./firestore/firebase"); 

// --- 1. THE 5 EVENT TYPES ---
const EVENT_TYPES = [
    "Wedding", 
    "Corporate Gala", 
    "Private Dinner", 
    "Birthday", 
    "Other"
];

// --- 2. THE 3 CATEGORIES (TIERS) ---
const CATEGORIES = [
    {
        id: "budget",
        name: "Budget Friendly",
        basePrice: 500,
        desc: "Quality catering essentials at an affordable price point.",
        inclusions: ["Buffet Service", "Iced Tea", "Basic Styling"]
    },
    {
        id: "mid",  
        name: "Mid-Range",
        basePrice: 950,
        desc: "A perfect balance of premium flavors and elegant styling.",
        inclusions: ["Buffet or Plated", "Soup & Salad", "Themed Centerpieces", "Coffee Station"]
    },
    {
        id: "high",
        name: "High-End",
        basePrice: 1800,
        desc: "The ultimate VIP experience with signature chef creations.",
        inclusions: ["Full Plated Service", "Grazing Table", "Wine Pairing", "Luxury Styling", "Event Coordinator"]
    }
];

// --- 3. THE 3 SELECTIONS PER CATEGORY (Based on Pax/Size) ---
const SELECTIONS = [
    { 
        id: "selection1", 
        label: "Intimate Gathering (30-60 Pax)", 
        minPax: 30, 
        maxPax: 60, 
        priceMod: 1.15 // Higher price per head for small groups
    },
    { 
        id: "selection2", 
        label: "Classic Celebration (61-150 Pax)", 
        minPax: 61, 
        maxPax: 150, 
        priceMod: 1.0 // Standard price
    },
    { 
        id: "selection3", 
        label: "Grand Banquet (150+ Pax)", 
        minPax: 151, 
        maxPax: 1000, 
        priceMod: 0.90 // Discount for bulk
    }
];

const seedDatabase = async () => {
    try {
        // SAFETY CHECK: Only seed if the 'packages' collection is empty
        const checkSnapshot = await db.collection("packages").limit(1).get();
        if (!checkSnapshot.empty) {
            console.log(">> [DB CHECK] Database already has packages. Skipping seed.");
            return;
        }

        console.log(">> [DB SEED] Generating 45 Packages...");
        const batch = db.batch();
        let count = 0;

        // --- GENERATION LOOPS ---
        EVENT_TYPES.forEach(event => {
            CATEGORIES.forEach(category => {
                SELECTIONS.forEach(selection => {
                    
                    // 1. Calculate Price based on Event Type complexity
                    let eventMultiplier = 1.0;
                    if (event === "Wedding") eventMultiplier = 1.25; // Most expensive
                    if (event === "Corporate Gala") eventMultiplier = 1.15;
                    if (event === "Private Dinner") eventMultiplier = 1.30; // High effort for small count
                    
                    const finalPrice = Math.round(category.basePrice * selection.priceMod * eventMultiplier);

                    // 2. Generate Creative Name
                    const packageName = `${event} ${category.name} - ${selection.id === 'selection1' ? 'Lite' : selection.id === 'selection2' ? 'Classic' : 'Grand'}`;

                    // 3. Create Unique ID (e.g., wedding-budget-selection1)
                    // Removing spaces and special chars for ID
                    const cleanEvent = event.replace(/\s+/g, '').toLowerCase(); 
                    const docId = `${cleanEvent}-${category.id}-${selection.id}`;
                    
                    const docRef = db.collection("packages").doc(docId);

                    const packageData = {
                        packageId: docId,
                        eventType: event,           // Wedding, Corporate Gala...
                        category: category.name,    // Budget Friendly, Mid...
                        categoryId: category.id,
                        
                        selectionLabel: selection.label, // "Intimate Gathering..."
                        selectionId: selection.id,       // selection1, selection2, selection3
                        minPax: selection.minPax,
                        maxPax: selection.maxPax,

                        name: packageName,
                        description: category.desc,
                        pricePerHead: finalPrice,
                        
                        inclusions: [
                            ...category.inclusions,
                            selection.id === 'selection3' ? "Free Lechon or Carving Station" : null
                        ].filter(Boolean),

                        createdAt: new Date().toISOString()
                    };

                    batch.set(docRef, packageData);
                    count++;
                });
            });
        });

        await batch.commit();
        console.log(`>> [DB SEED] Success! Created ${count} unique packages.`);

    } catch (error) {
        console.error(">> [DB SEED ERROR]", error);
    }
};

module.exports = seedDatabase;