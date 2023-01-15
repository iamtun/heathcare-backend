import mongoose, { Schema } from "mongoose";
import validator from "validator";

const accountSchema = new Schema(
    {
        phone_number: {
            type: String,
            require: [true, "Please fill your phone number"],
            unique: true,
            lowercase: true,
            // validate: [validator.isMobilePhone('vi-VN'), "Please provide a valid email"],
        },
        password: {
            type: String,
            select:false,
            require: [true, "Please fill your password"],
        },
        rule: {
            type: String,
            default: 'patient',
        }
    }
);

const Account = mongoose.model("accounts", accountSchema);
export default Account;
