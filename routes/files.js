const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require('../config/auth');
const { uploadFiles, createFolder, deleteItem, getItemsInFolder, downloadFile }
    = require("../private/database");

// Upload file to folderId
router.post("/upload/:folderId", ensureAuthenticated, uploadFiles, getItemsInFolder,
    (req, res) => {
        res.render("partials/item_list", {
            items: req.items,
            userName: req.user.userName,
            parent: req.folderId
        })
    }
);

router.post("/newFolder/:parentId", ensureAuthenticated, createFolder, (req, res) => {
    // Send back the ID of the new folder.
    res.send(req.newFolder);
})

router.delete("/remove/:itemId",
    ensureAuthenticated,
    deleteItem,
    (req, res) => {
        // Still need to see what to do.
    });


router.get("/view/:folderId/:fileId",
    ensureAuthenticated,
    downloadFile
);

router.get("/view/:folderId",
    ensureAuthenticated,
    getItemsInFolder,
    (req, res) => {
        res.render('dashboard/dashboard', {
            items: req.items,
            userName: req.user.userName,
            parent: req.params.folderId,
            parentName: req.parentName,
            parentId: req.folderId,
        });
    })

module.exports = router;
