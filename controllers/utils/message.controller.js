import { STATUS_SUCCESS } from '../../common/constant.js';
import Conversation from '../../models/conversation.model.js';
import Message from '../../models/message.model.js';
import Base from './base.controller.js';

const createMessage = async (req, res, next) => {
    const { conversation } = req.body;
    const { files } = req;

    try {
        const images = files.map((file) => file.path);

        req.body.images = images;
        const { doc, error } = await Base.createAndReturnObject(Message)(
            req,
            res,
            next
        );

        // console.log('data req ->', conversation);
        if (doc) {
            const _conversation = await Conversation.findById(conversation);
            _conversation.last_message = doc._id;
            const __conversation = await _conversation.save();

            const data = {
                ...doc._doc,
                receiverId: _conversation.members.filter(
                    (member) => member.id !== doc.senderId
                )[0],
            };
            return res.status(201).json({
                status: STATUS_SUCCESS,
                data,
            });
        }

        if (error) {
            next(error);
        }
    } catch (error) {
        next(error);
    }
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
