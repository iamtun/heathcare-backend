import mongoose, { Schema } from 'mongoose';

const bmiSchema = new Schema(
    {
        weight: {
            type: Number,
            require: true,
        },

        height: {
            type: Number,
            require: true,
        },
        cal_bmi: {
            type: Number,
            require: true,
        },
        gender: {
            type: Boolean,
            require: true,
        },
        patient: {
            type: Schema.Types.ObjectId,
            ref: 'patients',
        },
    },
    { timestamps: true }
);

const BMI = mongoose.model('bmis', bmiSchema);
export default BMI;
