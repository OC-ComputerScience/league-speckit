import { Router } from "express";
import userController from "../controllers/user.controller.js";
import { authenticateAdmin } from "../authorization/authorization.js";

const router = Router();

router.get("/", [authenticateAdmin], userController.findAll);
router.get("/:id", [authenticateAdmin], userController.findOne);
router.put("/:id", [authenticateAdmin], userController.update);

export default router;
