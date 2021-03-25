const express = require('express');
const app = express();

// Setting view engine to ejs
app.set('view engine', 'ejs');

// Allowing for access to the stylesheet
app.use(express.static(__dirname + "/public"));

app.get('/', (req, res) => {
    res.render('home');
});

app.get('/login', (req, res) => {
    res.render('login/login');
})

app.get('/signup', (req, res) => {
    res.render('signup/signup');
})

app.listen(3000, () => {
    console.log('Server is up and running');
})