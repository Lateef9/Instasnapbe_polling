import mongoose from 'mongoose';

const PhotoSessionSchema = new mongoose.Schema({
    clientId: {
        type: String,
        required: true
    },
    sessionId: {
        type: String,
        required: true,
        unique: true
    },
    qrcodeId: {
        type: String,
        required: false
    },
    photoColor: {
        type: String,
        required: false
    },
    photoStripsCount: {
        type: Number,
        required: false
    },
    paymentAmount: {
        type: Number,
        required: false 
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'expired','QRnotCreated','user_cancelled'],
        default: 'QRnotCreated'
    },
    printerJobId: {
        type: String,
        required: false
    },
    transferId: { type: String }, 
    transferAmount: { type: Number }, 
    transferStatus: {
        type: String,
        enum: ['not_attempted', 'created', 'failed'],
        default: 'not_attempted'
    },
    razorpayLinkedAccountId: { type: String }, // Account the transfer was sent to

    printerJobStatus: {
        type: String,
        enum: [
            "jobIdNotCreated", // Default state, no job ID assigned
            "pending",         // UPS state 3
            "held",           // UPS state 4
            "processing",     // UPS state 5
            "stopped",        // UPS state 6
            "canceled",       // UPS state 7
            "aborted",        // UPS state 8
            "completed"       // UPS state 9
        ],
        default: "jobIdNotCreated"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model("PhotoSession", PhotoSessionSchema);