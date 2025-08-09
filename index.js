// index.js
require('dotenv').config();
const express = require("express");
const { connection } = require("./config/db");
const employeeRoutes = require("./src/routes/employeeRoutes");



const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/', employeeRoutes)


app.listen(PORT, () => {
  console.log(`Port is running ${PORT}`);

})
connection();