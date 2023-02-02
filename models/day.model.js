import mongoose, { Schema } from 'mongoose';

const daySchema = new Schema({
    day: {
        type: String,
        unique: true,
        required: true,
    },
    day_number: {
        type: Number,
        unique: true,
        min: [2, 'Must be at least 2, got {VALUE}'],
        max: 8,
        required: true,
    },
});

const Day = mongoose.model('days', daySchema);
export default Day;
