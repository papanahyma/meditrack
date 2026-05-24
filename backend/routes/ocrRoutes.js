import express from "express";
import Tesseract from "tesseract.js";
import path from "path";

const router = express.Router();

router.post("/scan", async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        message: "Image URL required",
      });
    }

    // Convert upload URL → real file path
    const imagePath = path.join(
      process.cwd(),
      imageUrl
    );

    console.log("OCR IMAGE PATH:", imagePath);

    const result = await Tesseract.recognize(
      imagePath,
      "eng",
      {
        logger: m => console.log(m),
      }
    );

    res.json({
      extractedText: result.data.text,
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "OCR failed",
      error: error.message,
    });
  }
});

export default router;