import mongoose, { Schema } from 'mongoose';

const ruleSchema = new Schema(
    {
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
        gender: {
            type: Boolean,
        },
        case: {
            type: Number,
            require: true,
            min: 1,
            max: 4,
            // 1. Đường huyết lúc đói(trước ăn sáng)
            // 2. Đường huyết sau ăn(sau ăn sáng)
            // 3. Đường huyết lúc đi ngủ
            // 4. Xét nghiệm Hemoglobin A1c (HbA1c)
        },
        type: {
            type: String,
            require: [
                true,
                'Vui lòng nhập kiểu để có thể phân biệt, VD: BMI | GLYCEMIC',
            ],
        },
    },
    { timestamps: true }
);

const Rule = mongoose.model('rules', ruleSchema);
export default Rule;
