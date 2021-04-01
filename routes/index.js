const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require('../config/auth');

// Home page
router.get("/", (req, res) => {
  res.render("home");
});

// Dashboard view
router.get('/dashboard', ensureAuthenticated, (req, res) => {
  res.render('dashboard/dashboard', {
    userName: req.user.userName,
  });
})

module.exports = router;
