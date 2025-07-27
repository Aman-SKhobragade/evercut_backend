import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from 'url';
import multer from 'multer'; // ✅ Add this import
import connectDB from "./config/dbConnect.js";

// User routes
import userAuthRoutes from "./routes/user/auth/userAuth.routes.js";

// Barber routes
import barberAuthRoutes from "./routes/barber/auth/barberAuth.routes.js";
import barberProfileRoutes from "./routes/barber/profile/barberProfile.routes.js";
import barberBusinessRoutes from "./routes/barber/business/barberBusiness.routes.js";
import barberEmployeeRoutes from "./routes/barber/business/barberEmployee.routes.js";
import barberServiceRoutes from "./routes/barber/business/barberService.routes.js";
import photoGelleryRoutes from "./routes/barber/profile/photoGellary.routes.js";
import addCoverRoutes from "./routes/barber/profile/addCover.routes.js";

// Rating routes
import ratingRoutes from "./routes/rating/rating.routes.js";

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase payload limit for photos
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// User API routes
app.use("/api/user/auth", userAuthRoutes);

// Barber API routes
app.use("/api/barber/auth", barberAuthRoutes);
app.use("/api/barber/profile", barberProfileRoutes);
app.use("/api/barber/business", barberBusinessRoutes);
app.use("/api/barber/employees", barberEmployeeRoutes);
app.use("/api/barber/services", barberServiceRoutes);
app.use("/api/barber/photos", photoGelleryRoutes); // Assuming photo routes are under barber profile
app.use("/api/barber/cover", addCoverRoutes); // Add cover image routes

// Rating API routes
app.use("/api/ratings", ratingRoutes);

// Error handling middleware for multer
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'File too large. Maximum size is 5MB per file.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        message: 'Too many files. Maximum 10 files allowed per upload.'
      });
    }
  }

  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      message: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'
    });
  }

  next(error);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ message: 'Server is running successfully!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📁 Photo uploads will be served from: http://localhost:${PORT}/uploads/photos/`);
});