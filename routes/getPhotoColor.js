import express from 'express';
import PhotoSession from '../models/PhotoSessionSchema.js';

const router = express.Router();

router.get('/get-photo-color/:qrcodeId', async (req, res) => {
    try {
        const { qrcodeId } = req.params;

        const photoSession = await PhotoSession.findOne({ qrcodeId, clientId: req.client.clientId });
        
        if (!photoSession) {
            return res.status(404).json({ error: "Photo session not found" });
        }

        res.json({ 
            color: photoSession.photoColor,
            strips: photoSession.photoStripsCount,
            status: photoSession.paymentStatus
        });

    } catch (error) {
        console.error("Error fetching photo color:", error);
        res.status(500).json({ error: "Error fetching photo details" });
    }
});

export default router; 