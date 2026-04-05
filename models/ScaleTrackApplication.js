const mongoose = require("mongoose");

const ScaleTrackSchema = new mongoose.Schema({
  // Personal Information
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  age: { type: Number, required: true, min: 18, max: 35 },
  edoConnection: { type: String, required: true, enum: ["Resident", "Indigene", "Business Based"] },

  // Company Information
  companyName: { type: String, required: true },
  cacNumber: { type: String },
  yearFounded: { type: Number, required: true },
  website: { type: String, required: true },

  // Problem & Solution
  problemSolution: { type: String, required: true },
  industry: { type: String, required: true },

  // Traction & Metrics
  totalUsers: { type: Number, required: true, min: 0 },
  monthlyActiveUsers: { type: Number, required: true, min: 0 },
  monthlyRevenue: { type: Number, required: true, min: 0 },
  annualRevenue: { type: Number, required: true, min: 0 },
  growthRate: { type: Number, required: true },
  cac: { type: Number, min: 0 },
  ltv: { type: Number, min: 0 },
  tractionEvidence: { type: String, required: true },

  // Team
  teamSize: { type: Number, required: true, min: 1 },
  keyTeamMembers: { type: String, required: true },

  // Funding & Financials
  previousFunding: { type: String, required: true },
  fundingDetails: { type: String },
  burnRate: { type: Number, required: true, min: 0 },
  runway: { type: Number, required: true, min: 0 },
  fundUsage: { type: String, required: true },
  growthTargets: { type: String, required: true },

  // Impact & Vision
  jobsCreated: { type: Number, required: true, min: 0 },
  marketOpportunity: { type: String, required: true },
  socialImpact: { type: String, required: true },
  longTermVision: { type: String, required: true },
  whyInvest: { type: String, required: true },

  // Metadata
  track: { type: String, default: "SCALE" },
  status: { type: String, default: "PENDING", enum: ["PENDING", "UNDER_REVIEW", "SHORTLISTED", "APPROVED", "REJECTED"] },
  grantYear: { type: Number, default: 2026 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { collection: 'scaletrackapplications_2026' });

module.exports = mongoose.model("ScaleTrackApplication", ScaleTrackSchema);
