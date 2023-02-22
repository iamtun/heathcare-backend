import express from 'express';
import NotificationController from '../controllers/utils/notification.controller.js';
const router = express.Router();

router
    .route('/')
    .post(NotificationController.createNotification)
    .get(NotificationController.getAllNotifications)
    .put(NotificationController.updateSeenNotifications);

router.route('/:id').get(NotificationController.findNotificationsByReceiverId);

export default router;
