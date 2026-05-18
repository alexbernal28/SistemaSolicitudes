import { Router } from "express";
import { getRequests, getCreate, postCreate, getFlow, postApprove, postEscalate, postReject } from "../controllers/RequestController.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.use(requireAuth);

router.get("/", getRequests);

router.get("/new", getCreate);
router.post("/", postCreate);

router.get("/:id", getFlow);

router.post("/:id/approve", postApprove);
router.post("/:id/reject", postReject);
router.post("/:id/escalate", postEscalate);

export default router;