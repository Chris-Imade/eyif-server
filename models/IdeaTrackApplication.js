const mongoose = require("mongoose");

const IdeaTrackSchema = new mongoose.Schema({
  // Personal Information
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  age: { type: Number, required: true, min: 18, max: 35 },
  edoConnection: { type: String, required: true, enum: ["Resident", "Indigene", "Business Based"] },

  // Business Information
  businessName: { type: String, required: true },

  // Problem & Solution
  problem: { type: String, required: true, maxlength: 1000 },
  solution: { type: String, required: true, maxlength: 1000 },

  // Market & Validation
  targetCustomer: { type: String, required: true },
  industry: { type: String, required: true },
  validationStatus: { type: String, required: true },
  customersSpoken: { type: Number, required: true, min: 0 },
  customerFeedback: { type: String, required: true },

  // Team
  hasTeam: { type: String, required: true },
  teamSkills: { type: String, required: true },

  // Funding & Impact
  fundUsage: { type: String, required: true },
  mvpTimeline: { type: String, required: true },
  jobsCreated: { type: Number, required: true, min: 0 },
  revenueModel: { type: String, required: true },
  socialImpact: { type: String, required: true },

  // Metadata
  track: { type: String, default: "IDEA" },
  status: { type: String, default: "PENDING", enum: ["PENDING", "UNDER_REVIEW", "SHORTLISTED", "APPROVED", "REJECTED"] },
  grantYear: { type: Number, default: 2026 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { collection: 'ideatrackapplications_2026' });

module.exports = mongoose.model("IdeaTrackApplication", IdeaTrackSchema);
