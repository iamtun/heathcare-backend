import mongoose from "mongoose";
import env from "dotenv";
import app from "./app.js";
import Account from "./models/account.model.js";
import Person from "./models/person.model.js";
import Patient from "./models/patient.model.js";

env.config({
    path: "./dev.env",
});

mongoose.set("strictQuery", false);
mongoose
    .connect(process.env.DB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then((connect) => console.log("db connected!"))
    .catch((err) => console.error("connect fail by ", err));

//test
// const account = await Account.create({
//     phone_number: "+84343220597",
//     password: "123456",
// });
// const person = await Person.create({account_id: account._id, username: 'Lê Tuấn', address: '275 QT', gender: true, dob: new Date()});
// const patient = await Patient.create({person: person._id, blood: 'O'});
// const patient = await Patient.findById('63bd87f418bb2d4de6661bb5').populate('person');
// console.log(patient);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => console.log(`app is running on port -> ${PORT}`));
