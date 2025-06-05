const express = require("express");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
const Contact = require("./models/Contact");
const NewsletterSubscription = require("./models/NewsletterSubscription");
const GrantApplication = require("./models/GrantApplication");
const SeatReservation = require("./models/SeatReservation");

dotenv.config();

const app = express();

// Middleware
app.use(cors({ origin: "*" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "1mb" }));

// Enable CORS for all routes
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const logoPath = path.join(__dirname, "assets", "logo.png");

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Contact Form Route
app.post("/contact", async (req, res) => {
  const { firstName, lastName, email, phone, message } = req.body;
  const fullName = `${firstName} ${lastName}`;

  // Save to DB
  try {
    await Contact.create({ firstName, lastName, email, phone, message });
  } catch (dbError) {
    console.error("Error saving contact form to DB:", dbError);
    return res.status(500).send({
      message: "Error saving contact form",
      status: 500,
      error: dbError.message,
    });
  }

  const contactEmailTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Contact Form Submission</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          color: #333;
          line-height: 1.6;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #4E31AA;
          padding: 20px;
          text-align: center;
          color: white;
        }
        .content {
          padding: 20px;
          background-color: #f9f9f9;
        }
        .footer {
          background-color: #4E31AA;
          padding: 15px;
          text-align: center;
          color: white;
          font-size: 14px;
        }
        .info-item {
          margin-bottom: 10px;
        }
        .info-label {
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="https://edoyouthimpactforum.com/images/logo-2.png" alt="EYIF Logo" style="max-width: 150px;">
          <h1>New Contact Form Submission</h1>
        </div>
        <div class="content">
          <div class="info-item">
            <span class="info-label">Name:</span> ${fullName}
          </div>
          <div class="info-item">
            <span class="info-label">Email:</span> ${email}
          </div>
          <div class="info-item">
            <span class="info-label">Phone:</span> ${phone}
          </div>
          <div class="info-item">
            <span class="info-label">Message:</span>
            <p>${message}</p>
          </div>
        </div>
        <div class="footer">
          <p>&copy; 2025 Edo Youth Impact Forum (EYIF). All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const thanksMessage = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Thank You For Contacting Us</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          color: #333;
          line-height: 1.6;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .header {
          background-color: #4E31AA;
          padding: 20px;
          text-align: center;
          color: white;
        }
        .content {
          padding: 20px 30px;
          line-height: 1.6;
        }
        .footer {
          background-color: #f4f4f4;
          text-align: center;
          padding: 15px;
          font-size: 14px;
          color: #666;
        }
        .btn {
          display: inline-block;
          background-color: #4E31AA;
          color: white;
          padding: 10px 20px;
          text-decoration: none;
          border-radius: 4px;
          margin-top: 15px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="https://edoyouthimpactforum.com/images/logo-2.png" alt="EYIF Logo" style="max-width: 150px;">
          <h1>Thank You!</h1>
        </div>
        <div class="content">
          <p>Dear <strong>${fullName}</strong>,</p>
          <p>Thank you for reaching out to the Edo Youth Impact Forum (EYIF). We have received your message and our team is currently reviewing it.</p>
          <p>We'll get back to you as soon as possible. If your inquiry is urgent, please don't hesitate to call us directly.</p>
          <p>We look forward to connecting with you at EYIF 2025!</p>
          <p>Best regards,</p>
          <p><strong>The EYIF 2025 Team</strong></p>
          <div style="text-align: center; margin-top: 20px;">
            <a href="${process.env.WEBSITE_URL}" class="btn">Visit Our Website</a>
          </div>
        </div>
        <div class="footer">
          <p>&copy; 2025 Edo Youth Impact Forum (EYIF). All rights reserved.</p>
          <p>
            <a href="${process.env.WEBSITE_URL}" style="color: #4E31AA; text-decoration: none;">Visit our website</a> | 
            <a href="mailto:${process.env.CONTACT_EMAIL}" style="color: #4E31AA; text-decoration: none;">Email us</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    // Send confirmation email to the sender
    const info = await transporter.sendMail({
      from: "Edo Youth Impact Forum 2025",
      to: email,
      subject: "Thank You for Contacting EYIF 2025",
      html: thanksMessage,
    });

    // Send notification email to admin
    const report = await transporter.sendMail({
      from: "Edo Youth Impact Forum 2025",
      to: process.env.CONTACT_EMAIL,
      subject: "New Contact Form Submission - EYIF 2025",
      html: contactEmailTemplate,
    });

    console.log("Contact confirmation email sent:", info.messageId);
    console.log("Contact notification email sent:", report.messageId);
    res
      .status(200)
      .send({ message: "Contact form submitted successfully", status: 200 });
  } catch (error) {
    console.error("Error sending contact email:", error);
    res.status(500).send({
      message: "Error submitting contact form",
      status: 500,
      error: error.message,
    });
  }
});

