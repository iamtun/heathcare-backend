import Conversation from '../../models/conversation.model.js';
import Patient from '../../models/patient.model.js';
import Doctor from '../../models/doctor.model.js';

import Base from './base.controller.js';
import { STATUS_SUCCESS } from '../../common/constant.js';

const createConversation = async (req, res, next) => {
    try {
        const { doc } = await Base.createAndReturnObject(Conversation)(
            req,
            res,
            next
        );

        if (doc) {
            const patient = await Patient.findById(doc.members[0]).populate(
                'person'
            );
            const doctor = await Doctor.findById(doc.members[1]).populate(
                'person'
            );

            const conversation = {
                _id: doc._id,
                members: [patient, doctor],
            };

            res.status(201).json({
                status: STATUS_SUCCESS,
                data: conversation,
            });
        }
    } catch (error) {
        console.error('error in create conversation -> ', error);
    }
};

export default { createConversation };
