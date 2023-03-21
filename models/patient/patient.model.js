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
        doctor_blood_id: {
            type: Schema.Types.ObjectId,
            ref: 'doctors',
            default: null,
        },
        doctor_glycemic_id: {
            type: Schema.Types.ObjectId,
            ref: 'doctors',
            default: null,
        },
        anamnesis: {
            type: Number,
            default: 0,
            require: true,
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
