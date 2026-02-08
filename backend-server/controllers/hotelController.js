// backend-server/controllers/hotelController.js
const db = require("../db");
const fs = require("fs");
const path = require("path");

// GET ALL HOTELS
exports.getAllHotels = async (req, res, next) => {
  try {
    const [rows] = await db.execute("SELECT * FROM hotels ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

// GET HOTEL BY ID
exports.getHotelById = async (req, res, next) => {
  try {
    const id = req.params.id;
    const [rows] = await db.execute("SELECT * FROM hotels WHERE id = ?", [id]);
    if (!rows.length) return res.status(404).json({ message: "Hotel not found" });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

// CREATE HOTEL (ADMIN + MULTER)
exports.createHotel = async (req, res, next) => {
  try {
    if (!req.user || !req.user.isAdmin) return res.status(403).json({ message: "Admin only" });

    const { name, location, price_per_night, total_rooms, description } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    await db.execute(
      `INSERT INTO hotels (name, location, price_per_night, total_rooms, description, image_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, location || "", price_per_night || 0, total_rooms || 1, description || "", imagePath]
    );

    res.json({ message: "Hotel created" });
  } catch (err) {
    next(err);
  }
};

// UPDATE HOTEL (ADMIN + replace old image) - tolerates partial updates
exports.updateHotel = async (req, res, next) => {
  try {
    if (!req.user || !req.user.isAdmin) return res.status(403).json({ message: "Admin only" });

    const id = req.params.id;

    // fetch existing row
    const [rows] = await db.execute(
      "SELECT name, location, price_per_night, total_rooms, description, image_url FROM hotels WHERE id = ?",
      [id]
    );
    if (!rows.length) return res.status(404).json({ message: "Hotel not found" });

    const existing = rows[0];

    // use provided values (note: form-data sends strings) or fall back to existing
    const name = (req.body.name !== undefined && req.body.name !== "") ? req.body.name : existing.name;
    const location = (req.body.location !== undefined && req.body.location !== "") ? req.body.location : existing.location;
    const price_per_night = (req.body.price_per_night !== undefined && req.body.price_per_night !== "") ? req.body.price_per_night : existing.price_per_night;
    const total_rooms = (req.body.total_rooms !== undefined && req.body.total_rooms !== "") ? req.body.total_rooms : existing.total_rooms;
    const description = (req.body.description !== undefined && req.body.description !== "") ? req.body.description : existing.description;

    // handle image
    const oldImage = existing.image_url;
    const newImage = req.file ? `/uploads/${req.file.filename}` : oldImage;

    // execute update without undefined binds
    await db.execute(
      `UPDATE hotels SET name=?, location=?, price_per_night=?, total_rooms=?, description=?, image_url=? WHERE id=?`,
      [name, location, price_per_night, total_rooms, description, newImage, id]
    );

    // delete old file if replaced (safe check)
    if (req.file && oldImage) {
      const normalized = path.normalize(oldImage);
      if (normalized.startsWith('/uploads') || normalized.startsWith('uploads')) {
        const oldPath = path.join(__dirname, "..", normalized);
        fs.unlink(oldPath, (err) => {
          if (err && err.code !== "ENOENT") console.error("Failed to delete old image:", err);
        });
      } else {
        console.warn("Old image path not inside uploads, skipping delete:", oldImage);
      }
    }

    // return updated hotel row
    const [updatedRows] = await db.execute("SELECT * FROM hotels WHERE id = ?", [id]);
    res.json({ message: "Hotel updated", hotel: updatedRows[0] });

  } catch (err) {
    next(err);
  }
};


// DELETE HOTEL (ADMIN + delete image)
exports.deleteHotel = async (req, res, next) => {
  try {
    if (!req.user || !req.user.isAdmin) return res.status(403).json({ message: "Admin only" });

    const id = req.params.id;
    const [rows] = await db.execute("SELECT image_url FROM hotels WHERE id = ?", [id]);
    if (!rows.length) return res.status(404).json({ message: "Hotel not found" });

    const img = rows[0].image_url;
    if (img) {
      const filePath = path.join(__dirname, "..", img);
      fs.unlink(filePath, (err) => {
        if (err && err.code !== "ENOENT") console.error("Error deleting image:", err);
      });
    }

    await db.execute("DELETE FROM hotels WHERE id = ?", [id]);
    res.json({ message: "Hotel deleted" });
  } catch (err) {
    next(err);
  }
};

// Upload or replace only image for a hotel (admin only)
exports.uploadHotelImage = async (req, res, next) => {
  try {
    const hotelId = req.params.id;

    // require admin (consistent with other handlers)
    if (!req.user || !req.user.isAdmin) return res.status(403).json({ message: 'Admin only' });

    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    // new relative path saved in DB
    const publicPath = `/uploads/${req.file.filename}`;

    // fetch current image_url (if any)
    const [rows] = await db.execute('SELECT image_url FROM hotels WHERE id = ?', [hotelId]);
    if (!rows.length) return res.status(404).json({ message: 'Hotel not found' });

    const oldImage = rows[0].image_url;

    // update DB with new path
    await db.execute('UPDATE hotels SET image_url = ? WHERE id = ?', [publicPath, hotelId]);

    // delete previous file from disk if local and inside uploads
    if (oldImage) {
      // Normalize and accept only paths that are inside /uploads or uploads (prevent path traversal)
      const normalized = path.normalize(oldImage);
      if (normalized.startsWith('/uploads') || normalized.startsWith('uploads')) {
        const oldPath = path.join(__dirname, '..', normalized);
        fs.unlink(oldPath, (err) => {
          if (err && err.code !== 'ENOENT') console.warn('Failed to delete old image', err);
        });
      } else {
        console.warn('Old image path not inside uploads, skipping delete:', oldImage);
      }
    }

    // return updated hotel row (handy for frontend)
    const [updatedRows] = await db.execute('SELECT * FROM hotels WHERE id = ?', [hotelId]);
    return res.json({ message: 'Image uploaded', image_url: publicPath, hotel: updatedRows[0] });
  } catch (err) {
    next(err);
  }
};


