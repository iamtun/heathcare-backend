import mongoose, { Schema } from 'mongoose';
import validator from 'validator';
const personSchema = new Schema({
    username: {
        type: String,
        require: [true, 'Please fill your username'],
    },
    dob: {
        type: String,
        require: [true, 'Please fill your birth day'],
    },
    address: {
        type: String,
        require: [true, 'Please fill your address'],
    },
    gender: {
        type: Boolean, // true is male
        require: [true, 'Please fill your username'],
    },
    avatar: {
        type: String,
        // validate: [validator.isDataURI, "Please provide a avatar uri"],
    },
    account: { type: Schema.Types.ObjectId, ref: 'accounts' },
});

const Person = mongoose.model('persons', personSchema);
export default Person;
