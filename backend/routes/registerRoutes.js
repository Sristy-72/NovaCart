import { registerController } from "../controllers/registerController";
const Router = express.Router();
Router.post("/", registerController);

export default Router;
