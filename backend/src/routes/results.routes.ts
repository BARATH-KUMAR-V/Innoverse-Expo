import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { getResults } from "../controllers/results.controller";

const router = Router();

// Public on purpose - published results are meant to be visible to everyone,
// signed in or not.
router.get("/", asyncHandler(getResults));

export default router;
