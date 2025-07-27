import mongoose from 'mongoose';

const ratingSchema = new mongoose.Schema({
  // User who gave the rating
  userFirebaseUid: {
    type: String,
    required: true,
    ref: 'User'
  },
  
  // Barber who received the rating
  barberFirebaseUid: {
    type: String,
    required: true,
    ref: 'BarberSetup'
  },
  
  // Rating value (1-5 stars)
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    validate: {
      validator: Number.isInteger,
      message: 'Rating must be an integer between 1 and 5'
    }
  },
  
  // Optional review text
  reviewText: {
    type: String,
    maxlength: 500,
    trim: true
  },
  
  // Optional service details
  serviceDetails: {
    serviceName: String,
    serviceDate: Date,
    servicePrice: Number
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to ensure one rating per user per barber
ratingSchema.index({ userFirebaseUid: 1, barberFirebaseUid: 1 }, { unique: true });

// Index for efficient queries
ratingSchema.index({ barberFirebaseUid: 1, createdAt: -1 });
ratingSchema.index({ rating: 1 });

export default mongoose.model('Rating', ratingSchema);
