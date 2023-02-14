import mongoose, { Schema } from 'mongoose';

const messageSchema = new Schema({
    patient: {
        type: Schema.Types.ObjectId,
        ref: 'patients',
    },
    doctor: {
        type: Schema.Types.ObjectId,
        ref: 'doctors',
    },
    content: {
        type: String,
        require: true,
    },
    images: [{ type: String }],
});

const Message = mongoose.model('messages', messageSchema);
export default Message;
