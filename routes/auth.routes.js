const express = require("express");
const router = express.Router();
const { signupCustomer, signupFarmer, login } = require("../controllers/auth.controller");

router.post("/signup/customer", signupCustomer);
router.post("/signup/farmer", signupFarmer);
router.post("/login", login);

module.exports = router;
