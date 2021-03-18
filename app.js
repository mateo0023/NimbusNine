const express = require('express');
const app = express();

app.get('*', (req, res) => {
    res.send('404');
});

app.get('/', (req, res) => {
    res.send('Nimbus Nine');
});

app.listen(3000, () => {
    console.log('Server is up and running');
})