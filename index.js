const express = require("express");
const http = require("http");
const https = require("https");
const fs = require("fs");
const routes = require("./routes");
const app = express();

require("dotenv").config();

const connectToDb = require("./src/utils/db");
require("./src/utils/redis");
const helmet = require("helmet");
const cors = require("cors");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");

connectToDb();
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/", routes);

const path = require("path");
app.use(express.static(path.join(__dirname, "./public/")));

const port = process.env.PORT || 5000;
http.createServer(app).listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});

//tls options to serve over https for production
// let options = {
//   key: fs.readFileSync("key.pem"),
//   cert: fs.readFileSync("cert.pem"),
// };

// https.createServer(options, app).listen(5005);