// Newsletter Subscription Route
app.post("/subscribe", async (req, res) => {
  const { email } = req.body;

  // Save to DB
  try {
    await NewsletterSubscription.create({ email });
  } catch (dbError) {
    console.error("Error saving newsletter subscription to DB:", dbError);
    return res.status(500).send({
      message: "Error saving subscription",
      status: 500,
      error: dbError.message,
    });
  }

  const subscribeEmailTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Thank You for Subscribing</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          color: #333;
          line-height: 1.6;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .header {
          background-color: #4E31AA;
          padding: 20px;
          text-align: center;
          color: white;
        }
        .content {
          padding: 20px 30px;
          line-height: 1.6;
        }
        .footer {
          background-color: #f4f4f4;
          text-align: center;
          padding: 15px;
          font-size: 14px;
          color: #666;
        }
        .btn {
          display: inline-block;
          background-color: #4E31AA;
          color: white;
          padding: 10px 20px;
          text-decoration: none;
          border-radius: 4px;
          margin-top: 15px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="https://edoyouthimpactforum.com/images/logo-2.png" alt="EYIF Logo" style="max-width: 150px;">
          <h1>Thanks for Subscribing!</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>Thank you for subscribing to updates from the Edo Youth Impact Forum (EYIF)!</p>
          <p>You'll now receive the latest news, event updates, and opportunities related to EYIF 2025.</p>
          <p>We're excited to have you join our community of forward-thinking youth committed to transforming the future.</p>
          <p>Best regards,</p>
          <p><strong>The EYIF 2025 Team</strong></p>
          <div style="text-align: center; margin-top: 20px;">
            <a href="${process.env.WEBSITE_URL}" class="btn">Visit Our Website</a>
          </div>
        </div>
        <div class="footer">
          <p>&copy; 2025 Edo Youth Impact Forum (EYIF). All rights reserved.</p>
          <p>
            <a href="${process.env.WEBSITE_URL}" style="color: #4E31AA; text-decoration: none;">Visit our website</a> | 
            <a href="mailto:${process.env.CONTACT_EMAIL}" style="color: #4E31AA; text-decoration: none;">Email us</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const subscribeEmailReport = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Newsletter Subscription</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          color: #333;
          line-height: 1.6;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #4E31AA;
          padding: 20px;
          text-align: center;
          color: white;
        }
        .content {
          padding: 20px;
          background-color: #f9f9f9;
        }
        .footer {
          background-color: #4E31AA;
          padding: 15px;
          text-align: center;
          color: white;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="https://edoyouthimpactforum.com/images/logo-2.png" alt="EYIF Logo" style="max-width: 150px;">
          <h1>New Newsletter Subscription</h1>
        </div>
        <div class="content">
          <p>You have a new newsletter subscriber for EYIF 2025!</p>
          <p><strong>Email:</strong> ${email}</p>
          <p>Date: ${new Date().toLocaleString()}</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 Edo Youth Impact Forum (EYIF). All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    // Send confirmation email to subscriber
    const info = await transporter.sendMail({
      from: "Edo Youth Impact Forum 2025",
      to: email,
      subject: "Thank You for Subscribing to EYIF 2025 Updates",
      html: subscribeEmailTemplate,
    });

    // Send notification email to admin
    const report = await transporter.sendMail({
      from: "Edo Youth Impact Forum 2025",
      to: process.env.NEWSLETTER_EMAIL,
      subject: "New Newsletter Subscription - EYIF 2025",
      html: subscribeEmailReport,
    });

    console.log("Subscription confirmation email sent:", info.messageId);
    console.log("Subscription notification email sent:", report.messageId);
    res.status(200).send({ message: "Subscription successful", status: 200 });
  } catch (error) {
    console.error("Error sending subscription email:", error);
    res.status(500).send({
      message: "Error submitting subscription",
      status: 500,
      error: error.message,
    });
  }
});

