// server.js
const express = require("express");
const mongoose = require("mongoose");
const Product = require("./models/product");
const { result } = require("lodash");

//express app
const server = express();

//connect  to mongodb
const dbURI = "mongodb+srv://ujyaloteam:HisseeShradha@ujyalokhetcluster.ebzkrq3.mongodb.net/?appName=UjyaloKhetCluster";


server.use(express.json());
server.get('/add-product', (req, res) => {
  const product = new Product({
    id: 1,
    name: "Fresh Tomatoes",
    category: "Vegetables",
    price: 80,
    quantity: 50,
    image: "https://images.pexels.com/photos/533280/pexels-photo-533280.jpeg?auto=compress&cs=tinysrgb&w=400",
    location: "Bhaktapur",
    farmerId: "1",
    farmerName: "Ram Sharma",
    description: "Fresh, organically grown tomatoes from local farms. Rich in vitamins and perfect for daily cooking. These tomatoes are grown without harmful pesticides and are harvested at peak ripeness.",
    harvestDate: "2024-01-10",
    organic: true
  });
  product.save()
    .then(() => {
      res.send(result);
    })
    .catch((err) => {
      console.log(err)
    });
  })

mongoose
  .connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((result) => server.listen(3000, () => console.log("Server running on port 3000")))
  .catch((err) => console.log("DB connection error:", err));

server.get("/", (req, res) => {
  res.send("Server is running!");
});


