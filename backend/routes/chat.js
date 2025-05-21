const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');

// Create a new chat session
router.post('/', async (req, res) => {
  try {
    const chat = new Chat({
      userId: req.body.userId,
      messages: [{
        role: 'assistant',
        content: 'Namaste! How can I help you today?'
      }]
    });
    await chat.save();
    res.status(201).json(chat);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Add message to chat
router.post('/:id/messages', async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    if (!chat) {
      return res.status(404).json({ message: 'Chat session not found' });
    }

    chat.messages.push({
      role: req.body.role,
      content: req.body.content
    });

    await chat.save();
    res.json(chat);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get chat history
router.get('/:id', async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id)
      .populate('userId', 'name age gender');
    if (!chat) {
      return res.status(404).json({ message: 'Chat session not found' });
    }
    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// End chat session
router.put('/:id/end', async (req, res) => {
  try {
    const chat = await Chat.findByIdAndUpdate(
      req.params.id,
      { sessionEnd: Date.now() },
      { new: true }
    );
    if (!chat) {
      return res.status(404).json({ message: 'Chat session not found' });
    }
    res.json(chat);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router; 