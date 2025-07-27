import mongoose from 'mongoose';

const ClientSchema = new mongoose.Schema({
  clientId: { type: String, required: true, unique: true },  // UUID
  authKey: { type: String, required: true, unique: true },   
  name: { type: String, required: true },                   
  location: { type: String },
  isActive: { type: Boolean, default: true },
  deviceInfo: { type: Object },                              
  lastSeen: { type: Date },                                  
  createdAt: { type: Date, default: Date.now },
  isSplitPaymentEnabled: { type: Boolean, default: false },
  splitPercentage: { type: Number, default: 0, min: 0, max: 100 },
  razorpayLinkedAccountId: { type: String, trim: true }
});

export default mongoose.model("Client", ClientSchema); 