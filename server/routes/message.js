const express = require("express");
const {
    allMessages,
    sendMessage,
    uploadFile,
} = require("../controllers/messageController");
const { authenticate } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

router.route("/:chatId").get(authenticate, allMessages);
router.route("/").post(authenticate, sendMessage);
router.route("/upload").post(authenticate, upload.single('file'), uploadFile);

module.exports = router;
