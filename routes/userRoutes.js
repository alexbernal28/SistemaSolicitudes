import { Router } from "express";
import { getUsers, getCreate, postCreate, getEdit, postEdit, postToggle } from "../controllers/UserController.js";
import { requireAuth, requireRole } from "../middlewares/auth.js"

const router = Router();

const onlyAdmin = [requireAuth, requireRole('Admin')];

router.get("/", ...onlyAdmin, getUsers);

router.get("/new", ...onlyAdmin, getCreate);
router.post("/new", ...onlyAdmin, postCreate);

router.get("/:id/edit", ...onlyAdmin, getEdit);
router.post("/:id/edit", ...onlyAdmin, postEdit);

router.post("/:id/toggle", ...onlyAdmin, postToggle);

export default router;