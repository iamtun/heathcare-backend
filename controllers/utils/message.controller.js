import Message from '../../models/message.model.js';
import Base from './base.controller.js';

const createMessage = async (req, res, next) => {
    return Base.createOne(Message)(req, res, next);
};

export default { createMessage };
