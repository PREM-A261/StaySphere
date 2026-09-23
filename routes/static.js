const express = require("express");
const router = express.Router();

// Privacy Policy
router.get("/privacy", (req, res) => {
  res.render("listings/privacy");
});

// Terms of Service
router.get("/terms", (req, res) => {
  res.render("listings/terms");
});

module.exports = router;
