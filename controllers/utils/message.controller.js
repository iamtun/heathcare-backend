import { STATUS_SUCCESS } from '../../common/constant.js';
import Message from '../../models/message.model.js';
import Base from './base.controller.js';

const createMessage = async (req, res, next) => {
    return Base.createOne(Message)(req, res, next);
};

const getAllMessageByConversationId = async (req, res, next) => {
    const { id } = req.params;
    const messages = await Message.find({ conversation: id });
    res.status(200).json({
        status: STATUS_SUCCESS,
        data: messages,
    });
};
export default { createMessage, getAllMessageByConversationId };
