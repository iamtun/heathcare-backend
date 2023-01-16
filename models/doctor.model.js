import mongoose, { Schema } from 'mongoose';

const doctorSchema = new Schema({
    person: {
        type: Schema.Types.ObjectId,
        ref: 'persons',
    },
    isAccepted: {
        type: Boolean,
        default: false,
    },
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 5,
    },
});

const Doctor = mongoose.model('doctors', doctorSchema);
export default Doctor;
