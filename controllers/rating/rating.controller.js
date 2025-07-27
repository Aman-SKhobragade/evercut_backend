import Rating from '../../models/Rating.model.js';
import BarberSetup from '../../models/Barber.model.js';
import User from '../../models/User.model.js';
import { 
  validateRatingData, 
  validateRatingUpdateData, 
  validateRatingQuery 
} from './ratingValidation.service.js';

// Create a new rating
export const createRating = async (req, res) => {
  try {
    const { uid: userFirebaseUid } = req.firebaseUser;
    const { barberFirebaseUid, rating, reviewText, serviceDetails } = req.body;

    // Validate input data
    const validation = validateRatingData({ 
      userFirebaseUid, 
      barberFirebaseUid, 
      rating, 
      reviewText, 
      serviceDetails 
    });

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    // Check if barber exists
    const barberExists = await BarberSetup.findOne({ firebaseUid: barberFirebaseUid });
    if (!barberExists) {
      return res.status(404).json({
        success: false,
        message: 'Barber not found'
      });
    }

    // Check if user exists (optional, for data integrity)
    const userExists = await User.findOne({ firebaseUid: userFirebaseUid });
    if (!userExists) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create rating data
    const ratingData = {
      userFirebaseUid,
      barberFirebaseUid,
      rating,
      reviewText: reviewText?.trim() || null,
      serviceDetails: serviceDetails || null
    };

    // Create or update rating (upsert)
    const newRating = await Rating.findOneAndUpdate(
      { userFirebaseUid, barberFirebaseUid },
      ratingData,
      { 
        upsert: true, 
        new: true, 
        runValidators: true 
      }
    );

    res.status(201).json({
      success: true,
      message: 'Rating created successfully',
      data: { rating: newRating }
    });

  } catch (error) {
    console.error('Error creating rating:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Rating already exists for this user and barber'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while creating rating'
    });
  }
};

// Get all ratings for a barber
export const getBarberRatings = async (req, res) => {
  try {
    const { barberFirebaseUid } = req.params;
    const { page = 1, limit = 10, minRating, maxRating, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Validate query parameters
    const validation = validateRatingQuery({ page, limit, minRating, maxRating, sortBy, sortOrder });
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: validation.errors
      });
    }

    // Check if barber exists
    const barberExists = await BarberSetup.findOne({ firebaseUid: barberFirebaseUid });
    if (!barberExists) {
      return res.status(404).json({
        success: false,
        message: 'Barber not found'
      });
    }

    // Build query
    const query = { barberFirebaseUid };
    
    // Add rating filters
    if (minRating || maxRating) {
      query.rating = {};
      if (minRating) query.rating.$gte = parseInt(minRating);
      if (maxRating) query.rating.$lte = parseInt(maxRating);
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Sort configuration
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const ratings = await Rating.find(query)
      .sort(sortConfig)
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const totalRatings = await Rating.countDocuments(query);

    // Calculate average rating
    const ratingStats = await Rating.aggregate([
      { $match: { barberFirebaseUid } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalCount: { $sum: 1 },
          ratingDistribution: {
            $push: '$rating'
          }
        }
      }
    ]);

    // Calculate rating distribution
    let ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    if (ratingStats.length > 0) {
      ratingStats[0].ratingDistribution.forEach(rating => {
        ratingDistribution[rating]++;
      });
    }

    res.status(200).json({
      success: true,
      message: 'Ratings retrieved successfully',
      data: {
        ratings,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalRatings / limitNum),
          totalRatings,
          hasNextPage: pageNum < Math.ceil(totalRatings / limitNum),
          hasPrevPage: pageNum > 1
        },
        statistics: {
          averageRating: ratingStats.length > 0 ? ratingStats[0].averageRating : 0,
          totalRatings: ratingStats.length > 0 ? ratingStats[0].totalCount : 0,
          ratingDistribution
        }
      }
    });

  } catch (error) {
    console.error('Error fetching barber ratings:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching ratings'
    });
  }
};

// Get a specific rating
export const getRating = async (req, res) => {
  try {
    const { barberFirebaseUid, userFirebaseUid } = req.params;

    const rating = await Rating.findOne({ 
      userFirebaseUid, 
      barberFirebaseUid 
    });

    if (!rating) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Rating retrieved successfully',
      data: { rating }
    });

  } catch (error) {
    console.error('Error fetching rating:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching rating'
    });
  }
};

// Update a rating
export const updateRating = async (req, res) => {
  try {
    const { uid: userFirebaseUid } = req.firebaseUser;
    const { barberFirebaseUid } = req.params;
    const { rating, reviewText, serviceDetails } = req.body;

    // Validate input data
    const validation = validateRatingUpdateData({ rating, reviewText, serviceDetails });
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    // Check if rating exists
    const existingRating = await Rating.findOne({ userFirebaseUid, barberFirebaseUid });
    if (!existingRating) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found'
      });
    }

    // Build update data
    const updateData = { updatedAt: new Date() };
    if (rating !== undefined) updateData.rating = rating;
    if (reviewText !== undefined) updateData.reviewText = reviewText?.trim() || null;
    if (serviceDetails !== undefined) updateData.serviceDetails = serviceDetails;

    // Update rating
    const updatedRating = await Rating.findOneAndUpdate(
      { userFirebaseUid, barberFirebaseUid },
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Rating updated successfully',
      data: { rating: updatedRating }
    });

  } catch (error) {
    console.error('Error updating rating:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating rating'
    });
  }
};

// Delete a rating
export const deleteRating = async (req, res) => {
  try {
    const { uid: userFirebaseUid } = req.firebaseUser;
    const { barberFirebaseUid } = req.params;

    const deletedRating = await Rating.findOneAndDelete({ 
      userFirebaseUid, 
      barberFirebaseUid 
    });

    if (!deletedRating) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Rating deleted successfully',
      data: { deletedRating }
    });

  } catch (error) {
    console.error('Error deleting rating:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while deleting rating'
    });
  }
};

// Get user's ratings (ratings given by a user)
export const getUserRatings = async (req, res) => {
  try {
    const { uid: userFirebaseUid } = req.firebaseUser;
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Validate query parameters
    const validation = validateRatingQuery({ page, limit, sortBy, sortOrder });
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: validation.errors
      });
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Sort configuration
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const ratings = await Rating.find({ userFirebaseUid })
      .sort(sortConfig)
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const totalRatings = await Rating.countDocuments({ userFirebaseUid });

    res.status(200).json({
      success: true,
      message: 'User ratings retrieved successfully',
      data: {
        ratings,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalRatings / limitNum),
          totalRatings,
          hasNextPage: pageNum < Math.ceil(totalRatings / limitNum),
          hasPrevPage: pageNum > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching user ratings:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching user ratings'
    });
  }
};
