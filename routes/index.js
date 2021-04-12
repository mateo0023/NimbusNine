const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require('../config/auth');
const mongoose = require("mongoose");
<<<<<<< HEAD

mongoose.connect(require("../config/keys").MongoURI,
  { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  console
});
=======
const { MongoURI } = require("../config/keys");
>>>>>>> 3381799af6a4efb52c67a90e56282d8005168048

const connection = mongoose
        .createConnection(MongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
    const db = connection.db;
// Home page
router.get("/", (req, res) => {
  res.render("home");
});


// Dashboard view
router.get('/dashboard', ensureAuthenticated, (req, res) => {
  db.collection("treenodes").find({ owner: req.user._id, name: '~' })
    .sort({ isFolder: 1, name: 1, _id: 1 })
    .toArray((err, items) => {
      if (err) res.send(err);

      if (!items || items.length === 0) {
        res.render('dashboard/dashboard', {
          items: false,
          userName: req.user.userName,
        });
      }

      res.render('dashboard/dashboard', {
        items: items,
        userName: req.user.userName,
      });
    })
})

module.exports = router;
