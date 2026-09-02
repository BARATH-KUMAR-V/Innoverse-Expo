import { Router } from "express";
import { ensureAuthenticated } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { getVotingStatus, getMyVote, submitVote } from "../controllers/votes.controller";

const router = Router();

router.get("/status", ensureAuthenticated, asyncHandler(getVotingStatus));
router.get("/my-vote", ensureAuthenticated, asyncHandler(getMyVote));
router.post("/", ensureAuthenticated, asyncHandler(submitVote));

export default router;
