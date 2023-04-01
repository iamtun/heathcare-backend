import mongoose, { Schema } from 'mongoose';

const postSchema = new Schema(
    {
        title: {
            type: String,
            require: [true, 'Vui lòng nhập tiêu đề'],
        },
        content: {
            type: String,
            require: [true, 'Vui lòng nhập nội dung'],
        },
        images: {
            type: [String],
        },
        comments: [
            {
                type: Schema.Types.ObjectId,
                ref: 'comments',
            },
        ],
        author: { type: Schema.Types.ObjectId, ref: 'doctors', require: true },
        likes: {
            type: [String],
        },
    },
    { timestamps: true }
);

const Post = mongoose.model('posts', postSchema);
export default Post;
