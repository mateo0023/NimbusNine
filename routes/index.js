const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require('../config/auth');
const mongoose = require("mongoose");

const { db } = require("../config/mongodb")

// Home page
router.get("/", (req, res) => {
  res.render("home");
});


// Dashboard view
router.get('/dashboard', ensureAuthenticated, (req, res) => {
  db.collection("treenodes").find({ owner: req.user._id, name: '~' })
    .sort({ isFolder: 1, name: 1, _id: 1 })
    .toArray((err, items) => {
      if (err) {
        res.json({
          "error": err,
        });
      }

      if (!items || items.length === 0) {
        res.render('dashboard/dashboard', {
          items: false,
          userName: req.user.userName,
        });
      } else {
        res.render('dashboard/dashboard', {
          items: items,
          userName: req.user.userName,
        });
      }
      
    })
})

module.exports = router;
