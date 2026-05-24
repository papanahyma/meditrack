import mongoose from "mongoose";

const drugSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
});

export default mongoose.model("Drug", drugSchema);