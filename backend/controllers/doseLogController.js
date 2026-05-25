import DoseLog from "../models/DoseLog.js";

/**
 * MARK DOSE AS TAKEN
 */
export const markAsTaken = async (req, res) => {
  try {
    const { doseLogId } = req.params;

    const updated = await DoseLog.findByIdAndUpdate(
      doseLogId,
      {
        status: "taken",
        takenTime: new Date(),
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Dose not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Marked as taken",
      dose: updated,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const markAsMissed = async (req, res) => {
  try {
    const { doseLogId } = req.params;

    const updated = await DoseLog.findByIdAndUpdate(
      doseLogId,
      {
        status: "missed",
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Dose not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Marked as missed",
      dose: updated,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};