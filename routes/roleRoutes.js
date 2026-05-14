import { Router } from "express";
import { getRoles, getCreate, postCreate, getEdit, postEdit, postDelete } from "../controllers/RoleController.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

const onlyAdmin = [requireAuth, requireRole("Admin")];

router.get("/", ...onlyAdmin, getRoles);

router.get("/new", ...onlyAdmin, getCreate);
router.post("/", ...onlyAdmin, postCreate);

router.get("/:id/edit", ...onlyAdmin, getEdit);
router.post("/:id/edit", ...onlyAdmin, postEdit);

router.post("/:id/delete", ...onlyAdmin, postDelete);

export default router;