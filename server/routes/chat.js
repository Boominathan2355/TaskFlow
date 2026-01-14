const express = require("express");
const {
    accessChat,
    fetchChats,
    createGroupChat,
    renameGroup,
    removeFromGroup,
    addToGroup,
    deleteChat,
    togglePinChat,
} = require("../controllers/chatController");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.route("/").post(authenticate, accessChat);
router.route("/").get(authenticate, fetchChats);
router.route("/group").post(authenticate, createGroupChat);
router.route("/rename").put(authenticate, renameGroup);
router.route("/groupremove").put(authenticate, removeFromGroup);
router.route("/groupadd").put(authenticate, addToGroup);
router.route("/:chatId").delete(authenticate, deleteChat);
router.route("/:chatId/pin").put(authenticate, togglePinChat);

module.exports = router;
