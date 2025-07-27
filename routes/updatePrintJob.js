import express from 'express';
import PhotoSession from '../models/PhotoSessionSchema.js';

const router = express.Router();

router.post('/update-print-job', async (req, res) => {
    console.log('Received request to /update-print-job');
    console.log('Request body:', req.body);

    try {
        const { sessionId, printerJobId, printerJobStatus } = req.body;
  
        if (!sessionId || !printerJobId || !printerJobStatus) {
            console.error('Validation Error: Missing required fields in request body.');
            return res.status(400).json({ error: "Missing required fields" });
        }
  
        console.log(`Attempting to update session ${sessionId} with job ID ${printerJobId} to status ${printerJobStatus}`);
        const updatedSession = await PhotoSession.findOneAndUpdate(
            { sessionId, clientId: req.client.clientId },
            { printerJobId, printerJobStatus },
            { new: true }
        );
  
        if (!updatedSession) {
            console.error(`Session not found for sessionId: ${sessionId} and clientId: ${req.client.clientId}`);
            return res.status(404).json({ error: "Session not found" });
        }
  
        console.log(`Successfully updated session ${sessionId}. New status: ${updatedSession.printerJobStatus}`);
        res.json({ message: "Print job updated", sessionId, printerJobStatus });
    } catch (error) {
        console.error("Error updating print job in database:", error);
        res.status(500).json({ error: "Error updating print job" });
    }
  });

  export default router; 