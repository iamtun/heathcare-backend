import Account from '../models/account.model.js';
import Person from '../models/person.model.js';
import AppError from '../utils/error.util.js';
import Base from './utils/base.controller.js';

const getAllAccount = Base.getAll(Account);
const getAccount = Base.getOne(Account);

const removeAccount = async (req, res, next) => {
    const { phone_number } = req.body;

    if (phone_number) {
        const account = await Account.findOne({ phone_number });
        // const person
        if (account) {
            if (account.rule === 'doctor') {
                const person = await Person.findOne({ account: account._id });
                if (person) {
                    res.status(200).json({
                        status: 'success',
                        message: `deleted account with id = ${account.id} success!`,
                    });
                }
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
