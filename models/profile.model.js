import mongoose, { Schema } from 'mongoose';

const profileSchema = new Schema({
    specialist: {
        type: [String],
        require: [true, 'Please fill your specialist'],
    },
    training_place: {
        type: String,
        require: [true, 'Please fill your training place'],
    },
    degree: {
        type: String,
        require: [true, 'Please fill your degree'],
    },
    languages: {
        type: [String],
        require: [true, 'Please fill your languages'],
    },
    certificate: {
        type: String,
        default: 'Chưa được cập nhật',
    },
    education: {
        type: String,
        require: [true, 'Please fill your education'],
    },
    experiences: {
        type: [String],
        require: [true, 'Please fill your experiences'],
    },
    work_place: {
        type: String,
        require: true,
    },
    doctor: {
        type: Schema.ObjectId,
        ref: 'doctors',
        unique: true,
    },
});

const Profile = mongoose.model('profiles', profileSchema);
export default Profile;
