const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json"); // <--- Ensure this path is correct

// 1. INITIALIZE FIREBASE ADMIN
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// --- 2. CONFIGURATION CONSTANTS ---

// 5 Event Types
const EVENT_TYPES = ["Wedding", "Corporate Gala", "Private Dinner", "Birthday", "Other"];

// 2 Service Variants (The logic you asked for)
const SERVICE_VARIANTS = [
    { id: "full", label: "Full Service", priceMultiplier: 1.0 },       // 100% Price
    { id: "service", label: "Service Only", priceMultiplier: 0.6 }     // 60% Price (No Food)
];

// 3 Categories
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

// 3 Selections (Sizes)
const SELECTIONS = [
    { id: "selection1", label: "Intimate (30-60 Pax)", minPax: 30, maxPax: 60, priceMod: 1.15 },
    { id: "selection2", label: "Classic (61-150 Pax)", minPax: 61, maxPax: 150, priceMod: 1.0 },
    { id: "selection3", label: "Grand (150+ Pax)", minPax: 151, maxPax: 1000, priceMod: 0.90 }
];

// --- 3. SEED LOGIC ---
const seedDatabase = async () => {
    // Firestore batches allow max 500 operations. 90 is safe.
    const batch = db.batch();
    const collectionRef = db.collection("packages");
    let count = 0;

    console.log("🌱 Starting seed process...");
    console.log("   Calculating: 5 Events * 2 Variants * 3 Categories * 3 Selections = 90 Packages");

    // NESTED LOOPS TO GENERATE ALL COMBINATIONS
    EVENT_TYPES.forEach(event => {
        SERVICE_VARIANTS.forEach(variant => {
            CATEGORIES.forEach(category => {
                SELECTIONS.forEach(selection => {
                    
                    // A. Calculate Price based on all factors
                    let eventMultiplier = 1.0;
                    if (event === "Wedding") eventMultiplier = 1.25;
                    if (event === "Corporate Gala") eventMultiplier = 1.15;
                    if (event === "Private Dinner") eventMultiplier = 1.30;

                    // Formula: Base * Size Mod * Event Mod * Service Type Mod
                    const finalPrice = Math.round(
                        category.basePrice * selection.priceMod * eventMultiplier * variant.priceMultiplier
                    );
                    
                    // B. Generate Unique ID
                    // Example: wedding-full-budget-selection1
                    const cleanEvent = event.replace(/\s+/g, '').toLowerCase();
                    const docId = `${cleanEvent}-${variant.id}-${category.id}-${selection.id}`;

                    // C. Generate Display Name
                    // Example: "Wedding Mid-Range (Service Only) - Classic"
                    const tierName = selection.id === 'selection1' ? 'Lite' : selection.id === 'selection2' ? 'Classic' : 'Grand';
                    const packageName = `${event} ${category.name} (${variant.label}) - ${tierName}`;

                    // D. Determine Inclusions
                    let finalInclusions = [];
                    
                    if (variant.id === "full") {
                        // FULL SERVICE: Include food items + bonus for Grand
                        finalInclusions = [...category.inclusions];
                        if (selection.id === 'selection3') finalInclusions.push("Free Lechon or Carving Station");
                    } else {
                        // SERVICE ONLY: Staff and equipment only (No Food)
                        const baseServiceInclusions = ["Professional Waitstaff", "Tables & Chairs Setup", "Cutlery & Glassware"];
                        
                        if (category.id === "high") {
                            baseServiceInclusions.push("Event Coordinator", "Luxury Styling", "Tiffany Chairs");
                        } else if (category.id === "mid") {
                            baseServiceInclusions.push("Themed Centerpieces", "Upgraded Linens");
                        } else {
                            baseServiceInclusions.push("Basic Centerpieces");
                        }
                        
                        finalInclusions = baseServiceInclusions;
                    }

                    // E. Create Data Object
                    const data = {
                        id: docId,
                        packageId: docId,
                        eventType: event,
                        
                        // THIS IS THE KEY FIELD FOR YOUR DROPDOWN FILTER
                        selectionLabel: variant.label, // "Full Service" or "Service Only"
                        
                        // Category Details
                        category: category.name,
                        categoryId: category.id,
                        description: variant.id === "full" 
                            ? category.desc 
                            : `Service-only provision (No Food). ${category.desc}`,
                        
                        // Size Details
                        selectionId: selection.id,
                        paxLabel: selection.label, 
                        minPax: selection.minPax,
                        maxPax: selection.maxPax,
                        
                        // Main Display
                        name: packageName,
                        pricePerHead: finalPrice,
                        
                        // Array Data
                        inclusions: finalInclusions,

                        // Timestamps
                        createdAt: new Date().toISOString(),
                        lastUpdated: new Date().toISOString()
                    };

                    const docRef = collectionRef.doc(docId);
                    batch.set(docRef, data);
                    count++;
                });
            });
        });
    });

    // 4. COMMIT BATCH
    try {
        await batch.commit();
        console.log(`✅ Successfully seeded ${count} packages to Firestore!`);
    } catch (error) {
        console.error("❌ Error seeding database:", error);
    }
};

// Run it
seedDatabase();