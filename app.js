import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import AppError from './utils/error.util.js';
import GlobalHandler from './controllers/utils/error.controller.js';

import AuthRouters from './routers/auth.router.js';
import PatientRouters from './routers/patient.router.js';
import DoctorRouters from './routers/doctor.router.js';
import AccountRouters from './routers/account.router.js';
import ShiftRouters from './routers/shift.router.js';
import DayRouters from './routers/day.router.js';
import ScheduleRouters from './routers/schedule.router.js';
import BMIRouters from './routers/bmi.router.js';
import GlycemicRouters from './routers/glycemic.router.js';
import ScheduleDetailRouters from './routers/schedule_detail.router.js';
import ConversationRouters from './routers/conversation.router.js';
import MessageRouters from './routers/message.router.js';
import RuleRouters from './routers/rule.router.js';
import NotificationRouters from './routers/notification.router.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api/v1/auth', AuthRouters);
app.use('/api/v1/patients', PatientRouters);
app.use('/api/v1/doctors', DoctorRouters);
app.use('/api/v1/accounts', AccountRouters);
app.use('/api/v1/shifts', ShiftRouters);
app.use('/api/v1/days', DayRouters);
app.use('/api/v1/schedules', ScheduleRouters);
app.use('/api/v1/bmis', BMIRouters);
app.use('/api/v1/glycemics', GlycemicRouters);
app.use('/api/v1/schedule-details', ScheduleDetailRouters);
app.use('/api/v1/conversations', ConversationRouters);
app.use('/api/v1/messages', MessageRouters);
app.use('/api/v1/rules', RuleRouters);
app.use('/api/v1/notifications', NotificationRouters);

app.use('*', (req, res, next) => {
    const err = new AppError(404, 'fail', 'undefined route');
    next(err, req, res, next);
});

app.use(GlobalHandler);

export default app;
