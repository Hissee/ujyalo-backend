const User = require("./models/User");

// Example: Create new user
async function createUser() {
  const newUser = new User({
    full_name: "Hissee Maharjan",
    email: "maharjanhissee@gmail.com",
    password_hash: "hissee@123",
    phone: "9812345678",
    role: "farmer",
    address: "Kathmandu, Nepal",
  });

  await newUser.save();
  console.log("User created:", newUser);
}

createUser();
