import mongoose, { Schema } from 'mongoose';

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
    },
    {
        timestamps: true,
    }
);

const Notification = mongoose.model('notifications', notificationSchema);
export default Notification;
