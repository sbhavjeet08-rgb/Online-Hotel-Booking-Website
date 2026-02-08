// backend-server/routes/hotelRoutes.js
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

const {
  getAllHotels,
  getHotelById,
  createHotel,
  updateHotel,
  deleteHotel,
  uploadHotelImage   // <- add this to the destructuring import
} = require("../controllers/hotelController");

// public
router.get("/", getAllHotels);
router.get("/:id", getHotelById);

// admin (protected)
router.post("/", authMiddleware, upload.single("image"), createHotel);
router.put("/:id", authMiddleware, upload.single("image"), updateHotel);
router.post('/:id/image', authMiddleware, upload.single('image'), uploadHotelImage); // <-- NEW
router.delete("/:id", authMiddleware, deleteHotel);

module.exports = router;

