const bcrypt = require('bcrypt');
const saltRounds = 10;
const  hashPassword = async (password)=> {
  try {
    const hash = await bcrypt.hash(password, saltRounds);
    return hash;
  } catch (err) {
    throw new Error('Error hashing password: ' + err.message);
  }
}
const bcryptVerifyPassword = async (hashedPassword, userPassword) => {
  try {
    const match = await bcrypt.compare(userPassword, hashedPassword);
    return match;
  } catch (err) {
    throw new Error('Error verifying password: ' + err.message);
  }
}

module.exports = {
  hashPassword, 
  bcryptVerifyPassword
};