import mongoose, { Schema } from 'mongoose';

const scheduleSchema = new Schema(
    {
        time_per_conversation: {
            type: Number,
            require: [true, 'Please fill time'],
            min: 30,
            max: 60,
        },
        fee: {
            type: Number,
            require: [true, 'Please fill money'],
            min: 100000,
            max: 1000000,
        },
        day: {
            type: Schema.ObjectId,
            ref: 'days',
        },
        time: {
            type: Schema.ObjectId,
            ref: 'shifts',
        },
        doctor: {
            type: Schema.ObjectId,
            ref: 'doctors',
        },
    },
    {
        timestamps: true,
    }
);

const Schedule = mongoose.model('schedules', scheduleSchema);
export default Schedule;
