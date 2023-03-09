import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import AppError from '../../utils/error.util.js';
import Account from '../../models/account.model.js';
import {
    MESSAGE_NO_ENOUGH_IN_4,
    RULE_PATIENT,
    STATUS_FAIL,
    STATUS_SUCCESS,
} from '../../common/constant.js';
import Person from '../../models/person.model.js';
import Patient from '../../models/patient.model.js';
import Doctor from '../../models/doctor.model.js';

const register = async (req, res, next) => {
    try {
        const { phone_number, password, rule } = req.body;

        if (phone_number && password) {
            const account = await Account.findOne({
                phone_number: phone_number,
            });
            if (account) {
                return next(
                    new AppError(
                        400,
                        STATUS_FAIL,
                        'Tài khoản đã tồn tại, vui lòng chọn đăng nhập'
                    ),
                    req,
                    res,
                    next
                );
            } else {
                //decode password
                const _password = await bcrypt.hash(password, 12);
                let account;
                if (rule) {
                    account = await Account.create({
                        phone_number: phone_number,
                        password: _password,
                        rule: rule,
                    });
                } else {
                    account = await Account.create({
                        phone_number: phone_number,
                        password: _password,
                    });
                }

                const person = await Person.findOne({ account: account._id });
                let user_info = null;

                const patient = await Patient.findOne({
                    person: person._id,
                }).populate('person');

                if (patient) {
                    user_info = {
                        user_id: patient._id,
                        username: patient['person']['username'],
                    };
                } else {
                    const doctor = await Doctor.findOne({
                        person: person._id,
                    }).populate('person');
                    user_info = {
                        user_id: doctor._id,
                        username: doctor['person']['username'],
                    };
                }

                //create payload
                const token = {
                    account_id: account.id,
                    ...user_info,
                };

                //create token
                const accessToken = jwt.sign(
                    token,
                    process.env.ACCESS_TOKEN_SECRET
                );

                res.status(201).json({
                    status: STATUS_SUCCESS,
                    data: {
                        accessToken,
                    },
                });
            }
        } else {
            return next(
                new AppError(400, STATUS_FAIL, MESSAGE_NO_ENOUGH_IN_4),
                req,
                res,
                next
            );
        }
    } catch (error) {
        next(error);
    }
};

const comparePassword = async (password, account) => {
    const originPass = account.password;
    return await bcrypt.compare(password, originPass);
};

const login = async (req, res, next) => {
    try {
        const { phone_number, password } = req.body;
        //check user send phone_number & password
        if (!phone_number && !password) {
            return next(
                new AppError(400, STATUS_FAIL, MESSAGE_NO_ENOUGH_IN_4),
                req,
                res,
                next
            );
        }

        if (!phone_number) {
            return next(
                new AppError(400, STATUS_FAIL, MESSAGE_NO_ENOUGH_IN_4),
                req,
                res,
                next
            );
        }

        if (!password) {
            return next(
                new AppError(400, STATUS_FAIL, MESSAGE_NO_ENOUGH_IN_4),
                req,
                res,
                next
            );
        }

        const account = await Account.findOne({ phone_number }).select(
            '+password'
        );

        if (!account || !(await comparePassword(password, account))) {
            return (
                next(
                    new AppError(
                        404,
                        STATUS_FAIL,
                        'Tài khoản hoặc mật khẩu bạn nhập không chính xác'
                    )
                ),
                req,
                res,
                next
            );
        }

        const person = await Person.findOne({ account: account._id });
        let user_info = null;

        const patient = await Patient.findOne({
            person: person._id,
        }).populate('person');

        if (patient) {
            user_info = {
                user_id: patient._id,
                username: patient['person']['username'],
            };
        } else {
            const doctor = await Doctor.findOne({
                person: person._id,
            }).populate('person');
            user_info = {
                user_id: doctor._id,
                username: doctor['person']['username'],
            };
        }

        //create payload
        const token = {
            account_id: account.id,
            ...user_info,
        };

        //create token
        const accessToken = jwt.sign(token, process.env.ACCESS_TOKEN_SECRET);

        res.status(200).json({
            status: STATUS_SUCCESS,
            data: {
                accessToken: accessToken,
            },
        });
    } catch (error) {
        next(error);
    }
};

const authentication = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; //Bear token
    if (!token)
        return next(new AppError(401, STATUS_FAIL, 'No token')), req, res, next;

    const verify = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    //check verify
    if (verify?.error) {
        return (
            next(new AppError(401, STATUS_FAIL, 'JWT malformed')),
            req,
            res,
            next
        );
    }

    const account = await Account.findById(verify.account_id);
    if (account) {
        req.rule = account.rule;
        req.account_id = account._id;

        next();
    } else {
        return (
            next(new AppError(401, STATUS_FAIL, 'Token fail')), req, res, next
        );
    }
};

export default {
    register,
    login,
    authentication,
};
