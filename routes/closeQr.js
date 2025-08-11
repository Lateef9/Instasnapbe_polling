import express from 'express';
import Razorpay from 'razorpay';
import PhotoSession from '../models/PhotoSessionSchema.js';

const router = express.Router();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

router.post('/close-qr', async (req, res) => {
    try {
        const { qrcodeId, reason } = req.body;
        if (!qrcodeId) {
            return res.status(400).json({ error: 'QR Code ID is required' });
        }

        // Keep the validation you asked for
        const validReasons = ['user_cancelled', 'expired'];
        if (!reason || !validReasons.includes(reason)) {
            return res.status(400).json({ error: "A valid reason ('user_cancelled' or 'expired') is required." });
        }

        // --- Step 1: Close QR on Razorpay (using your reference logic) ---
        const qrCode = await razorpay.qrCode.fetch(qrcodeId);

        if (qrCode.status === 'closed') {
            console.log(`Razorpay QR code ${qrcodeId} was already closed.`);
        } else {
            await razorpay.qrCode.close(qrcodeId);
            console.log(`Successfully closed Razorpay QR code ${qrcodeId}.`);
        }

        // --- Step 2: Update our internal database ---
        const session = await PhotoSession.findOne({ qrcodeId: qrcodeId });
        if (session) {
            if (session.paymentStatus === 'pending') {
                session.paymentStatus = reason;
                await session.save();
                console.log(`[${session.sessionId}] - Database status updated to: ${reason}`);
            } else {
                console.log(`[${session.sessionId}] - Session status was already '${session.paymentStatus}'. No database update needed.`);
            }
        } else {
             console.warn(`Could not find a session for QR ID ${qrcodeId} to update its status.`);
        }

        res.status(200).json({ message: 'QR Code closed and session status updated successfully.' });

    } catch (error) {
        console.error("? Razorpay Error closing QR:", error);
        res.status(500).json({ error: error.error?.description || "Error closing Razorpay QR Code" });
    }
});

export default router; 