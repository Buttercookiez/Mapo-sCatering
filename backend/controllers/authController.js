// backend/controllers/authController.js
const { db } = require("../firestore/firebase"); // Adjust path to matches your folder structure
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate Input
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    // 2. Find user in Firestore
    const usersRef = db.collection("users");
    const snapshot = await usersRef.where("email", "==", email).get();

    if (snapshot.empty) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Get the user document
    let user = null;
    let userId = null;
    snapshot.forEach(doc => {
      user = doc.data();
      userId = doc.id;
    });

    // 3. Compare Password (Hash vs Plaintext)
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // 4. Generate JWT Token
    const token = jwt.sign(
      { id: userId, email: user.email, role: user.role },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "1d" } // Token expires in 1 day
    );

    // 5. Respond
    res.status(200).json({
      success: true,
      message: "Login successful",
      token: token,
      user: {
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error during login." });
  }
};

module.exports = { loginUser };