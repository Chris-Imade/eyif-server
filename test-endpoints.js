// Test script for EYIF 2026 Grant Program endpoints
const http = require('http');

const testData = {
  idea: {
    fullName: "Test Idea User",
    email: "ideatest@example.com",
    phone: "+2348012345678",
    age: 25,
    edoConnection: "Resident",
    businessName: "Test Business Idea",
    problem: "Lack of affordable clean water in rural communities",
    solution: "Solar-powered water purification system",
    targetCustomer: "Rural communities",
    industry: "Technology",
    validationStatus: "Customer Interviews Done",
    customersSpoken: 15,
    customerFeedback: "Strong interest from 10 out of 15 interviewed",
    hasTeam: "Yes, I have a team",
    teamSkills: "Engineering, Marketing",
    fundUsage: "Prototype development",
    mvpTimeline: "3-6 months",
    jobsCreated: 3,
    revenueModel: "Subscription-based",
    socialImpact: "Provide clean water to 1000+ households"
  },
  build: {
    fullName: "Test Build User",
    email: "buildtest@example.com",
    phone: "+2348087654321",
    age: 28,
    edoConnection: "Indigene",
    startupName: "Test MVP Startup",
    foundedDate: "2024-03",
    website: "https://teststartup.com",
    problem: "Small farmers lack market access",
    solution: "Mobile app connecting farmers to buyers",
    industry: "Agriculture",
    mvpDescription: "Flutter app with price listings",
    mvpLink: "https://teststartup.com/app",
    currentUsers: 150,
    monthlyActiveUsers: 89,
    revenueGenerated: "Less than ₦100,000",
    monthlyRevenue: 50000,
    tractionMetric: "150 registered farmers",
    teamSize: 4,
    teamExpertise: "Mobile dev, Agronomy",
    challenges: "User acquisition",
    fundUsage: "Marketing expansion",
    growthTargets: "1000 users by 2026",
    jobsCreated: 5,
    revenueModel: "Commission on transactions",
    socialImpact: "Increased farmer income by 25%",
    sustainabilityPath: "Break-even at 500 users"
  },
  scale: {
    fullName: "Test Scale User",
    email: "scaletest@example.com",
    phone: "+2348056789012",
    age: 30,
    edoConnection: "Business Based",
    companyName: "Growth Stage Tech Ltd",
    cacNumber: "RC1234567",
    yearFounded: 2022,
    website: "https://growthtech.com",
    problemSolution: "AI inventory management for retail",
    industry: "Technology",
    totalUsers: 2500,
    monthlyActiveUsers: 1800,
    monthlyRevenue: 2500000,
    annualRevenue: 30000000,
    growthRate: 150,
    cac: 15000,
    ltv: 120000,
    tractionEvidence: "Recurring revenue from 50 enterprises",
    teamSize: 12,
    keyTeamMembers: "CEO, CTO, Sales Lead",
    previousFunding: "Angel Investment",
    fundingDetails: "₦5M raised in 2023",
    burnRate: 800000,
    runway: 18,
    fundUsage: "Scale engineering team",
    growthTargets: "10000 users by 2027",
    jobsCreated: 12,
    marketOpportunity: "₦50B retail tech market in Nigeria",
    socialImpact: "Reduced food waste by 30%",
    longTermVision: "Expand across West Africa",
    whyInvest: "Proven traction, strong team, large market"
  }
};

function makeRequest(path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const options = {
      hostname: 'localhost',
      port: 4500,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body: body });
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('========================================');
  console.log('EYIF 2026 Grant Program - Endpoint Tests');
  console.log('========================================\n');

  // Check server
  try {
    await new Promise((resolve, reject) => {
      const req = http.get('http://localhost:4500/', (res) => resolve(res.statusCode));
      req.on('error', () => reject(new Error('Server not running')));
      req.setTimeout(1000, () => reject(new Error('Timeout')));
    });
  } catch (e) {
    console.log('❌ Server is not running on port 4500');
    console.log('Start server with: npm run dev\n');
    process.exit(1);
  }

  console.log('✓ Server is running\n');

  // Test endpoints
  for (const [track, data] of Object.entries(testData)) {
    console.log(`Test: POST /apply/${track}`);
    try {
      const result = await makeRequest(`/apply/${track}`, data);
      console.log(`  Status: ${result.status}`);
      console.log(`  Response: ${JSON.stringify(result.body, null, 2)}`);
      console.log(result.status === 200 ? '  ✅ Working\n' : '  ❌ Failed\n');
    } catch (e) {
      console.log(`  ❌ Error: ${e.message}\n`);
    }
  }

  console.log('========================================');
  console.log('Tests completed!');
  console.log('========================================');
}

runTests();
