import mongoose, { Schema } from 'mongoose';

const scheduleDetailSchema = new Schema(
    {
        content_exam: {
            type: String,
            require: true,
        },
        result_exam: {
            type: String,
        },
        schedule: {
            type: Schema.Types.ObjectId,
            ref: 'schedules',
        },
        patient: {
            type: Schema.Types.ObjectId,
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
