const mongoose = require('mongoose');

const TreeNodeSchema = new mongoose.Schema({
    isFolder: {
        type: Boolean,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    owner: {
        type: String,
        required: true,
    },
    access: {
        type: Array,
        required: true,
        default: [],
    },
    date: {
        type: Date,
        required: true,
        default: Date.now(),
    },
    parent: {
        type: String,
        required: false,
    },
    children: {
        type: Array,
        required: false,
    },
    fileId: {
        type: String,
        required: false,
    },
    size: {
        type: Number,
        required: false,
    }
});

const TreeNode = mongoose.model('TreeNode', TreeNodeSchema);
module.exports = TreeNode;