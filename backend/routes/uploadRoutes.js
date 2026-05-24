import express from "express";
import multer from "multer";
import path from "path";

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },

  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

router.post(
  "/prescription",
  upload.single("image"),
  (req, res) => {
    res.json({
      imageUrl: `/uploads/${req.file.filename}`,
    });
  }
);

export default router;