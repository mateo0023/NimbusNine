// Need to get a database and GridFsStorage

const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require('../config/auth');
const mongoose = require("mongoose");
const crypto = require("crypto");
const path = require("path");
const multer = require("multer");
const GridFsStorage = require("multer-gridfs-storage");
const { db, gfs } = require("../config/mongodb");

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
router.post("/upload/:folderId",
    (a, b, n) => {
        console.log("Asking to upload a file");
        n();
    },
    ensureAuthenticated,
    upload.array('file'),
    (req, res) => {
        const userId = req.user._id;
        const folderId = req.params.folderId;
        req.files.forEach(file => {
            const newNode = new TreeNode({
                isFolder: false,
                owner: userId,
                name: file.originalname,
                fileId: file.id,
                parent: folderId,
            });
            newNode.save();

            TreeNode.update(
                { _id: folderId },
                { $addToSet: { children: newNode._id } }
            );
        })
        TreeNode.find(
            { owner: userId, parent: folderId })
            .collation({ locale: "en" })
            .sort({ isFolder: -1, name: 1, _id: 1 })
            .exec((err, items) => {
                if (err) {
                    res.json({
                        "error": err,
                    });
                } else {
                    res.render("partials/item_list", {
                        items: items,
                        userName: req.user.userName,
                        parent: req.params.folderId
                    });
                }
            })
    }
);

router.post("/newFolder/:parentId", ensureAuthenticated, (req, res) => {
    console.log("New folder")
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
    });
    newFolder.save();
    // Add the new child to its parent
    TreeNode.findOneAndUpdate(
        { _id: parentId },
        { $addToSet: { children: newFolder._id } }
    );
    res.redirect(`/${newFolder._id}`);
})

router.delete("/remove/:itemId",
    ensureAuthenticated,
    (req, res) => {
        removeItem(req.params.itemId);
    });


// router.get("/view/:folderId/:fileId",
//     ensureAuthenticated,
//     (req, res) => {
//         console.log(req.params.folderId, req.params.fileId)
//         TreeNode.findOne(
//             { parent: req.params.folderId, _id: req.params.fileId },
//             (err, node) => {
//                 if (err) res.send(err);
//                 console.log(node)
//                 // Will want to change this so that it actually downloads the file
//                 const readstream = gfs.createReadStream({ _id: node.fileId });
//                 readstream.pipe(res);
//             }
//         )
//     });

router.get("/view/:folderId",
    ensureAuthenticated,
    (req, res) => {
        TreeNode.findOne({ _id: req.params.folderId }, (err, result) => {
            if (!result.isFolder) {
                // Redirect if it's a file
                res.redirect(`/view/${result.parent}/${result._id}`)
            } else {
                TreeNode.find(
                    { owner: req.user._id, parent: req.params.folderId })
                    .collation({ locale: "en" })
                    .sort({ isFolder: -1, name: 1, _id: 1 })
                    .exec((err, items) => {
                        if (err) {
                            res.json({
                                "error": err,
                            });
                        }

                        if (!items || items.length === 0) {
                            res.render('dashboard/dashboard', {
                                items: false,
                                userName: req.user.userName,
                                parent: req.params.folderId,
                            });
                        } else {
                            res.render('dashboard/dashboard', {
                                items: items,
                                userName: req.user.userName,
                                parent: req.params.folderId
                            });
                        }
                    })
            }
        });
    })

module.exports = router;
