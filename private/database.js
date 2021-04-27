const { ensureAuthenticated } = require('../config/auth');
const mongoose = require("mongoose");
const crypto = require("crypto");
const path = require("path");
const multer = require("multer");
const GridFsStorage = require("multer-gridfs-storage");
const Grid = require('gridfs-stream');

// To deal with deprecation warning from findByIdAndDelete()
mongoose.set('useFindAndModify', false);

const { MongoURI } = require("../config/keys");

mongoose.connect(MongoURI,
    { useNewUrlParser: true, useUnifiedTopology: true, dbName: "users" })
    .catch((err) => console.log(err));

const db = mongoose.connection;
var gfs;
db.once('open', () => {
    console.log("Connected to MongoDB");

    gfs = Grid(db.db, mongoose.mongo);
    gfs.collection('uploads');
});

const TreeNode = require("../models/FileSys");

// Storage Engine
const storage = new GridFsStorage({
    db: db,
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
    TreeNode.findOne({ _id: elemId }, (err, elem) => {
        if (!err) {
            // Remove from parent
            TreeNode.update({ _id: elem.parent }, { $pull: { children: elem._id } });

            if (elem.isFolder) {
                // For each element in the folder, remove from the database
                idsToRemove = elem.children;
                if (idsToRemove !== null ||
                    idsToRemove.length !== 0) {

                    idsToRemove.forEach(element => {
                        removeItem(element._id);
                    });
                }
            } else {
                // Remove the file
                gfs.remove({ _id: elem.fileId, root: 'uploads' });
                // Remove the node
                TreeNode.findByIdAndDelete(elem._id);
            }
        }
    });
}

module.exports = {
    // Upload files to the database and add them to the tree
    uploadFiles: (req, res, next) => {
        // Ensure Authentication
        if (!req.isAuthenticated()) {
            req.flash('errorMsg', 'Please login to view this page')
            res.redirect('/users/login');
        } else {
            // This is a bit sketchy
            // passing what I wan to do after as the argument
            upload.array('file')(req, res, () => {
                const userId = req.user._id;
                const folderId = req.params.folderId;
                // Store all the Document promises
                const promises = []

                // For each of the uploaded files add them on the tree 
                req.files.forEach(file => {
                    // Create the corresponding node
                    const newNode = new TreeNode({
                        isFolder: false,
                        owner: userId,
                        name: file.originalname,
                        fileId: file.id,
                        parent: folderId,
                        size: file.size,
                        date: file.uploadDate,
                    });
                    promises.push(newNode.save());

                    promises.push(
                        // Append the new file to the directory
                        TreeNode.update(
                            { _id: folderId },
                            { $addToSet: { children: newNode._id } }
                        ).exec()
                    )

                })

                // Wait till all operations executed
                Promise.all(promises).then(() => {
                    next()
                });
            });
        }
    },

    // Create a new folder
    createFolder: (req, res, next) => {
        // Ensure Authentication
        if (!req.isAuthenticated()) {
            req.flash('errorMsg', 'Please login to view this page')
            res.redirect('/users/login');
        } else {

            const userId = req.user._id;
            const { name } = req.body;
            const parentId = req.params.parentId;


            // // Should check for priviliges here
            // TreeNode.findOne(
            //     {
            //         _id: parentId,
            //         $or: [{ owner: userId }, { access: { $all: [userId] } }]
            //     },
            //     (err, result) => {
            //         console.log(result)
            //     })

            const newFolder = new TreeNode({
                isFolder: true,
                owner: userId,
                name: name,
                parent: parentId,
                date: Date.now(),
            });

            newFolder.save().then(
                () => {
                    // Add the new child to its parent
                    TreeNode.findOneAndUpdate(
                        { _id: parentId },
                        { $addToSet: { children: newFolder._id } }
                    ).exec(
                        () => {
                            req.newFolder = newFolder._id;
                            next()
                        }
                    )
                }
            )
        }
    },

    deleteItem: (req, res, next) => {
        removeItem(req.params.itemId);
        next();
    },

    // When in root folder call this to get contents
    getItemsInRoot: (req, res, next) => {
        // Ensure Authentication
        if (!req.isAuthenticated()) {
            req.flash('errorMsg', 'Please login to view this page')
            res.redirect('/users/login');
        } else {
            // Find the items in the root directory
            TreeNode.findOne(
                { "owner": req.user._id, "name": '~' },
                (err, root) => {
                    if (root.children.length === 0) {
                        // No items in the root folder
                        req.folderId = root._id;
                        req.items = false;
                    } else {
                        TreeNode.find(
                            // Find items that have folderId parent
                            { owner: req.user._id, parent: root._id })
                            // Make search case insensitive
                            .collation({ locale: "en" })
                            // First folders, then alphabetical and use ID as tie breaker
                            .sort({ isFolder: -1, name: 1, _id: 1 })
                            // Set the variables once done
                            .exec((err, items) => {
                                if (err) {
                                    // There was an error sorting the children
                                    res.err = err;
                                } else {
                                    // Set the children
                                    req.folderId = root._id;
                                    req.items = items;
                                }
                                next();
                            })
                    }
                });
        }
    },

    // Set an array in req called items for the EJS to process
    getItemsInFolder: (req, res, next) => {
        // Ensure Authentication
        if (!req.isAuthenticated()) {
            req.flash('errorMsg', 'Please login to view this page')
            res.redirect('/users/login');
        } else {
            // Look for the parent folder (by ID)
            TreeNode.findOne({ _id: req.params.folderId }, (err, result) => {
                if (err) return res.status(400).send(err);
                if (!result.isFolder) {
                    // Redirect if it's a file
                    res.redirect(`/view/${result.parent}/${result._id}`)
                } else if (result.name === "~") {
                    // Redirect if it's the root directory
                    res.redirect("/dashboard");
                } else {
                    TreeNode.find(
                        // Find items that have folderId parent
                        { owner: req.user._id, parent: req.params.folderId })
                        // Make search case insensitive
                        .collation({ locale: "en" })
                        // First folders, then alphabetical and use ID as tie breaker
                        .sort({ isFolder: -1, name: 1, _id: 1 })
                        // Set the variables once done
                        .exec((err, items) => {
                            TreeNode.findById(req.params.folderId,
                                (err, parentFolder) => {

                                    if (err) {
                                        req.flash('errorMsg', 'File not found')
                                        res.redirect('/dashboard');
                                    }

                                    if (!items || items.length === 0) {
                                        req.items = false;
                                        req.parentName = parentFolder.name;
                                        req.folderId = parentFolder.parent;
                                    } else {
                                        req.items = items;
                                        req.parentName = parentFolder.name;
                                        req.folderId = parentFolder.parent;
                                    }
                                    next();
                                }
                            )
                        })
                }
            });
        }
    },

    downloadFile: (req, res, next) => {
        TreeNode.findOne(
            { parent: req.params.folderId, _id: req.params.fileId },
            (err, node) => {
                if (err) return res.status(400).send(err);
                // Will want to change this so that it actually downloads the file

                res.set('Content-Type', node.contentType);
                res.set('Content-Disposition', `attachment; filename="${node.name}"`);

                const readstream = gfs.createReadStream({ _id: node.fileId });
                readstream.on("error", function (err) {
                    res.end();
                });
                readstream.pipe(res);
            }
        )
    }
}