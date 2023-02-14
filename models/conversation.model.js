import mongoose, { Schema } from 'mongoose';

const conversationSchema = new Schema({
    conversation_name: {
        type: String,
        require: true,
    },
    members: [
        { type: Schema.Types.ObjectId, ref: 'patients' },
        { type: Schema.Types.ObjectId, ref: 'doctors' },
    ],
    image: {
        type: String,
        require: true,
    },
});

const Conversation = mongoose.model('conversations', conversationSchema);
export default Conversation;
