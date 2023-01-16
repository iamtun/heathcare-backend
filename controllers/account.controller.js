import Account from "../models/account.model.js";
import Base from "./utils/base.controller.js";

const getAllAccount = Base.getAll(Account);
const getAccount = Base.getOne(Account);

export default { getAccount, getAllAccount };