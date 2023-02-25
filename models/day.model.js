import mongoose, { Schema } from 'mongoose';

const daySchema = new Schema({
    day: {
        type: Date,
        unique: true,
        required: true,
    },
    day_number: {
        type: Number,
        unique: true,
        min: [0, 'Must be at least 0, got {VALUE}'],
        max: 6,
        required: true,
    },
});

const Day = mongoose.model('days', daySchema);
export default Day;
