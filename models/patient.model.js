import mongoose, { Schema } from 'mongoose';

const patientSchema = new Schema(
    {
        person: {
            type: Schema.Types.ObjectId,
            ref: 'persons',
        },
        blood: {
            type: String,
            require: [true, 'Please fill your blood'],
        },
        deleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

const Patient = mongoose.model('patients', patientSchema);
export default Patient;
