import mongoose, { Schema } from 'mongoose';

const ruleSchema = new Schema({
    start: {
        type: Number,
        min: 1,
    },
    end: {
        type: Number,
        min: 1,
    },
    notification: {
        type: String,
        require: [true, 'Vui lòng nhập thông báo để hiển thị'],
    },
    type: {
        type: String,
        require: [
            true,
            'Vui lòng nhập kiểu để có thể phân biệt, VD: BMI | GLYCEMIC',
        ],
    },
});

const Rule = mongoose.model('rules', ruleSchema);
export default Rule;
