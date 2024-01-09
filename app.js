require("dotenv").config({ path: "./.env" });
const express = require("express");
const https = require("https");
const http = require("http");
const fs = require("fs");
const socketIo = require("socket.io");
const cors = require("cors"); // Import the cors module
const allowedOrigins = ["https://mediensure.in","https://mediensure.in:3000", "https://mediensure.in:3001", "https://mediensure.in:3002","https://www.admin.mediensure.in:3000","https://www.admin.mediensure.in"];

const app = express();
const cookieParser = require("cookie-parser");

// Read SSL certificate and private key
const privateKey = fs.readFileSync("mediensure.in.key", "utf8");
const certificate = fs.readFileSync("mediensure.in.crt", "utf8");
const credentials = { key: privateKey, cert: certificate };

// Use HTTPS
const httpsServer = https.createServer(credentials, app);
const httpServer = http.createServer(app);
const io = new socketIo.Server(httpsServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// CORS configuration for Express
const corsOptions = {
  origin: allowedOrigins,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
};

app.use(cors(corsOptions));

// Routes
app.use("/api/v1/user", require("./routes/indexRoute.js"));
app.use("/api/v1/admin", require("./routes/adminRoutes.js"));
app.use("/api/v1/doctor", require("./routes/doctorRoutes.js"));
app.use("/api/v1/other", require("./routes/otherRoutes.js"));
app.use("/api/v1/network", require("./routes/networkRoute.js"));

// Error handling
const errorHanler = require("./error/errorHandler.js");
const { generatedErrror } = require("./middlewares/error.js");

app.all("*", (req, res, next) => {
  next(new errorHanler(`requested url not found ${req.url}`, 404));
});

app.use(generatedErrror);

// Start the server
const HTTP_PORT = process.env.HTTP_PORT || 8080;
const HTTPS_PORT = process.env.HTTPS_PORT || 8443;

httpServer.listen(HTTP_PORT, () => {
  console.log(`HTTP Server is running on port ${HTTP_PORT}`);
});

httpsServer.listen(HTTPS_PORT, () => {
  console.log(`HTTPS Server is running on port ${HTTPS_PORT}`);
});

module.exports = { app, io };
