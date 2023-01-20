import mongoose from 'mongoose';
import env from 'dotenv';
import app from './app.js';

env.config({
    path: './dev.env',
});

mongoose.set('strictQuery', false);
mongoose
    .connect(process.env.DB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then((connect) => console.log('db connected!'))
    .catch((err) => console.error('connect fail by ', err));

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => console.log(`app is running on port -> ${PORT}`));
