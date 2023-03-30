import mongoose, { Schema } from 'mongoose';

const commentSchema = new Schema(
    {
        content: {
            type: String,
            require: [true, 'Vui lòng nhập nội dung'],
        },
        images: {
            type: [String],
        },
        patient_id: {
            type: Schema.Types.ObjectId,
            ref: 'patients',
        },
        doctor_id: {
            type: Schema.Types.ObjectId,
            ref: 'doctors',
        },
        post_id: {
            type: Schema.Types.ObjectId,
            ref: 'posts',
        },
    },
    { timestamps: true }
);

const Comment = mongoose.model('comments', commentSchema);
export default Comment;
