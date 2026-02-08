const UserRepository = require("../db/repositories/user-repository");
class UserService {
  async fetchPaginatedUsers(page, limit, role) {
    return await UserRepository.getUsers(page, limit, role);
  }
  async deleteUserById(userId) {
    return await UserRepository.deleteUser(userId);
  }
  async suspendUser(userId) {
    return await UserRepository.suspendUser(userId);
  }
  async reactivateUser(userId) {
    return await UserRepository.reactivateUser(userId);
  }
};

module.exports = new UserService;
