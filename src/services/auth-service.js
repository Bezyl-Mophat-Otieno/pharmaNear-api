const { RoleEnum } = require("../db/enums");
const UserRepository = require("../db/repositories/user-repository");

class AuthService  {
  async findOrCreateGoogleUser(googleUser) {
    const { email, name } = googleUser;

    let user = await UserRepository.findByEmail(email);
    if (user) return user;

    user = await UserRepository.createUser({ name, email, role: RoleEnum.customer });

    return user;
  }
  async authenticateAdmin(email, userPassword) {
    const user = await UserRepository.findByEmail(email);
    if (!user || ![RoleEnum.admin, RoleEnum.superadmin].includes(user.role)) {
      return null;
    }

    // Check if user is suspended
    if (user.status === 'suspended') {
      throw new Error('Account is suspended. Please contact an administrator.');
    }

    const isPasswordValid = await UserRepository.verifyPassword(user.password, userPassword);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async authenticateUser(email, password) {
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      return null;
    }
    const isPasswordValid = await UserRepository.verifyPassword(user.id, password);
    if (!isPasswordValid) {
      return null;
    }
    return user;
  }

  async resetPassword(email, newPassword) {
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      return null;
    }
    const updatedUser = await UserRepository.updatePassword(user.id, newPassword);
    return updatedUser;
  }
};

module.exports = new AuthService;
