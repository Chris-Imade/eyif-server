const Contact = require("../models/Contact");
const GrantApplication = require("../models/GrantApplication");
const NewsletterSubscription = require("../models/NewsletterSubscription");
const SeatReservation = require("../models/SeatReservation");
const IdeaTrackApplication = require("../models/IdeaTrackApplication");
const BuildTrackApplication = require("../models/BuildTrackApplication");
const ScaleTrackApplication = require("../models/ScaleTrackApplication");

class ReportsService {
  constructor() {
    const models = {
      contacts: Contact,
      grantApplications: GrantApplication,
      newsletterSubscriptions: NewsletterSubscription,
      seatReservations: SeatReservation,
      ideaTrackApplications: IdeaTrackApplication,
      buildTrackApplications: BuildTrackApplication,
      scaleTrackApplications: ScaleTrackApplication,
    };

    this.models = Object.fromEntries(
      Object.entries(models).filter(([, model]) => this.is2026Collection(model))
    );
  }

  getSchemaNames() {
    return Object.keys(this.models);
  }

  is2026Collection(model) {
    return model.collection.collectionName.endsWith("_2026");
  }

  getModel(schemaName) {
    const model = this.models[schemaName];
    if (!model) {
      throw new Error(`Schema ${schemaName} not found`);
    }
    return model;
  }

  getBaseFilter(schemaName) {
    const model = this.getModel(schemaName);
    return model.schema.path("grantYear") ? { grantYear: 2026 } : {};
  }

  getSchemaFields(schemaName) {
    const model = this.getModel(schemaName);
    return Object.keys(model.schema.paths).filter((field) => field !== "__v");
  }

  // Get all data for a specific schema
  async getSchemaData(schemaName, includeDuplicates = true) {
    const model = this.getModel(schemaName);
    const baseFilter = this.getBaseFilter(schemaName);

    let data = await model.find(baseFilter).sort({ createdAt: -1 });
    
    if (!includeDuplicates) {
      data = this.removeDuplicates(data, schemaName);
    }

    return data;
  }

  async getPaginatedSchemaData(schemaName, { page = 1, limit = 10, includeDuplicates = false } = {}) {
    const data = await this.getSchemaData(schemaName, includeDuplicates);
    const totalRecords = data.length;
    const totalPages = Math.max(Math.ceil(totalRecords / limit), 1);
    const safePage = Math.min(Math.max(page, 1), totalPages);
    const start = (safePage - 1) * limit;

    return {
      records: data.slice(start, start + limit),
      pagination: {
        page: safePage,
        limit,
        totalRecords,
        totalPages,
        hasPrevPage: safePage > 1,
        hasNextPage: safePage < totalPages,
      },
    };
  }

  async getRecord(schemaName, recordId) {
    const model = this.getModel(schemaName);
    const record = await model.findOne({
      _id: recordId,
      ...this.getBaseFilter(schemaName),
    });

    if (!record) {
      throw new Error("Record not found");
    }
    return record;
  }

  // Remove duplicates based on email field (common across all schemas)
  removeDuplicates(data, schemaName) {
    const seen = new Set();
    return data.filter(item => {
      const email = this.getDuplicateKey(item, schemaName);
      if (seen.has(email)) {
        return false;
      }
      seen.add(email);
      return true;
    });
  }

