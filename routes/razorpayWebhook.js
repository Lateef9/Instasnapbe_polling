// routes/razorpayWebhook.js
import express from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import PhotoSession from '../models/PhotoSessionSchema.js'; // Import the model
import Client from '../models/Client.js'; // Import the Client model

const router = express.Router();

const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    
    const isValid = validateWebhookSignature(req.body, signature, WEBHOOK_SECRET);

    if (!isValid) {
      console.warn('❌ Invalid webhook signature');
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    const body = JSON.parse(req.body.toString());
    const event = body.event;
    const payload = body.payload;

    console.log('🔔 Webhook received:', event);

    const allowedClients = ['client1', 'client2','InstaSnap_Kiosk','client4']; 
    const paymentClientId = payload.payment?.entity?.notes?.clientId;

    if (event === 'payment.captured' && paymentClientId && !allowedClients.includes(paymentClientId)) {
      console.log(`Ignoring webhook for client '${paymentClientId}' as it's not handled by this instance.`);
      return res.status(200).json({ success: true, message: 'Webhook ignored for other client' });
    }

    switch (event) {
      case 'payment.captured': {
        const payment = payload.payment.entity;
        const sessionId = payment.notes?.sessionId;

        if (!sessionId) {
          console.warn(`Webhook for payment ${payment.id} received, but no sessionId found in notes.`);
          return res.status(400).json({ success: false, message: 'Session ID not found in payment notes' });
        }
        
        const session = await PhotoSession.findOne({ sessionId: sessionId });

        if (!session) {
          console.warn(`Webhook for payment ${payment.id} received, but no session found for sessionId ${sessionId}.`);
          return res.status(404).json({ success: false, message: 'Session not found for Session ID' });
        }
        
        if (session.paymentStatus === 'paid') {
          console.log(`Payment for session ${sessionId} already processed. Ignoring event.`);
          return res.status(200).json({ success: true, message: 'Already processed' });
        }
        
        session.paymentStatus = 'paid';
        await session.save();
        console.log(`✅ Session ${session.sessionId} marked as paid from payment.captured event.`);

        res.status(200).json({ success: true, message: 'Webhook acknowledged. Processing transfer in background.' });
        
        handlePaymentSplittingInBackground(session, payment);
        
        return;
      }
      case 'qr_code.closed': {
        const qrId = payload.qr_code.entity.id;
        const closeReason = payload.qr_code.entity.close_reason;

        // Find the session associated with this QR code
        const session = await PhotoSession.findOne({ qrcodeId: qrId });

        if (!session) {
          console.warn(`Webhook for qr_id ${qrId} received, but no session found.`);
          return res.status(404).json({ success: false, message: 'Session not found for QR ID' });
        }

        if (session.paymentStatus === 'paid') {
          console.log(`Payment for session ${session.sessionId} already processed. Ignoring qr_code.closed event.`);
          return res.status(200).json({ success: true, message: 'Already processed' });
        }
        
        let eventStatus = null;
        if (closeReason === 'paid') {
          eventStatus = 'paid';
          session.paymentStatus = 'paid';
          await session.save();
          console.log(`✅ Session ${session.sessionId} marked as paid.`);
        } else if (closeReason === 'on_demand') {
          eventStatus = 'on_demand';
          console.log(`📸 QR Code closed on-demand for session ${session.sessionId}.`);
        }

        // Acknowledge the webhook
        return res.status(200).json({ success: true, message: 'Webhook processed' });
      }
      default:
        console.log('Unhandled webhook event:', event);
        return res.status(200).json({ success: true, message: 'Webhook processed' });
    }
  } catch (err) {
    console.error('Webhook error:', err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Internal error' });
    }
  }
});

async function handlePaymentSplittingInBackground(session, payment) {
  try {
    const client = await Client.findOne({ clientId: session.clientId });

    if (client && client.isSplitPaymentEnabled && client.razorpayLinkedAccountId && client.splitPercentage > 0) {
      console.log(`Background: Splitting payment for client: ${client.clientId}`);

      const transferAmount = Math.floor((payment.amount * client.splitPercentage) / 100);

      if (transferAmount > 0) {
        try {
          const transfer = await razorpay.transfers.create({
            account: client.razorpayLinkedAccountId,
            amount: transferAmount,
            currency: 'INR',
          });

          console.log(`Background: ✅ Transfer created: ${transfer.id} for amount ${transferAmount}`);
          session.transferId = transfer.id;
          session.transferAmount = transfer.amount;
          session.transferStatus = 'created';
          session.razorpayLinkedAccountId = client.razorpayLinkedAccountId;

        } catch (error) {
          console.error(`Background: ❌ Transfer failed for session ${session.sessionId}:`, error.error?.description || error.message);
          session.transferStatus = 'failed';
        }
      } else {
        console.warn(`Background: Transfer amount for session ${session.sessionId} is zero. Skipping transfer.`);
      }
    } else {
      console.log(`Background: Payment splitting not enabled for client: ${session.clientId}`);
    }
    
    await session.save();
    console.log(`Background: ✅ Session details updated for ${session.sessionId}.`);
  } catch (error) {
    console.error(`Background: ❌ Error during payment splitting for session ${session.sessionId}:`, error);
  }
}

function validateWebhookSignature(body, signature, secret) {
  if (!signature || !secret || body === undefined) return false;
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return expected === signature;
}

export default router; 