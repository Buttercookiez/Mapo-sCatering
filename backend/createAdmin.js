// backend/createAdmin.js
const { db } = require("./firestore/firebase"); // Adjust path if your firebase.js is elsewhere
const bcrypt = require("bcryptjs");

const createAdmin = async () => {
  const email = "cemima@albuero.com";
  const password = "jemimaxalbuero"; // This is your raw password

  try {
    // 1. Check if admin already exists
    const snapshot = await db.collection("users").where("email", "==", email).get();
    
    if (!snapshot.empty) {
      console.log("Admin user already exists!");
      return;
    }

    // 2. Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Save to Firestore
    await db.collection("users").add({
      email: email,
      password: hashedPassword, // Saving the hash, not the plain text
      role: "admin",
      createdAt: new Date().toISOString()
    });

    console.log("✅ Admin created successfully!");
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);

  } catch (error) {
    console.error("Error creating admin:", error);
  }
};

createAdmin();