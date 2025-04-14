import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import initializeDatabse from "./utils/db.connect.js";

dotenv.config();

initializeDatabse();

const app = express();

const corsOptions = {
  origin: [process.env.BASE_URL, "http://localhost:3000"],
  credentials: true,
  methods: ["GET", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const port = process.env.PORT || 4000;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
