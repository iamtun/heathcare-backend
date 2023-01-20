import Person from '../models/person.model.js';

const createPerson = async (person) => {
    let personModel = null;
    let error = null;
    try {
        personModel = await Person.create(person);
    } catch (err) {
        error = err.message;
    }

    return { personModel, error };
};

const updatePerson = async (newPerson, id) => {
    let oldPerson = null;
    let _error = null;
    try {
        oldPerson = await Person.findById(id);

        oldPerson.username = newPerson.username || oldPerson.username;
        oldPerson.dob = newPerson.dob || oldPerson.dob;
        oldPerson.address = newPerson.address || oldPerson.address;
        oldPerson.avatar = newPerson.avatar || oldPerson.avatar;

        oldPerson = await oldPerson.save();
    } catch (error) {
        _error = error;
    }

    return { oldPerson, error: _error };
};
export { createPerson, updatePerson };
