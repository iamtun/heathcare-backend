import mongoose, { Schema } from 'mongoose';

const glycemicSchema = new Schema(
    {
        metric: {
            type: Number,
            require: true,
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