// Grant Registration Form Route
app.post("/grant-registration", async (req, res) => {
  const {
    fullName,
    email,
    phone,
    startupName,
    category,
    ideaSummary,
    problemStatement,
    fundUsage,
    otherCategory,
  } = req.body;

  // Save to DB
  try {
    await GrantApplication.create({
      fullName,
      email,
      phone,
      startupName,
      category,
      ideaSummary,
      problemStatement,
      fundUsage,
      otherCategory,
    });
  } catch (dbError) {
    console.error("Error saving grant application to DB:", dbError);
    return res.status(500).send({
      message: "Error saving grant application",
      status: 500,
      error: dbError.message,
    });
  }

  const getCategory = (categoryId, otherCategory) => {
    const categories = {
      "basic-education": "Basic Education",
      "agriculture-food": "Agriculture & Food Security",
      "waste-environment": "Waste, Environment & Clean Energy",
      "culture-arts": "Culture, Arts & Tourism",
      "skills-work": "Skills, Work & Entrepreneurship",
    };
    if (categoryId === "other") {
      return otherCategory;
    }
    return categories[categoryId] || categoryId;
  };

  const categoryName = getCategory(category, otherCategory);

  const grantRegistrationTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Grant Registration</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          color: #333;
          line-height: 1.6;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #4E31AA;
          padding: 20px;
          text-align: center;
          color: white;
        }
        .content {
          padding: 20px;
          background-color: #f9f9f9;
        }
        .footer {
          background-color: #4E31AA;
          padding: 15px;
          text-align: center;
          color: white;
          font-size: 14px;
        }
        .info-item {
          margin-bottom: 15px;
          border-bottom: 1px solid #eee;
          padding-bottom: 15px;
        }
        .info-item:last-child {
          border-bottom: none;
        }
        .info-label {
          font-weight: bold;
          display: block;
          margin-bottom: 5px;
        }
        .category-badge {
          display: inline-block;
          background-color: #4E31AA;
          color: white;
          padding: 5px 10px;
          border-radius: 20px;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="https://edoyouthimpactforum.com/images/logo-2.png" alt="EYIF Logo" style="max-width: 150px;">
          <h1>New Grant Application</h1>
        </div>
        <div class="content">
          <div class="info-item">
            <span class="info-label">Name:</span>
            ${fullName}
          </div>
          <div class="info-item">
            <span class="info-label">Email:</span>
            ${email}
          </div>
          <div class="info-item">
            <span class="info-label">Phone:</span>
            ${phone}
          </div>
          <div class="info-item">
            <span class="info-label">Startup/Idea Name:</span>
            ${startupName}
          </div>
          <div class="info-item">
            <span class="info-label">Category:</span>
            <span class="category-badge">${categoryName}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Idea Summary:</span>
            <p>${ideaSummary}</p>
          </div>
          <div class="info-item">
            <span class="info-label">Problem Statement:</span>
            <p>${problemStatement}</p>
          </div>
          <div class="info-item">
            <span class="info-label">Fund Usage:</span>
            <p>${fundUsage}</p>
          </div>
          <div class="info-item">
            <span class="info-label">Submission Date:</span>
            ${new Date().toLocaleString()}
          </div>
        </div>
        <div class="footer">
          <p>&copy; 2025 Edo Youth Impact Forum (EYIF). All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const applicantConfirmationTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Grant Application Received</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          color: #333;
          line-height: 1.6;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .header {
          background-color: #4E31AA;
          padding: 20px;
          text-align: center;
          color: white;
        }
        .content {
          padding: 20px 30px;
          line-height: 1.6;
        }
        .footer {
          background-color: #f4f4f4;
          text-align: center;
          padding: 15px;
          font-size: 14px;
          color: #666;
        }
        .btn {
          display: inline-block;
          background-color: #4E31AA;
          color: white;
          padding: 10px 20px;
          text-decoration: none;
          border-radius: 4px;
          margin-top: 15px;
        }
        .app-details {
          background-color: #f9f9f9;
          padding: 15px;
          border-radius: 4px;
          margin: 20px 0;
        }
        .category-badge {
          display: inline-block;
          background-color: #4E31AA;
          color: white;
          padding: 5px 10px;
          border-radius: 20px;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="https://edoyouthimpactforum.com/images/logo-2.png" alt="EYIF Logo" style="max-width: 150px;">
          <h1>Application Received!</h1>
        </div>
        <div class="content">
          <p>Dear <strong>${fullName}</strong>,</p>
          <p>Thank you for submitting your application for the EYIF 2025 Grant. We have received your submission and it's now being reviewed by our team.</p>
          
          <div class="app-details">
            <h3>Application Details:</h3>
            <p><strong>Startup/Idea Name:</strong> ${startupName}</p>
            <p><strong>Category:</strong> <span class="category-badge">${categoryName}</span></p>
            <p><strong>Submission Date:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <p>What happens next?</p>
          <ol>
            <li>Our team will review all applications.</li>
            <li>Shortlisted candidates will be contacted for the next round.</li>
            <li>Winners will be announced during the EYIF 2025 event on July 2nd at Victor Uwaifo Creative Hub, Benin.</li>
          </ol>
          
          <p>If you have any questions about your application, please don't hesitate to contact us.</p>
          
          <p>Best of luck with your application!</p>
          <p><strong>The EYIF 2025 Team</strong></p>
          
          <div style="text-align: center; margin-top: 20px;">
            <a href="${
              process.env.WEBSITE_URL
            }" class="btn">Visit Our Website</a>
          </div>
        </div>
        <div class="footer">
          <p>&copy; 2025 Edo Youth Impact Forum (EYIF). All rights reserved.</p>
          <p>
            <a href="${
              process.env.WEBSITE_URL
            }" style="color: #4E31AA; text-decoration: none;">Visit our website</a> | 
            <a href="mailto:${
              process.env.GRANT_EMAIL
            }" style="color: #4E31AA; text-decoration: none;">Email us</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    // Send confirmation email to applicant
    const info = await transporter.sendMail({
      from: "Edo Youth Impact Forum 2025",
      to: email,
      subject: "Your EYIF 2025 Grant Application Has Been Received",
      html: applicantConfirmationTemplate,
    });

    // Send notification emails to admins
    const adminEmails = [
      "iguodalaefosa@gmail.com",
      "ebuka0064@gmail.com",
      "onovaeochuko@gmail.com",
      "jephthahimade@gmail.com",
    ];

    // Send individual emails to each admin
    const adminEmailPromises = adminEmails.map((adminEmail) =>
      transporter.sendMail({
        from: "Edo Youth Impact Forum 2025",
        to: adminEmail,
        subject: `New Grant Application: ${startupName} - ${categoryName}`,
        html: grantRegistrationTemplate,
      })
    );

    // Wait for all admin emails to be sent
    const adminReports = await Promise.all(adminEmailPromises);

    console.log("Grant application confirmation email sent:", info.messageId);
    adminReports.forEach((report, index) => {
      console.log(
        `Grant application notification email sent to ${adminEmails[index]}:`,
        report.messageId
      );
    });

    res.status(200).send({
      message: "Grant application submitted successfully",
      status: 200,
    });
  } catch (error) {
    console.error("Error sending grant application email:", error);
    res.status(500).send({
      message: "Error submitting grant application",
      status: 500,
      error: error.message,
    });
  }
});

