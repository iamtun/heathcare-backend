import mongoose, { Schema } from 'mongoose';
const blood_pressures_schema = new Schema(
    {
        systolic: {
            type: Number,
            require: true,
        },
        diastole: {
            type: Number,
            require: true,
        },
        patient: {
            type: Schema.Types.ObjectId,
            ref: 'patients',
        },
    },
    { timestamps: true }
);

const BloodPressure = mongoose.model('blood_pressures', blood_pressures_schema);
export default BloodPressure;
