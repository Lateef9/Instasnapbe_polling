import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import bodyParser from 'body-parser';
import connectDB from './config/db.js';

import { authenticateClient } from './middleware/auth.js';

import indexRoutes from './routes/index.js';
import createSessionRoute from './routes/createSession.js';
import createUpiQrRoute from './routes/createUpiQr.js';
import checkPaymentRoute from './routes/checkPayment.js';
import getPhotoColorRoute from './routes/getPhotoColor.js';
import updatePrintJobRoute from './routes/updatePrintJob.js';
import onboardingRoute from './routes/onboarding.js';
import razorpayWebhookRoute from './routes/razorpayWebhook.js';
import closeQrRouter from './routes/closeQr.js';

const app = express();
const httpServer = createServer(app);

// IMPORTANT: Define the webhook route BEFORE the global body-parser
// This is to ensure we get the raw request body for signature validation
app.use('/api', razorpayWebhookRoute);

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// Connect to MongoDB
connectDB();

// Routes
app.use('/', indexRoutes);
app.use('/api/onboard-client', onboardingRoute);
app.use('/api', authenticateClient, createSessionRoute);
app.use('/api', authenticateClient, createUpiQrRoute);
app.use('/api', authenticateClient, checkPaymentRoute);
app.use('/api', authenticateClient, getPhotoColorRoute);
app.use('/api', authenticateClient, updatePrintJobRoute);
app.use('/api', authenticateClient, closeQrRouter);


// Start the server for local development
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

export default app;
