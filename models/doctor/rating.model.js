import mongoose, { Schema } from 'mongoose';

const ratingSchema = new Schema(
    {
        rating: {
            type: Number,
            min: 0,
            max: 5,
            default: 5,
        },
        patient_id: {
            type: Schema.Types.ObjectId,
            ref: 'patients',
        },
        content: {
            type: String,
            require: true,
        },
        schedule_id: {
            type: Schema.Types.ObjectId,
            ref: 'schedule_details',
        },
    },
    { timestamps: true }
);

const Rating = mongoose.model('ratings', ratingSchema);
export default Rating;
