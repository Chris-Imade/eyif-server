const mongoose = require("mongoose");

const NewsletterSubscriptionSchema = new mongoose.Schema({
  email: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { collection: 'newslettersubscriptions_2026' });

module.exports = mongoose.model(
  "NewsletterSubscription",
  NewsletterSubscriptionSchema
);
