const express = require('express');
const app = express();

// Setting view engine to ejs
app.set('view engine', 'ejs');

// Allowing for access to the stylesheet
app.use(express.static(__dirname + "/public"));

app.get('/', (req, res) => {
    res.render('home');
});

app.listen(3000, () => {
    console.log('Server is up and running');
})