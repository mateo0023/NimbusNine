const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require('../config/auth');
const mongoose = require("mongoose");

const TreeNode = require("../models/FileSys");

// Home page
router.get("/", (req, res) => {
  res.render("home");
});


// Dashboard view
router.get('/dashboard', ensureAuthenticated, (req, res) => {
  let rootId;
  TreeNode.findOne(
    { "owner": req.user._id, "name": '~' },
    (err, root) => {
      rootId = root._id;
      if (root.children.length === 0) {
        res.render('dashboard/dashboard', {
          items: false,
          userName: req.user.userName,
          parent: rootId,
        });
      } else {
        TreeNode.find(
          { owner: req.user._id, parent: rootId })
          .collation({ locale: "en" })
          .sort({ isFolder: -1, name: 1, _id: 1 })
          .exec((err, items) => {
              if (err) {
                  res.json({
                      "error": err,
                  });
              } else {
                  res.render("dashboard/dashboard", {
                      items: items,
                      userName: req.user.userName,
                      parent: rootId
                  })
              }
          })
      }
    });

})

module.exports = router;
