const express = require("express");
const router = express.Router();
const { ensureAuthenticated, checkCampgroundOwnership } = require('../config/auth');
const mongoose = require("mongoose");
const crypto = require("crypto");
const path = require("path");
const multer = require("multer");
const GridFsStorage = require("multer-gridfs-storage");

const TreeNode = require("../models/FileSys");


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

router.post("/upload", ensureAuthenticated, checkCampgroundOwnership,
    upload.single('file'),
    (req, res) => {
        // This should work
        const { originalname, id } = req.file;
        const userId = req.user._id;
        const currentFolder; // IDK How to continue solving this
        TreeNode({
            isFolder: false,
            owner: userId,
            name: originalname,
            fileId: id,
            parent: TreeNode.findOne({owner: userId, name: currFolder})._id,
        })
    });

router.post("/newFolder", ensureAuthenticated, checkCampgroundOwnership, (req, res) => {
    const userId = req.user._id;
    const {folderName, currFolder} = req.body;
    
    const newFolder = new TreeNode({
        isFolder: true,
        owner: userId,
        name: folderName,
        // There needs to be a better way of finding the parent
        parent: TreeNode.findOne({owner: userId, name: currFolder})._id,
    });
})

module.exports = router;