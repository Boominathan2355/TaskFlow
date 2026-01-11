const express = require("express");
const {
    allMessages,
    sendMessage,
} = require("../controllers/messageController");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.route("/:chatId").get(authenticate, allMessages);
router.route("/").post(authenticate, sendMessage);

module.exports = router;
