const express = require("express");
const router = express.Router();
const chatController = require("../Controllers/chat_controller");

// Create a new chat
router.post("/", chatController.createChat);

// Get all chats
router.get("/", chatController.getAllChats);

// Update a chat by ID
router.put("/:id", chatController.updateChat);

module.exports = router;
