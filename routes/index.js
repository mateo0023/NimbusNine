const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require('../config/auth');
const { getItemsInRoot } = require("../private/database")

// Home page
router.get("/", (req, res) => {
  res.render("home");
});


// Dashboard view
router.get('/dashboard', ensureAuthenticated, getItemsInRoot, (req, res) => {
    res.render("dashboard/dashboard", {
      items: req.items,
      userName: req.user.userName,
      parent: req.folderId,
  })
})

module.exports = router;
