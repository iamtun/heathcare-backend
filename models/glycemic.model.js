import mongoose, { Schema } from 'mongoose';

const glycemicSchema = new Schema(
    {
        metric: {
            type: Number,
            require: true,
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

        patient: {
            type: Schema.Types.ObjectId,
            ref: 'patients',
        },
    },
    { timestamps: true }
);

const Glycemic = mongoose.model('glycemics', glycemicSchema);
export default Glycemic;
