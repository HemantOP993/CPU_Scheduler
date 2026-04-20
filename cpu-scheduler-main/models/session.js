const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  algorithm: {
    type: String,
    required: true,
    enum: ["FCFS", "SJF", "SJF_AGING", "RR", "Priority", "MLQ", "MLFQ", "MLQ_AGING"],
  },
  input: {
    type: Object,
    required: true,
  },
  output: {
    type: Object,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Session", sessionSchema);
