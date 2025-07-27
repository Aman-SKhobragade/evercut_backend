// Rating validation service for maintaining data integrity

export const validateRatingData = (data) => {
  const { userFirebaseUid, barberFirebaseUid, rating, reviewText, serviceDetails } = data;
  const errors = [];

  // Validate required fields
  if (!userFirebaseUid || typeof userFirebaseUid !== 'string') {
    errors.push('User Firebase UID is required and must be a string');
  }

  if (!barberFirebaseUid || typeof barberFirebaseUid !== 'string') {
    errors.push('Barber Firebase UID is required and must be a string');
  }

  if (!rating || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    errors.push('Rating must be an integer between 1 and 5');
  }

  // Validate optional fields
  if (reviewText && typeof reviewText !== 'string') {
    errors.push('Review text must be a string');
  }

  if (reviewText && reviewText.length > 500) {
    errors.push('Review text cannot exceed 500 characters');
  }

  // Validate service details if provided
  if (serviceDetails) {
    if (typeof serviceDetails !== 'object') {
      errors.push('Service details must be an object');
    } else {
      if (serviceDetails.serviceName && typeof serviceDetails.serviceName !== 'string') {
        errors.push('Service name must be a string');
      }
      
      if (serviceDetails.serviceDate && !Date.parse(serviceDetails.serviceDate)) {
        errors.push('Service date must be a valid date');
      }
      
      if (serviceDetails.servicePrice && (typeof serviceDetails.servicePrice !== 'number' || serviceDetails.servicePrice < 0)) {
        errors.push('Service price must be a positive number');
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateRatingUpdateData = (data) => {
  const { rating, reviewText, serviceDetails } = data;
  const errors = [];

  // At least one field must be provided for update
  if (!rating && !reviewText && !serviceDetails) {
    errors.push('At least one field (rating, reviewText, or serviceDetails) must be provided for update');
  }

  // Validate rating if provided
  if (rating !== undefined && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
    errors.push('Rating must be an integer between 1 and 5');
  }

  // Validate review text if provided
  if (reviewText !== undefined) {
    if (typeof reviewText !== 'string') {
      errors.push('Review text must be a string');
    } else if (reviewText.length > 500) {
      errors.push('Review text cannot exceed 500 characters');
    }
  }

  // Validate service details if provided
  if (serviceDetails) {
    if (typeof serviceDetails !== 'object') {
      errors.push('Service details must be an object');
    } else {
      if (serviceDetails.serviceName && typeof serviceDetails.serviceName !== 'string') {
        errors.push('Service name must be a string');
      }
      
      if (serviceDetails.serviceDate && !Date.parse(serviceDetails.serviceDate)) {
        errors.push('Service date must be a valid date');
      }
      
      if (serviceDetails.servicePrice && (typeof serviceDetails.servicePrice !== 'number' || serviceDetails.servicePrice < 0)) {
        errors.push('Service price must be a positive number');
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateRatingQuery = (query) => {
  const { page, limit, minRating, maxRating, sortBy, sortOrder } = query;
  const errors = [];

  // Validate pagination
  if (page !== undefined) {
    const pageNum = parseInt(page);
    if (isNaN(pageNum) || pageNum < 1) {
      errors.push('Page must be a positive integer');
    }
  }

  if (limit !== undefined) {
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be a positive integer between 1 and 100');
    }
  }

  // Validate rating filters
  if (minRating !== undefined) {
    const minRatingNum = parseInt(minRating);
    if (isNaN(minRatingNum) || minRatingNum < 1 || minRatingNum > 5) {
      errors.push('Minimum rating must be between 1 and 5');
    }
  }

  if (maxRating !== undefined) {
    const maxRatingNum = parseInt(maxRating);
    if (isNaN(maxRatingNum) || maxRatingNum < 1 || maxRatingNum > 5) {
      errors.push('Maximum rating must be between 1 and 5');
    }
  }

  // Validate sorting
  if (sortBy !== undefined) {
    const validSortFields = ['rating', 'createdAt', 'updatedAt'];
    if (!validSortFields.includes(sortBy)) {
      errors.push(`Sort field must be one of: ${validSortFields.join(', ')}`);
    }
  }

  if (sortOrder !== undefined) {
    const validSortOrders = ['asc', 'desc'];
    if (!validSortOrders.includes(sortOrder.toLowerCase())) {
      errors.push('Sort order must be either "asc" or "desc"');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};
