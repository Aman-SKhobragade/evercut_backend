import express from 'express';
import {
  createRating,
  getBarberRatings,
  getRating,
  updateRating,
  deleteRating,
  getUserRatings
} from '../../controllers/rating/rating.controller.js';
import verifyToken from '../../middleware/verifyToken.js';

const router = express.Router();

// User routes (protected)
router.post('/', verifyToken, createRating);
router.get('/my-ratings', verifyToken, getUserRatings);
router.put('/barber/:barberFirebaseUid', verifyToken, updateRating);
router.delete('/barber/:barberFirebaseUid', verifyToken, deleteRating);

// Public routes (can be accessed without authentication)
router.get('/barber/:barberFirebaseUid', getBarberRatings);
router.get('/barber/:barberFirebaseUid/user/:userFirebaseUid', getRating);

export default router;
