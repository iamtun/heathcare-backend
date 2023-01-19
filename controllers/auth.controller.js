import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import AppError from '../utils/error.util.js';
import Account from '../models/account.model.js';

const register = async (req, res, next) => {
    try {
        const { phone_number, password, rule } = req.body;
        console.log(phone_number, password, rule);
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
        if (!phone_number || !password) {
            return next(
                new AppError(
                    401,
                    'fail',
                    'Please provide phone_number or password'
                ),
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
                        401,
                        'fail',
                        'Phone_number or Password is wrong'
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
                token: accessToken,
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
    req.rule = account.rule;
    req.account_id = account._id;

    next();
};

export default {
    register,
    login,
    authentication,
};
