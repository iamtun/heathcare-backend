import mongoose, { Schema } from 'mongoose';

const messageSchema = new Schema(
    {
        // patient: {
        //     type: Schema.Types.ObjectId,
        //     ref: 'patients',
        // },
        // doctor: {
        //     type: Schema.Types.ObjectId,
        //     ref: 'doctors',
        // },
        conversation: {
            type: Schema.Types.ObjectId,
            require: true,
        },
        senderId: {
            type: Schema.Types.ObjectId,
            require: true,
        },
        content: {
            type: String,
            require: true,
        },
        images: [{ type: String }],
    },
    { timestamps: true }
);

const Message = mongoose.model('messages', messageSchema);
export default Message;
