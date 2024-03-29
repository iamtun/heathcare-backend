import Account from '../../models/auth/account.model.js';
import Person from '../../models/person.model.js';
import Doctor from '../../models/doctor/doctor.model.js';
import Profile from '../../models/doctor/profile.model.js';

import AppError from '../../utils/error.util.js';
import Base from '../utils/base.controller.js';
import {
    MESSAGE_NO_ENOUGH_IN_4,
    STATUS_FAIL,
    STATUS_SUCCESS,
} from '../../common/constant.js';
import bcrypt from 'bcryptjs';
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
                                                status: STATUS_SUCCESS,
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
                                    STATUS_FAIL,
                                    `profile with doctor id = ${doctor._id} not found!`
                                )
                            );
                        }
                    } else {
                        return next(
                            new AppError(
                                404,
                                STATUS_FAIL,
                                `doctor with person id = ${person._id} not found!`
                            )
                        );
                    }
                } else {
                    return next(
                        new AppError(
                            404,
                            STATUS_FAIL,
                            `person with account id = ${account._id} not found!`
                        )
                    );
                }
            } else {
                return next(
                    new AppError(
                        401,
                        STATUS_FAIL,
                        `type account un support deleted!`
                    )
                );
            }
        } else {
            return next(
                new AppError(
                    404,
                    STATUS_FAIL,
                    `account with phone number ${phone_number} not found!`
                )
            );
        }
    } else {
        return next(new AppError(400, STATUS_FAIL, 'No phone number'));
    }
};

const getAccountByPhoneNumber = async (req, res, next) => {
    const { phone } = req.params;
    const account = await Account.findOne({ phone_number: phone });
    if (account) {
        return res.status(200).json({
            status: STATUS_SUCCESS,
            data: {
                rule: account.rule,
                is_exist: true,
            },
        });
    }

    return res.status(404).json({
        status: STATUS_FAIL,
        data: {
            is_exist: false,
        },
    });
};

const forgotPassword = async (req, res, next) => {
    const { phone_number, password } = req.body;

    try {
        if (phone_number) {
            const account = await Account.findOne({
                phone_number: phone_number,
            });

            if (account) {
                const _password = await bcrypt.hash(password, 12);
                account.password = _password;

                const _account = await account.save();
                if (_account) {
                    return res.status(201).json({
                        status: STATUS_SUCCESS,
                        message:
                            'Mật khẩu của bạn đã được cập nhật thành công!',
                    });
                } else {
                    return res.status(400).json({
                        status: STATUS_SUCCESS,
                        message: 'Mật khẩu của bạn đã được cập nhật thất bại!',
                    });
                }
            } else {
                return next(
                    new AppError(
                        404,
                        STATUS_FAIL,
                        `Tải khoản với số điện thoại: ${phone_number} không tồn tại!`
                    )
                );
            }
        }

        return next(new AppError(400, STATUS_FAIL, MESSAGE_NO_ENOUGH_IN_4));
    } catch (error) {
        return next(error);
    }
};

export default {
    getAccount,
    getAllAccount,
    removeAccount,
    getAccountByPhoneNumber,
    forgotPassword,
};
