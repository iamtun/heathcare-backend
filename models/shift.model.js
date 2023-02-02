import mongoose, { Schema } from 'mongoose';
import validator from 'validator';

const shiftSchema = new Schema({
    name: {
        type: String,
        require: [true, 'Please fill name shift'],
    },
    desc: {
        type: String,
        require: [true, 'Please fill desc shift'],
    },
    time_start: {
        type: String,
        require: [true, 'Please fill time_start shift'],
    },
    time_end: {
        type: String,
        require: [true, 'Please fill time_end shift'],
    },
});

const Shift = mongoose.model('shifts', shiftSchema);
export default Shift;
