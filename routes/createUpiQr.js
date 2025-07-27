import express from 'express';
import Razorpay from 'razorpay';
import PhotoSession from '../models/PhotoSessionSchema.js';

const router = express.Router();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

router.post('/create-upi-qr', async (req, res) => {
    try {
      const { sessionId, strips, color } = req.body;
      const { clientId } = req.client;
      const now = Math.floor(Date.now() / 1000);
      const minCloseBy = now + (3 * 60);
  
      const priceMaps = {
        client1: { 2: 250, 4: 350, 6: 400 },
        // client1: { 2: 3, 4: 4, 6: 5 }, testing prices
        InstaSnap_Kiosk: { 2: 199, 4: 249, 6: 299},
        default: { 2: 2, 4: 3, 6: 4 }
      };

      const priceMap = priceMaps[clientId] || priceMaps.default;
  
      if (!priceMap[strips]) return res.status(400).json({ error: 'Invalid selection' });
  
      const qrCode = await razorpay.qrCode.create({
        type: "upi_qr",
        usage: "single_use",
        fixed_amount: true,
        payment_amount: priceMap[strips] * 100,
        description: `Payment for ${strips} Strips`,
        close_by: minCloseBy,
        notes: {
          sessionId: sessionId,
          clientId: clientId,
        },
      });
  
      console.log(`Payment QR Created: ID=${qrCode.id} for session ${sessionId}`);

      await PhotoSession.findOneAndUpdate(
        { sessionId, clientId: req.client.clientId },
        {
          qrcodeId: qrCode.id,
          paymentAmount: priceMap[strips] * 100, // Store amount in paise
          photoColor: color,
          photoStripsCount: strips,
          paymentStatus: "pending"
        }
      );
  
      res.json({ qrCodeUrl: qrCode.image_url, qrcodeId: qrCode.id, sessionId });
    } catch (error) {
      console.error("? Razorpay Error:", error);
      res.status(500).json({ error: error.error?.description || "Error creating Razorpay UPI QR" });
    }
  });

  export default router;
