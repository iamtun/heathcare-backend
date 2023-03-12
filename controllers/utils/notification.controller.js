import Base from './base.controller.js';
import Notification from '../../models/notification.model.js';
import AppError from '../../utils/error.util.js';
import {
    MESSAGE_NO_ENOUGH_IN_4,
    STATUS_FAIL,
    STATUS_SUCCESS,
} from '../../common/constant.js';

const createNotification = async (req, res, next) => {
    const { from, to, content } = req.body;

    if (from && to && content) {
        return Base.createOne(Notification)(req, res, next);
    } else {
        return next(
            AppError(400, STATUS_FAIL, MESSAGE_NO_ENOUGH_IN_4),
            req,
            res,
            next
        );
    }
};

const findNotificationsByReceiverId = async (req, res, next) => {
    const { id } = req.params;
    const notifications = await Notification.find({
        to: id,
    }).sort({
        createdAt: -1,
    });
    res.status(200).json({
        status: STATUS_SUCCESS,
        data: notifications,
    });
};

const updateSeenNotifications = async (req, res, next) => {
    const { ids } = req.body;

    if (ids && ids.length > 0) {
        const notifications = await Promise.all(
            ids.map(
                async (id) =>
                    await Notification.findByIdAndUpdate(
                        id,
                        { hasSeen: true },
                        {
                            new: true,
                        }
                    )
            )
        );

        res.status(201).json({
            status: STATUS_SUCCESS,
            data: notifications,
        });
    } else {
        return next(
            AppError(400, STATUS_FAIL, MESSAGE_NO_ENOUGH_IN_4),
            req,
            res,
            next
        );
    }
};

const getAllNotifications = Base.getAll(Notification);

export default {
    createNotification,
    findNotificationsByReceiverId,
    updateSeenNotifications,
    getAllNotifications,
};
