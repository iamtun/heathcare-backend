import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import AppError from './utils/error.util.js';
import GlobalHandler from './controllers/utils/error.controller.js';

import AuthRouters from './routers/auth.router.js';
import PatientRouters from './routers/patient.router.js';
import DoctorRouters from './routers/doctor.router.js';
const app = express();

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api/v1/auth', AuthRouters);
app.use('/api/v1/patients', PatientRouters);
app.use('/api/v1/doctors', DoctorRouters);
app.use('*', (req, res, next) => {
    const err = new AppError(404, 'fail', 'undefined route');
    next(err, req, res, next);
});

app.use(GlobalHandler);

export default app;
