const express = require("express");
const router = express.Router();
const geocodingService = require("../services/geocoding-service");

// GET /api/geocoding/search?q=location&limit=5
router.get("/search", async (req, res, next) => {
  try {
    const { q, limit } = req.query;
    
    if (!q) {
      return res.status(400).json({ 
        success: false, 
        message: "Search query parameter 'q' is required.",
        data: [] 
      });
    }

    const result = await geocodingService.geocode(q, limit ? parseInt(limit) : 5);
    res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/geocoding/reverse?lat=40.7128&lon=-74.0060&limit=1
router.get("/reverse", async (req, res, next) => {
  try {
    const { lat, lon, limit } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({ 
        success: false, 
        message: "Query parameters 'lat' and 'lon' are required.",
        data: [] 
      });
    }

    const result = await geocodingService.reverseGeocode(
      parseFloat(lat), 
      parseFloat(lon), 
      limit ? parseInt(limit) : 1
    );
    res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
