import Shift from '../models/shift.model.js';
import Base from './utils/base.controller.js';

const createShift = async (req, res, next) => {
    //check rule admin
    return Base.createOne(Shift)(req, res, next);
};

export default { createShift };
