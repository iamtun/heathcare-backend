import Conversation from '../../models/conversation.model.js';
import Patient from '../../models/patient/patient.model.js';
import Doctor from '../../models/doctor/doctor.model.js';

import Base from './base.controller.js';
import { STATUS_SUCCESS } from '../../common/constant.js';
import Message from '../../models/message.model.js';
import moment from 'moment';

const findConversationBy2Id = async (patient_id, doctor_id) => {
    const conversation = await Conversation.findOne({
        members: [patient_id, doctor_id],
    });
    return conversation._id;
};

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

const getAllConversation = Base.getAll(Conversation);

const getConversationListByPatientId = async (req, res, next) => {
    const { id } = req.params;
    const conversations = await Conversation.find({});

    const _conversations = conversations.filter((conversation) => {
        return conversation.members[0].valueOf() === id;
    });

    const __conversations = await Promise.all(
        _conversations.map(async (conversation) => {
            const patient = await Patient.findById(
                conversation.members[0]
            ).populate('person');
            const doctor = await Doctor.findById(
                conversation.members[1]
            ).populate('person');

            const last_message = await Message.findById(
                conversation.last_message
            );

            return {
                _id: conversation._id,
                members: [patient, doctor],
                last_message: last_message,
            };
        })
    );
    res.status(200).json({
        status: STATUS_SUCCESS,
        data: __conversations
            .sort((a, b) =>
                moment
                    .utc(a.last_message.createdAt)
                    .diff(moment.utc(b.last_message.createdAt))
            )
            .reverse(),
    });
};

const getConversationListByDoctorId = async (req, res, next) => {
    const { id } = req.params;
    const conversations = await Conversation.find({});

    const _conversations = conversations.filter((conversation) => {
        return conversation.members[1].valueOf() === id;
    });

    const __conversations = await Promise.all(
        _conversations.map(async (conversation) => {
            const patient = await Patient.findById(
                conversation.members[0]
            ).populate('person');
            const doctor = await Doctor.findById(
                conversation.members[1]
            ).populate('person');

            const last_message = await Message.findById(
                conversation.last_message
            );

            return {
                _id: conversation._id,
                members: [patient, doctor],
                last_message: last_message,
            };
        })
    );

    res.status(200).json({
        status: STATUS_SUCCESS,
        data: __conversations
            .sort((a, b) =>
                moment
                    .utc(a.last_message.createdAt)
                    .diff(moment.utc(b.last_message.createdAt))
            )
            .reverse(),
    });
};

export default {
    createConversation,
    getAllConversation,
    getConversationListByPatientId,
    getConversationListByDoctorId,
    findConversationBy2Id,
};
