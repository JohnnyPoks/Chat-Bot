const Chat = require("../models/chat_model");

exports.createChat = async (req, res) => {
  const { title, messages } = req.body;

  if (!title || !messages) {
    return res.status(400).json({ error: "Title and messages are required" });
  }

  try {
    const chat = await Chat.create({ title, messages });
    res.status(201).json(chat);
  } catch (error) {
    console.error("Error creating chat:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getAllChats = async (req, res) => {
  try {
    const chats = await Chat.findAll();
    res.status(200).json(chats);
  } catch (error) {
    console.error("Error retrieving chats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.updateChat = async (req, res) => {
  const { id } = req.params;
  const { title, messages } = req.body;

  if (!title || !messages) {
    return res.status(400).json({ error: "Title and messages are required" });
  }

  try {
    const chat = await Chat.findByPk(id);
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    chat.title = title;
    chat.messages = messages;
    await chat.save();

    res.status(200).json(chat);
  } catch (error) {
    console.error("Error updating chat:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
