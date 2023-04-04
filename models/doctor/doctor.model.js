import mongoose, { Schema } from 'mongoose';

const doctorSchema = new Schema(
    {
        person: {
            type: Schema.Types.ObjectId,
            ref: 'persons',
        },
        is_accepted: {
            type: Boolean,
            default: false,
        },
        deleted: {
            type: Boolean,
            default: false,
        },
        ratings: [
            {
                type: Schema.Types.ObjectId,
                ref: 'ratings',
            },
        ],
        work_type: {
            type: String,
            require: true,
        },
    },
    { timestamps: true }
);

const Doctor = mongoose.model('doctors', doctorSchema);
export default Doctor;
