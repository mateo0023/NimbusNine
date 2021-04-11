const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require('../config/auth');
const mongoose = require("mongoose");
const crypto = require("crypto");
const path = require("path");
const multer = require("multer");
const GridFsStorage = require("multer-gridfs-storage");

const FileNode = require("../models/FileSys");


// Storage Engine
const storage = new GridFsStorage({
    url: require("./config/keys").MongoURI,
    file: (req, file) => {

        return new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err, buf) => {
                if (err) {
                    return reject(err);
                }
                const filename = buf.toString('hex') + path.extname(file.originalname);
                const fileInfo = {
                    filename: filename,
                    bucketName: 'uploads'
                };
                resolve(fileInfo);
            });
        });
    }
});
const upload = multer({ storage });

router.post("/upload", [ensureAuthenticated,
    upload.single('file'),
    (req, res) => {
        const {originalname, id} = req.file;
        const {userName} = req.body;
        console.log(originalname, id, userName);
    }]);