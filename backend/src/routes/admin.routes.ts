import { Router } from "express";
import { ensureAdmin } from "../middleware/auth";
import { teamUpload } from "../middleware/upload";
import { asyncHandler } from "../utils/asyncHandler";
import {
  getStats,
  getRankings,
  listTeamsForAdmin,
  createTeamHandler,
  updateTeamHandler,
  deleteTeamHandler,
  startVoting,
  stopVoting,
  publishResults,
  unpublishResults,
  exportCsv,
} from "../controllers/admin.controller";

const router = Router();

// Every route below requires a signed-in admin (checked server-side against
// ADMIN_EMAILS - the frontend's notion of "isAdmin" is never trusted).
router.use(ensureAdmin);

router.get("/stats", asyncHandler(getStats));
router.get("/rankings", asyncHandler(getRankings));

router.get("/teams", asyncHandler(listTeamsForAdmin));
router.post("/teams", teamUpload, asyncHandler(createTeamHandler));
router.put("/teams/:id", teamUpload, asyncHandler(updateTeamHandler));
router.delete("/teams/:id", asyncHandler(deleteTeamHandler));

router.post("/voting/start", asyncHandler(startVoting));
router.post("/voting/stop", asyncHandler(stopVoting));

router.get("/export", asyncHandler(exportCsv));

router.post("/results/publish", asyncHandler(publishResults));
router.post("/results/unpublish", asyncHandler(unpublishResults));

export default router;
