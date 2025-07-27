import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import PhotoSession from '../models/PhotoSessionSchema.js';

const router = express.Router();

router.post('/create-session', async (req, res) => {
    try {
      const sessionId = uuidv4();
      const photoSession = new PhotoSession({
        sessionId,
        clientId: req.client.clientId,
      });
      await photoSession.save();
      res.json({ sessionId });
    } catch (error) {
      console.error("Error creating session:", error);
      res.status(500).json({ error: "Error creating session" });
    }
  });

export default router;
