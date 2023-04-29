import mongoose, { Schema } from 'mongoose';

const scheduleDetailSchema = new Schema(
    {
        content_exam: {
            type: String,
            require: true,
        },
        result_exam: {
            type: String,
            default: null,
        },
        schedule: {
            type: Schema.Types.ObjectId,
            ref: 'schedules',
        },
        doctor: {
            type: Schema.Types.ObjectId,
            ref: 'doctors',
        },
        patient: {
            type: Schema.Types.ObjectId,
            ref: 'patients',
        },
        day_exam: {
            type: Date,
            require: true,
            unique: true,
        },
        status: {
            type: Boolean,
            default: false,
        },
        is_exam: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

const ScheduleDetailSchema = mongoose.model(
    'schedule_details',
    scheduleDetailSchema
);
export default ScheduleDetailSchema;
