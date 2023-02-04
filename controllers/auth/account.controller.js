import Account from '../../models/account.model.js';
import Person from '../../models/person.model.js';
import Doctor from '../../models/doctor.model.js';
import Profile from '../../models/profile.model.js';

import AppError from '../../utils/error.util.js';
import Base from '../utils/base.controller.js';

const getAllAccount = Base.getAll(Account);
const getAccount = Base.getOne(Account);

const removeAccount = async (req, res, next) => {
    const { phone_number } = req.body;

    if (phone_number) {
        const account = await Account.findOne({ phone_number });
        if (account) {
            if (account.rule === 'doctor') {
                const person = await Person.findOne({ account: account._id });
                if (person) {
                    const doctor = await Doctor.findOne({ person: person._id });

                    if (doctor) {
                        const profile = await Profile.findOne({
                            doctor: doctor._id,
                        });

                        if (profile) {
                            const profileDeleted = await Profile.deleteOne({
                                _id: profile._id,
                            });

                            if (profileDeleted.acknowledged) {
                                const doctorDeleted = await Doctor.deleteOne({
                                    _id: doctor._id,
                                });

                                if (doctorDeleted.acknowledged) {
                                    const personDeleted =
                                        await Person.deleteOne({
                                            _id: person._id,
                                        });

                                    if (personDeleted.acknowledged) {
                                        const accountDeleted =
                                            await Account.deleteOne({
                                                _id: account._id,
                                            });

                                        if (accountDeleted.acknowledged) {
                                            res.status(200).json({
                                                status: 'success',
                                                message: `account with phone_number = ${phone_number} deleted!`,
                                            });
                                        }
                                    }
                                }
                            }
                        } else {
                            return next(
                                new AppError(
                                    404,
                                    'fail',
                                    `profile with doctor id = ${doctor._id} not found!`
                                )
                            );
                        }
                    } else {
                        return next(
                            new AppError(
                                404,
                                'fail',
                                `doctor with person id = ${person._id} not found!`
                            )
                        );
                    }
                } else {
                    return next(
                        new AppError(
                            404,
                            'fail',
                            `person with account id = ${account._id} not found!`
                        )
                    );
                }
            } else {
                return next(
                    new AppError(
                        401,
                        'fail',
                        `type account un support deleted!`
                    )
                );
            }
        } else {
            return next(
                new AppError(
                    404,
                    'fail',
                    `account with phone number ${phone_number} not found!`
                )
            );
        }
    } else {
        return next(new AppError(400, 'fail', 'No phone number'));
    }
};
export default { getAccount, getAllAccount, removeAccount };
