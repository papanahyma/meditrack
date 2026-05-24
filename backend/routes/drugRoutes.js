import express from "express";
import { searchDrugs } from "../controllers/drugController.js";

const router = express.Router();

router.get("/search", searchDrugs);

export default router;