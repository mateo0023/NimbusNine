const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const passport = require('passport');

//  User model
const user = require("../models/User");
const User = require("../models/User");

router.get("/login", (req, res) => {
  res.render("login");
});

router.get("/signup", (req, res) => {
  res.render("signup");
});

router.post("/signup", (req, res) => {
  const {
    firstName,
    lastName,
    email,
    userName,
    password,
    repeatPassword,
  } = req.body;

  let errors = [];

  // Check required fields
  if (
    !firstName ||
    !lastName ||
    !email ||
    !userName ||
    !password ||
    !repeatPassword
  ) {
    errors.push({ msg: "Please fill in all fields" });
  }

  // Check passwords match
  if (password !== repeatPassword) {
    errors.push({ msg: "Passwords do not match" });
  }

  // Check password length
  if (password.length < 6) {
    errors.push({ msg: "Password should be atleast 6 characters" });
  }

  if (errors.length > 0) {
    res.render("signup", {
      errors,
      firstName,
      lastName,
      email,
      userName,
      password,
      repeatPassword,
    });
  } else {
    User.findOne({ email: email }).then((user) => {
      if (user) {
        // User exists
        errors.push({ msg: "Email is already registered" });
        res.render("signup", {
          errors,
          firstName,
          lastName,
          email,
          userName,
          password,
          repeatPassword,
        });
      } else {
        const newUser = new User({
          firstName,
          lastName,
          email,
          userName,
          password,
        });

        // Hash password
        bcrypt.genSalt(10, (err, salt) =>
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;

            // Set password to hashed
            newUser.password = hash;

            // Save user
            newUser
              .save()
              .then((user) => {
                req.flash('successMsg', 'Success! Welcome to NimbusNine!');
                res.redirect('/users/login')
              })
              .catch((err) => {
                console.log(err);
              });
          })
        );
      }
    });
  }
});

// Login handler
router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/users/login',
    failureFlash: true,
  })(req, res, next);
});

// Logout handler
router.get('/logout', (req, res) => {
  req.logout();
  req.flash('successMsg', 'Cya next time!');
  res.redirect('/users/login');
});

module.exports = router;
