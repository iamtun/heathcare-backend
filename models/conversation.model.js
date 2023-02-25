import mongoose, { Schema } from 'mongoose';

const conversationSchema = new Schema({
    members: [
        { type: Schema.Types.ObjectId, ref: 'patients' },
        { type: Schema.Types.ObjectId, ref: 'doctors' },
    ],
    last_message: {
        type: Schema.Types.ObjectId,
        ref: 'messages',
    },
});

const Conversation = mongoose.model('conversations', conversationSchema);
export default Conversation;
