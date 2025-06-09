const Contact = require("../models/Contact");
const GrantApplication = require("../models/GrantApplication");
const NewsletterSubscription = require("../models/NewsletterSubscription");
const SeatReservation = require("../models/SeatReservation");

class ReportsService {
  constructor() {
    this.models = {
      contacts: Contact,
      grantApplications: GrantApplication,
      newsletterSubscriptions: NewsletterSubscription,
      seatReservations: SeatReservation,
    };
  }

  // Get all data for a specific schema
  async getSchemaData(schemaName, includeDuplicates = true) {
    const model = this.models[schemaName];
    if (!model) {
      throw new Error(`Schema ${schemaName} not found`);
    }

    let data = await model.find({}).sort({ createdAt: -1 });
    
    if (!includeDuplicates) {
      data = this.removeDuplicates(data, schemaName);
    }

    return data;
  }

  // Remove duplicates based on email field (common across all schemas)
  removeDuplicates(data, schemaName) {
    const seen = new Set();
    return data.filter(item => {
      const email = item.email;
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
        const totalCount = await model.countDocuments();
        const allData = await model.find({});
        const uniqueData = this.removeDuplicates(allData, schemaName);
        const uniqueCount = uniqueData.length;
        const duplicateCount = totalCount - uniqueCount;

        // Get recent entries (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentCount = await model.countDocuments({
          createdAt: { $gte: sevenDaysAgo }
        });

        // Get monthly data for the last 6 months
        const monthlyData = await this.getMonthlyData(model);

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
  async getMonthlyData(model) {
    const monthlyData = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const count = await model.countDocuments({
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
    const schemaInfo = {
      contacts: {
        displayName: "Contact Forms",
        description: "Contact form submissions from website visitors",
        fields: ["firstName", "lastName", "email", "phone", "message", "createdAt"]
      },
      grantApplications: {
        displayName: "Grant Applications",
        description: "Grant application submissions for EYIF 2025",
        fields: ["fullName", "email", "phone", "startupName", "category", "ideaSummary", "problemStatement", "fundUsage", "otherCategory", "createdAt"]
      },
      newsletterSubscriptions: {
        displayName: "Newsletter Subscriptions",
        description: "Email subscriptions for EYIF newsletter",
        fields: ["email", "createdAt"]
      },
      seatReservations: {
        displayName: "Seat Reservations",
        description: "Event seat reservations for EYIF 2025",
        fields: ["firstName", "lastName", "email", "phone", "createdAt"]
      }
    };

    return schemaInfo[schemaName] || { displayName: schemaName, description: "", fields: [] };
  }

  // Convert data to CSV format
  dataToCSV(data, schemaName) {
    if (!data || data.length === 0) {
      return "No data available";
    }

    const schemaInfo = this.getSchemaInfo(schemaName);
    const headers = schemaInfo.fields;
    
    // Create CSV header
    let csv = headers.join(",") + "\n";
    
    // Add data rows
    data.forEach(item => {
      const row = headers.map(field => {
        let value = item[field] || "";
        
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

  // Get duplicate analysis
  async getDuplicateAnalysis(schemaName) {
    const model = this.models[schemaName];
    if (!model) {
      throw new Error(`Schema ${schemaName} not found`);
    }

    const allData = await model.find({});
    const emailGroups = {};
    
    // Group by email
    allData.forEach(item => {
      const email = item.email;
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
      const count = await model.countDocuments();
      const allData = await model.find({});
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
