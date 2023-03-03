import mongoose, { Schema } from 'mongoose';
import { RULE_INFORMATION } from '../common/constant.js';

const notificationSchema = new Schema(
    {
        from: {
            type: String,
            require: true,
        },
        to: {
            type: String,
            require: true,
        },
        content: {
            type: String,
            require: true,
        },
        hasSeen: {
            type: Boolean,
            default: false,
        },
        rule: {
            type: String,
            default: RULE_INFORMATION,
            require: true,
        },
    },
    {
        timestamps: true,
    }
);

const Notification = mongoose.model('notifications', notificationSchema);
export default Notification;
