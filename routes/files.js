const { db } = require("../models/FileSys");

// Need to get a database and GridFsStorage
module.exports = function (options) {
    const express = require("express");
    const router = express.Router();
    const { ensureAuthenticated, checkCampgroundOwnership } = require('../config/auth');
    const mongoose = require("mongoose");
    const crypto = require("crypto");
    const path = require("path");
    const multer = require("multer");
    const GridFsStorage = require("multer-gridfs-storage");
    const Grid = require('gridfs-stream');

    const TreeNode = require("../models/FileSys");

    const { MongoURI } = options;
    const connection = mongoose
        .createConnection(MongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

    // Create GridFS-stream
    connection.open(function (err) {
        if (err) return handleError(err);

        var gfs = Grid(connection, mongoose.mongo);
        gfs.collection('uploads');
    });

    // Storage Engine
    const storage = new GridFsStorage({
        db: connection,
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

    function removeItem(elemId) {
        db.treenodes.findOne({ _id: elemId }, (err, elem) => {
            if (!err) {
                // Remove from parent
                db.treenodes.update({ _id: elem.parent }, { $pull: { children: elem._id } });

                if (elem.isFolder) {
                    idsToRemove = elem.children;
                    if (idsToRemove !== null ||
                        idsToRemove.length !== 0) {

                        idsToRemove.forEach(element => {
                            removeItem(element._id);
                        });
                    }
                } else {
                    gfs.remove({ _id: elem.fileId, root: 'uploads' });
                    db.treenodes.remove({ _id: elem._id });
                }
            }
        });
    }

    // Upload file to folderId
    router.post("/upload/:folderId", ensureAuthenticated, checkCampgroundOwnership,
        upload.single('file'),
        (req, res) => {
            const { originalname, id } = req.file;
            const userId = req.user._id;
            const folderId = req.params.folderId;
            const newNode = new TreeNode({
                isFolder: false,
                owner: userId,
                name: originalname,
                fileId: id,
                parent: folderId,
            });
            newNode.save();

            db.treenodes.update(
                { _id: folderId },
                { $addToSet: { children: newNode._id } }
            );
        });

    router.post("/newFolder/:parentId", ensureAuthenticated, checkCampgroundOwnership, (req, res) => {
        const userId = req.user._id;
        const { folderName } = req.body;
        const parentId = req.params.parentId;

        const newFolder = new TreeNode({
            isFolder: true,
            owner: userId,
            name: folderName,
            parent: parentId,
        });
        newFolder.save();

        db.treenodes.update(
            { _id: parentId },
            { $addToSet: { children: newFolder._id } }
        );
    })

    router.delete("/remove/:itemId",
        ensureAuthenticated, checkCampgroundOwnership,
        (req, res) => {
            removeItem(req.params.itemId);
        });


    router.get("/:folderId/:fileId",
        ensureAuthenticated, checkCampgroundOwnership,
        (req, res) => {
            db.treenodes.findOne(
                { parent: req.params.folderId, _id: req.params.fileId },
                (err, node) => {
                    if(err) res.send(err);
                    
                    // Will want to change this so that it actually downloads the file
                    const readstream = gfs.createReadStream({ _id: node.fileId });
                    readstream.pipe(res);
                }
            )
        });

    router.get("/:folderId",
        ensureAuthenticated, checkCampgroundOwnership,
        (req, res) => {
            db.treenodes.find({ parent: req.params.folderId })
                .sort( { isFolder: 1, name: 1, _id: 1 } )
                .toArray( (err, items) => {
                    if(err) res.send(err);

                    if (!items || items.length === 0){
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
    return router
};
