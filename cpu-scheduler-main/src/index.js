const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

// Load .env file
dotenv.config({ path: "./.env" });

// Import Algorithms
const fcfs = require("../algorithms/fcfs");
const sjf = require("../algorithms/sjf");
const rr = require("../algorithms/rr");
const priority = require("../algorithms/priority");
const mlq = require("../algorithms/mlq");
const mlfq = require("../algorithms/mlfq");
const mlqAging = require("../algorithms/mlq_aging");
const sjfAging = require("../algorithms/sjf_aging");

// Import Mongoose model
const Session = require("../models/session");
console.log("✅ Session Type:", typeof Session);
console.log("✅ Session Keys:", Object.keys(Session));


const app = express();
const PORT = process.env.PORT || 18080;

// Middleware
app.use(cors({ origin: "http://localhost:3000" }));
app.use(bodyParser.json());

// Test Route
app.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "CPU Scheduler API is live 🚀",
  });
});

// Main Scheduling API
app.post("/api/schedule", async (req, res) => {
  try {
    const { scheduling_type, processes, quantum, num_queues } = req.body;

    // Input validation
    if (!scheduling_type || !Array.isArray(processes)) {
      return res.status(400).json({
        status: "error",
        message: "Missing or invalid 'scheduling_type' or 'processes'.",
      });
    }

    for (const p of processes) {
      if (
        typeof p.p_id === "undefined" ||
        typeof p.arrival_time !== "number" ||
        typeof p.burst_time !== "number" ||
        p.arrival_time < 0 ||
        p.burst_time <= 0
      ) {
        return res.status(400).json({
          status: "error",
          message: "Each process must have: p_id, arrival_time (>=0), burst_time (>0).",
        });
      }
    }

    if (["RR", "MLQ", "MLFQ", "MLQ_AGING"].includes(scheduling_type)) {
      if (typeof quantum !== "number" || quantum <= 0) {
        return res.status(400).json({
          status: "error",
          message: "Missing or invalid quantum value.",
        });
      }
    }

    // Scheduling logic
    let result;

    switch (scheduling_type) {
      case "FCFS":
        result = fcfs(processes);
        break;
      case "SJF":
        result = sjf(processes);
        break;
      case "RR":
        result = rr(processes, quantum);
        break;
      case "Priority":
        result = priority(processes);
        break;
      case "MLQ":
        result = mlq(processes, num_queues || 3, quantum);
        break;
      case "MLFQ":
        result = mlfq(processes, quantum, num_queues || 3);
        break;
      case "MLQ_AGING":
        result = mlqAging(processes, num_queues || 3, quantum);
        break;
      case "SJF_AGING":
        result = sjfAging(processes, 50); // You can also take aging threshold from req.body
        break;
      default:
        return res.status(400).json({
          status: "error",
          message: `Unsupported scheduling type: ${scheduling_type}`,
        });
    }

    result.status = "success";

    // Save session to DB
    await Session.create({
      algorithm: scheduling_type,
      input: { processes, quantum, num_queues },
      output: result,
    });

    res.json(result);

  } catch (error) {
    console.error("Error in /api/schedule:", error);
    res.status(500).json({
      status: "error",
      message: error.message || "Internal server error",
    });
  }
});

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
    process.exit(1);
  }
};

// Start server after DB connects
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
});