  // Get analytics for all schemas
  async getAllAnalytics() {
    const analytics = {};

    for (const [schemaName, model] of Object.entries(this.models)) {
      try {
        const baseFilter = this.getBaseFilter(schemaName);
        const totalCount = await model.countDocuments(baseFilter);
        const allData = await model.find(baseFilter);
        const uniqueData = this.removeDuplicates(allData, schemaName);
        const uniqueCount = uniqueData.length;
        const duplicateCount = totalCount - uniqueCount;

        // Get recent entries (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentCount = await model.countDocuments({
          ...baseFilter,
          createdAt: { $gte: sevenDaysAgo }
        });

        // Get monthly data for the last 6 months
        const monthlyData = await this.getMonthlyData(model, baseFilter);

        analytics[schemaName] = {
          total: totalCount,
          unique: uniqueCount,
          duplicates: duplicateCount,
          recent: recentCount,
          monthlyData,
          schema: this.getSchemaInfo(schemaName)
        };
      } catch (error) {
        console.error(`Error getting analytics for ${schemaName}:`, error);
        analytics[schemaName] = {
          total: 0,
          unique: 0,
          duplicates: 0,
          recent: 0,
          monthlyData: [],
          schema: this.getSchemaInfo(schemaName),
          error: error.message
        };
      }
    }

    return analytics;
  }

  // Get monthly data for the last 6 months
  async getMonthlyData(model, baseFilter = {}) {
    const monthlyData = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const count = await model.countDocuments({
        ...baseFilter,
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      });

      monthlyData.push({
        month: startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        count
      });
    }

    return monthlyData;
  }

  // Get schema information
  getSchemaInfo(schemaName) {
    const model = this.models[schemaName];
    const collectionName = model ? model.collection.collectionName : "";
    const schemaInfo = {
      contacts: {
        displayName: "Contact Forms",
        description: "EYIF 2026 contact form submissions",
        fields: ["firstName", "lastName", "email", "phone", "message", "createdAt"]
      },
      grantApplications: {
        displayName: "Grant Applications",
        description: "EYIF 2026 grant application submissions",
        fields: ["fullName", "email", "phone", "startupName", "category", "ideaSummary", "problemStatement", "fundUsage", "otherCategory", "createdAt"]
      },
      newsletterSubscriptions: {
        displayName: "Newsletter Subscriptions",
        description: "EYIF 2026 newsletter subscriptions",
        fields: ["email", "createdAt"]
      },
      seatReservations: {
        displayName: "Seat Reservations",
        description: "EYIF 2026 event seat reservations",
        fields: ["firstName", "lastName", "email", "phone", "createdAt"]
      },
      ideaTrackApplications: {
        displayName: "Idea Track Applications",
        description: "EYIF 2026 idea-stage grant applications",
        fields: ["fullName", "email", "phone", "age", "businessName", "industry", "validationStatus", "customersSpoken", "jobsCreated", "status", "createdAt"]
      },
      buildTrackApplications: {
        displayName: "Build Track Applications",
        description: "EYIF 2026 MVP/startup grant applications",
        fields: ["fullName", "email", "phone", "age", "startupName", "industry", "currentUsers", "monthlyRevenue", "teamSize", "status", "createdAt"]
      },
      scaleTrackApplications: {
        displayName: "Scale Track Applications",
        description: "EYIF 2026 growth-stage grant applications",
        fields: ["fullName", "email", "phone", "age", "companyName", "industry", "totalUsers", "monthlyRevenue", "annualRevenue", "teamSize", "status", "createdAt"]
      }
    };

    const info = schemaInfo[schemaName] || { displayName: schemaName, description: "", fields: [] };

    return {
      ...info,
      detailFields: this.getSchemaFields(schemaName),
      collectionName,
    };
  }

  getRecordDetails(record, schemaName) {
    return this.getSchemaFields(schemaName).map((field) => {
      const value = record[field];
      const formattedValue = this.formatValue(value);
      const isLongText = typeof formattedValue === "string" && formattedValue.length > 120;

      return {
        field,
        label: this.formatFieldName(field),
        value: formattedValue,
        isEmpty: formattedValue === "",
        isLongText,
      };
    });
  }

  formatFieldName(field) {
    return field
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (char) => char.toUpperCase())
      .replace(/\bId\b/g, "ID");
  }

  formatValue(value) {
    if (value === null || value === undefined) return "";
    if (value instanceof Date) return value.toLocaleString();
    if (Array.isArray(value)) return value.join(", ");
    if (typeof value === "object") return JSON.stringify(value);
    return value;
  }

  escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  getDuplicateKey(item, schemaName) {
    const email = typeof item.email === "string" ? item.email.trim().toLowerCase() : "";
    return email || String(item._id);
  }

  // Convert data to CSV format
  dataToCSV(data, schemaName) {
    if (!data || data.length === 0) {
      return "No data available";
    }

    const schemaInfo = this.getSchemaInfo(schemaName);
    const headers = schemaInfo.detailFields || schemaInfo.fields;
    
    // Create CSV header
    let csv = headers.join(",") + "\n";
    
    // Add data rows
    data.forEach(item => {
      const row = headers.map(field => {
        let value = this.formatValue(item[field]);
        
        // Handle dates
        if (field === "createdAt" && value) {
          value = new Date(value).toLocaleString();
        }
        
        // Escape commas and quotes in CSV
        if (typeof value === "string") {
          value = value.replace(/"/g, '""');
          if (value.includes(",") || value.includes('"') || value.includes("\n")) {
            value = `"${value}"`;
          }
        }
        
        return value;
      });
      
      csv += row.join(",") + "\n";
    });
    
    return csv;
  }

  recordToCSV(record, schemaName) {
    return this.dataToCSV([record], schemaName);
  }

  recordToHtml(record, schemaName) {
    const schemaInfo = this.getSchemaInfo(schemaName);
    const rows = (schemaInfo.detailFields || schemaInfo.fields).map((field) => {
      const label = this.escapeHtml(this.formatFieldName(field));
      const value = this.escapeHtml(this.formatValue(record[field]) || "-");
      return `<tr><th align="left" style="padding:8px;border-bottom:1px solid #e5e7eb;background:#f8fafc;">${label}</th><td style="padding:8px;border-bottom:1px solid #e5e7eb;">${value}</td></tr>`;
    }).join("");

    return `
      <div style="font-family:Arial,sans-serif;color:#1f2937;line-height:1.5;">
        <h2 style="margin:0 0 8px;color:#4E31AA;">${this.escapeHtml(schemaInfo.displayName)} Report</h2>
        <p style="margin:0 0 16px;color:#6b7280;">Single database record exported from the EYIF reports dashboard.</p>
        <table style="border-collapse:collapse;width:100%;max-width:760px;border:1px solid #e5e7eb;">${rows}</table>
      </div>
    `;
  }

  // Get duplicate analysis
  async getDuplicateAnalysis(schemaName) {
    const model = this.getModel(schemaName);
    const baseFilter = this.getBaseFilter(schemaName);

    const allData = await model.find(baseFilter);
    const emailGroups = {};
    
    // Group by email
    allData.forEach(item => {
      const email = this.getDuplicateKey(item, schemaName);
      if (!emailGroups[email]) {
        emailGroups[email] = [];
      }
      emailGroups[email].push(item);
    });

    // Find duplicates
    const duplicates = [];
    Object.entries(emailGroups).forEach(([email, items]) => {
      if (items.length > 1) {
        duplicates.push({
          email,
          count: items.length,
          entries: items.map(item => ({
            id: item._id,
            createdAt: item.createdAt
          }))
        });
      }
    });

    return {
      totalEntries: allData.length,
      uniqueEmails: Object.keys(emailGroups).length,
      duplicateEmails: duplicates.length,
      duplicateEntries: allData.length - Object.keys(emailGroups).length,
      duplicates: duplicates.sort((a, b) => b.count - a.count)
    };
  }

  // Get database overview
  async getDatabaseOverview() {
    const overview = {
      totalSchemas: Object.keys(this.models).length,
      totalRecords: 0,
      totalUniqueRecords: 0,
      totalDuplicates: 0,
      schemaBreakdown: {}
    };

    for (const [schemaName, model] of Object.entries(this.models)) {
      const baseFilter = this.getBaseFilter(schemaName);
      const count = await model.countDocuments(baseFilter);
      const allData = await model.find(baseFilter);
      const uniqueData = this.removeDuplicates(allData, schemaName);
      
      overview.totalRecords += count;
      overview.totalUniqueRecords += uniqueData.length;
      overview.schemaBreakdown[schemaName] = {
        total: count,
        unique: uniqueData.length,
        duplicates: count - uniqueData.length
      };
    }

    overview.totalDuplicates = overview.totalRecords - overview.totalUniqueRecords;

    return overview;
  }
}

module.exports = new ReportsService();
