import { Router, type IRouter } from "express";
import healthRouter from "./health";
import jordanRouter from "./jordan";

const router: IRouter = Router();

router.use(healthRouter);
router.use(jordanRouter);

export default router;
