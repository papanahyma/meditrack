import Drug from "../models/Drug.js";

export const searchDrugs = async (req, res) => {
  try {
    const query = req.query.query;

    if (!query) {
      return res.json([]);
    }

    const drugs = await Drug.find({
      name: { $regex: query, $options: "i" },
    }).limit(10);

    res.json(drugs);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};