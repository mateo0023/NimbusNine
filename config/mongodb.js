const mongoose = require("mongoose");
const Grid = require('gridfs-stream');

const { MongoURI } = require("./keys");

mongoose.connect(MongoURI,
    { useNewUrlParser: true, useUnifiedTopology: true })
    .catch((err) => console.log(err));

const db = mongoose.connection;
let gfs;
db.once('open', () => {
    console.log("Connected to MongoDB");

    gfs = Grid(db, mongoose.mongo);
    gfs.collection('uploads');
});

module.exports = {MongoURI: MongoURI, db: db, gfs: gfs};