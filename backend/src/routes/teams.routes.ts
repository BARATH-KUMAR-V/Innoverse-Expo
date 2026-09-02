import { Router } from "express";
import { ensureAuthenticated } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { getGalleryTeams, getTeamDetail } from "../controllers/teams.controller";

const router = Router();

router.get("/", ensureAuthenticated, asyncHandler(getGalleryTeams));
router.get("/:id", ensureAuthenticated, asyncHandler(getTeamDetail));

export default router;
