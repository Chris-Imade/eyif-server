const mongoose = require("mongoose");

const GrantApplicationSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  startupName: { type: String, required: true },
  category: { type: String, required: true },
  ideaSummary: { type: String, required: true },
  problemStatement: { type: String, required: true },
  fundUsage: { type: String, required: true },
  otherCategory: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("GrantApplication", GrantApplicationSchema);