// Seat Reservation Route
app.post("/reserve-seat", async (req, res) => {
  const { firstName, lastName, email, phone } = req.body;
  const fullName = `${firstName} ${lastName}`;

  // Save to DB
  try {
    await SeatReservation.create({ firstName, lastName, email, phone });
  } catch (dbError) {
    console.error("Error saving seat reservation to DB:", dbError);
    return res.status(500).send({
      message: "Error saving seat reservation",
      status: 500,
      error: dbError.message,
    });
  }

  const seatRecipientTemplate = `
    <!DOCTYPE html>
    <html lang=\"en\">
    <head>
      <meta charset=\"UTF-8\">
      <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">
      <title>Seat Reservation Confirmed</title>
      <style>
        body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background-color: #4E31AA; padding: 20px; text-align: center; color: white; }
        .content { padding: 20px 30px; line-height: 1.6; }
        .footer { background-color: #f4f4f4; text-align: center; padding: 15px; font-size: 14px; color: #666; }
        .btn { display: inline-block; background-color: #4E31AA; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class=\"container\">
        <div class=\"header\">
          <img src=\"https://edoyouthimpactforum.com/images/logo-2.png\" alt=\"EYIF Logo\" style=\"max-width: 150px;\">
          <h1>Seat Reserved!</h1>
        </div>
        <div class=\"content\">
          <p>Dear <strong>${fullName}</strong>,</p>
          <p>Your seat for the Edo Youth Impact Forum (EYIF) 2025 event has been successfully reserved.</p>
          <p>We look forward to seeing you at the event!</p>
          <p><strong>Reservation Details:</strong></p>
          <ul>
            <li><strong>Name:</strong> ${fullName}</li>
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Phone:</strong> ${phone}</li>
          </ul>
          <div style=\"text-align: center; margin-top: 20px;\">
            <a href=\"${process.env.WEBSITE_URL}\" class=\"btn\">Visit Our Website</a>
          </div>
        </div>
        <div class=\"footer\">
          <p>&copy; 2025 Edo Youth Impact Forum (EYIF). All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const seatAdminTemplate = `
    <!DOCTYPE html>
    <html lang=\"en\">
    <head>
      <meta charset=\"UTF-8\">
      <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">
      <title>New Seat Reservation</title>
      <style>
        body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4E31AA; padding: 20px; text-align: center; color: white; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .footer { background-color: #4E31AA; padding: 15px; text-align: center; color: white; font-size: 14px; }
        .info-item { margin-bottom: 10px; }
        .info-label { font-weight: bold; }
      </style>
    </head>
    <body>
      <div class=\"container\">
        <div class=\"header\">
          <img src=\"https://edoyouthimpactforum.com/images/logo-2.png\" alt=\"EYIF Logo\" style=\"max-width: 150px;\">
          <h1>New Seat Reservation</h1>
        </div>
        <div class=\"content\">
          <div class=\"info-item\"><span class=\"info-label\">Name:</span> ${fullName}</div>
          <div class=\"info-item\"><span class=\"info-label\">Email:</span> ${email}</div>
          <div class=\"info-item\"><span class=\"info-label\">Phone:</span> ${phone}</div>
          <div class=\"info-item\"><span class=\"info-label\">Reservation Date:</span> ${new Date().toLocaleString()}</div>
        </div>
        <div class=\"footer\">
          <p>&copy; 2025 Edo Youth Impact Forum (EYIF). All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    // Send confirmation email to the user
    const info = await transporter.sendMail({
      from: "Edo Youth Impact Forum 2025",
      to: email,
      subject: "Your Seat Reservation for EYIF 2025 is Confirmed",
      html: seatRecipientTemplate,
    });

    // Send notification emails to admins (same as grant-registration)
    const adminEmails = [
      "iguodalaefosa@gmail.com",
      "ebuka0064@gmail.com",
      "onovaeochuko@gmail.com",
      "jephthahimade@gmail.com",
    ];

    // Send individual emails to each admin
    const adminEmailPromises = adminEmails.map((adminEmail) =>
      transporter.sendMail({
        from: "Edo Youth Impact Forum 2025",
        to: adminEmail,
        subject: `New Seat Reservation: ${fullName}`,
        html: seatAdminTemplate,
      })
    );

    // Wait for all admin emails to be sent
    const adminReports = await Promise.all(adminEmailPromises);

    console.log("Seat reservation confirmation email sent:", info.messageId);
    adminReports.forEach((report, index) => {
      console.log(
        `Seat reservation notification email sent to ${adminEmails[index]}:`,
        report.messageId
      );
    });
    res
      .status(200)
      .send({ message: "Seat reserved successfully", status: 200 });
  } catch (error) {
    console.error("Error sending seat reservation email:", error);
    res.status(500).send({
      message: "Error submitting seat reservation",
      status: 500,
      error: error.message,
    });
  }
});

// Root Route
app.get("/", (req, res) => {
  res.send("EYIF 2025 API is running");
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  const errorStatus = err.status || 500;
  const errorMessage = err.message || "Something went wrong!";
  res.status(errorStatus).json({
    success: false,
    status: errorStatus,
    message: errorMessage,
    stack: err.stack,
  });
});

// Start Server
const PORT = process.env.PORT || 4500;
app.listen(PORT, () => {
  console.log(`Server Running on PORT ${PORT}`);
});
