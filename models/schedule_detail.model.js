import mongoose, { Schema } from 'mongoose';

const scheduleDetailSchema = new Schema(
    {
        time_start: {
            type: Date,
            require: true,
        },
        time_end: {
            type: Date,
        },
        content_exam: {
            type: String,
            require: true,
        },
        result_exam: {
            type: String,
        },
        schedule: {
            type: mongoose.Types.ObjectId,
            ref: 'schedules',
        },
        patient: {
            typeof: mongoose.Types.ObjectId,
            ref: 'patients',
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
