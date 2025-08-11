import express from 'express';
import PhotoSession from '../models/PhotoSessionSchema.js';

const router = express.Router();

router.post('/check-payment', async (req, res) => {
    try {
        const { sessionId } = req.body;
        console.log(req.body);
        if (!sessionId) {
            return res.status(400).json({ error: "Session ID is required" });
        }

        // Find the session in the database for the authenticated client
        const session = await PhotoSession.findOne({ sessionId, clientId: req.client.clientId });

        if (!session) {
          console.log(`No session found: ${sessionId}, client: ${req.client.clientId}`);
          return res.status(404).json({ error: "Session not found" });
        }

        // Simply return the status from the database record. 
        // The webhook is responsible for updating this status.
        console.log(`[${sessionId}] -  Polling session & status: ${session.paymentStatus}`);
        return res.json({ status: session.paymentStatus });
  
    } catch (error) {
      console.error("Payment Check Error:", error.message);
      console.error("Stack Trace:", error.stack);
      res.status(500).json({ error: "Error checking payment status" });
    }
  });

  export default router; 