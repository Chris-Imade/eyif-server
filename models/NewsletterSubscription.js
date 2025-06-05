const mongoose = require("mongoose");

const NewsletterSubscriptionSchema = new mongoose.Schema({
  email: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model(
  "NewsletterSubscription",
  NewsletterSubscriptionSchema
);
