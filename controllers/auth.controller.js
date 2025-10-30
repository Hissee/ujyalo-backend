const { getDB } = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const saltRounds = parseInt(process.env.SALT_ROUNDS || "10");
const JWT_SECRET = process.env.JWT_SECRET || "change_this_in_prod";

if (!JWT_SECRET) throw new Error("JWT_SECRET must be set in .env");

async function signupCommon(userObj, res) {
  const db = getDB();
  try {
    userObj.password = await bcrypt.hash(userObj.password, saltRounds);
    userObj.createdAt = new Date();
    userObj.updatedAt = new Date();
    const result = await db.collection("users").insertOne(userObj);
    return res.status(201).json({ message: "Signup successful", userId: result.insertedId });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: "Email already registered" });
    console.error("Signup error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

exports.signupCustomer = async (req, res) => {
  try {
    const { firstName, middleName, lastName, email, phone, province, city, street, password } = req.body;
    if (!firstName || !email || !password) return res.status(400).json({ message: "Missing required fields" });

    const user = {
      firstName, middleName, lastName,
      name: [firstName, middleName, lastName].filter(Boolean).join(" "),
      email, phone, role: "customer",
      address: { province, city, street },
      password
    };
    await signupCommon(user, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.signupFarmer = async (req, res) => {
  try {
    const { firstName, middleName, lastName, email, phone, province, password } = req.body;
    if (!firstName || !email || !password) return res.status(400).json({ message: "Missing required fields" });

    const user = {
      firstName, middleName, lastName,
      name: [firstName, middleName, lastName].filter(Boolean).join(" "),
      email, phone, role: "farmer",
      address: { province, city: "", street: "" },
      password
    };
    await signupCommon(user, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Missing email or password" });

    const db = getDB();
    const user = await db.collection("users").findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid email or password" });

    const token = jwt.sign({ userId: user._id.toString(), role: user.role, name: user.name }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ message: "Login successful", token, user: { userId: user._id, role: user.role, name: user.name } });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
