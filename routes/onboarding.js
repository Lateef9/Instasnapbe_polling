import express from 'express';
import Client from '../models/Client.js';

const router = express.Router();

/**
 * @route   POST /api/onboard-client
 * @desc    Onboard a new photobooth client
 * @access  Public (for setup purposes)
 */
router.post('/', async (req, res) => {
    try {
        const {
            clientId,
            authKey,
            name,
            location,
            isActive,
            isSplitPaymentEnabled,
            splitPercentage,
            razorpayLinkedAccountId
        } = req.body;

        // Basic validation
        if (!clientId || !authKey || !name || !location) {
            return res.status(400).json({ error: "Missing required fields: clientId, authKey, name, location." });
        }

        // Check if a client with the same clientId or authKey already exists
        const existingClient = await Client.findOne({ $or: [{ clientId }, { authKey }] });

        if (existingClient) {
            if (existingClient.clientId === clientId) {
                return res.status(409).json({ error: `A client with ID '${clientId}' already exists.` });
            }
            if (existingClient.authKey === authKey) {
                return res.status(409).json({ error: `A client with the auth key already exists.` });
            }
        }

        // Create a new client instance
        const newClient = new Client({
            clientId,
            authKey,
            name,
            location,
            isActive: isActive !== undefined ? isActive : true,
            isSplitPaymentEnabled,
            splitPercentage,
            razorpayLinkedAccountId
        });

        // Save the new client to the database
        const createdClient = await newClient.save();

        res.status(201).json({
            message: "Client onboarded successfully.",
            client: createdClient
        });

    } catch (error) {
        console.error("Error onboarding client:", error);
        // Provide more detailed error information in the response for debugging
        res.status(500).json({
            error: "An unexpected error occurred during onboarding.",
            details: error.message
        });
    }
});

export default router;
