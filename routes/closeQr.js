import express from 'express';
import Razorpay from 'razorpay';

const router = express.Router();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

router.post('/close-qr', async (req, res) => {
    try {
        const { qrcodeId } = req.body;
        if (!qrcodeId) {
            return res.status(400).json({ error: 'QR Code ID is required' });
        }

        const qrCode = await razorpay.qrCode.fetch(qrcodeId);

        if (qrCode.status === 'closed') {
            return res.status(200).json({ message: 'QR Code is already closed.' });
        }

        const closedQrCode = await razorpay.qrCode.close(qrcodeId);
        res.status(200).json({ message: 'QR Code closed successfully', data: closedQrCode });

    } catch (error) {
        console.error("? Razorpay Error closing QR:", error);
        res.status(500).json({ error: error.error?.description || "Error closing Razorpay QR Code" });
    }
});

export default router; 