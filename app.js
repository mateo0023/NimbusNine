const express = require("express");
const app = express();
const indexRoutes = require("./routes/index");
const userRoutes = require("./routes/users");
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');

// Passport config
require('./config/passport')(passport);

// Setting view engine to ejs
app.set("view engine", "ejs");

// Allowing for access to the stylesheet
app.use(express.static(__dirname + "/public"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Express session
app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

// Global vars
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.successMsg = req.flash('successMsg');
  res.locals.errorMsg = req.flash('errorMsg');
  res.locals.loginError = req.flash('error');
  next();
});


// Routes
app.use("/", indexRoutes);
app.use("/users", userRoutes);

// File Upload-Download operations
app.use("/", require('./routes/files'));

app.listen(3000, () => {
  console.log("Server is up and running");
});
