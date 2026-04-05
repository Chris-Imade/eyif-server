const mongoose = require("mongoose");

const BuildTrackSchema = new mongoose.Schema({
  // Personal Information
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  age: { type: Number, required: true, min: 18, max: 35 },
  edoConnection: { type: String, required: true, enum: ["Resident", "Indigene", "Business Based"] },

  // Startup Information
  startupName: { type: String, required: true },
  foundedDate: { type: String, required: true }, // YYYY-MM format
  website: { type: String },

  // Problem & Solution
  problem: { type: String, required: true },
  solution: { type: String, required: true },
  industry: { type: String, required: true },

  // Product & Traction
  mvpDescription: { type: String, required: true },
  mvpLink: { type: String },
  currentUsers: { type: Number, required: true, min: 0 },
  monthlyActiveUsers: { type: Number, min: 0 },
  revenueGenerated: { type: String, required: true },
  monthlyRevenue: { type: Number, min: 0 },
  tractionMetric: { type: String, required: true },

  // Team
  teamSize: { type: Number, required: true, min: 1 },
  teamExpertise: { type: String, required: true },
  challenges: { type: String, required: true },

  // Funding & Growth
  fundUsage: { type: String, required: true },
  growthTargets: { type: String, required: true },
  jobsCreated: { type: Number, required: true, min: 0 },
  revenueModel: { type: String, required: true },
  socialImpact: { type: String, required: true },
  sustainabilityPath: { type: String, required: true },

  // Metadata
  track: { type: String, default: "BUILD" },
  status: { type: String, default: "PENDING", enum: ["PENDING", "UNDER_REVIEW", "SHORTLISTED", "APPROVED", "REJECTED"] },
  grantYear: { type: Number, default: 2026 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { collection: 'buildtrackapplications_2026' });

module.exports = mongoose.model("BuildTrackApplication", BuildTrackSchema);
