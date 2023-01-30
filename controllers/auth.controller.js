import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import AppError from '../utils/error.util.js';
import Account from '../models/account.model.js';

const register = async (req, res, next) => {
    try {
        const { phone_number, password, rule } = req.body;

        if (phone_number && password) {
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

            //create payload
            const account_id = { account_id: account._id };

            const accessToken = jwt.sign(
                account_id,
                process.env.ACCESS_TOKEN_SECRET
            );

            res.status(201).json({
                status: 'success',
                data: {
                    accessToken,
                },
            });
        } else {
            return next(
                new AppError(400, 'fail', 'Vui lòng nhập đầy đủ thông tin'),
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
                new AppError(400, 'fail', 'Vui lòng nhập đầy đủ thông tin'),
                req,
                res,
                next
            );
        }

        if (!phone_number) {
            return next(
                new AppError(400, 'fail', 'Vui lòng nhập số điện thoại'),
                req,
                res,
                next
            );
        }

        if (!password) {
            return next(
                new AppError(400, 'fail', 'Vui lòng nhập mật khẩu'),
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
                        'fail',
                        'Tài khoản hoặc mật khẩu bạn nhập không chính xác'
                    )
                ),
                req,
                res,
                next
            );
        }

        //create payload
        const account_id = { account_id: account.id };
        //create token
        const accessToken = jwt.sign(
            account_id,
            process.env.ACCESS_TOKEN_SECRET
        );

        res.status(200).json({
            status: 'success',
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
        return next(new AppError(401, 'fail', 'No token')), req, res, next;

    const verify = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    //check verify
    if (verify?.error) {
        return next(new AppError(401, 'fail', 'JWT malformed')), req, res, next;
    }

    const account = await Account.findById(verify.account_id);
    if (account) {
        req.rule = account.rule;
        req.account_id = account._id;

        next();
    } else {
        return next(new AppError(401, 'fail', 'Token fail')), req, res, next;
    }
};

export default {
    register,
    login,
    authentication,
};
