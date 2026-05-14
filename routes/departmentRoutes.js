import { Router } from "express";
import { getDepartments, getCreate, postCreate, getEdit, postEdit, postDelete } from "../controllers/DepartmentController.js";
import { requireAuth, requireRole } from "../middlewares/auth.js"

const router = Router();

const onlyAdmin = [requireAuth, requireRole('Admin')];

router.get("/", ...onlyAdmin, getDepartments);

router.get("/new", ...onlyAdmin, getCreate);
router.post("/", ...onlyAdmin, postCreate);

router.get("/:id/edit", ...onlyAdmin, getEdit);
router.post("/:id/edit", ...onlyAdmin, postEdit);

router.post("/:id/delete", ...onlyAdmin, postDelete);

export default router;