const Admin = require('../../model/admin/Admin');
const { hashPassword, comparePassword } = require('../../utils/password');
const { generateToken, generateRefreshToken } = require('../../utils/auth');
const e = require('express');


class AdminService {
  static async createAdmin({ email, name, password }) {
    try {
      if (!email || !name || !password) {
        throw new Error("Email, name, and password are required");
      }
      const existingAdmin = await Admin.findOne({ where: { email } });
      if (existingAdmin) {
        throw new Error("Admin with this email already exists");
      }

      const hashedPassword = await hashPassword(password);
      const newAdmin = await Admin.create({
        email,
        name,
        password: hashedPassword,
      });

      return newAdmin;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  static async adminLogin({ email, password }) {
    try {
      if (!email || !password) {
        throw new Error("Email and password are required");
      }

      const admin = await Admin.findOne({ where: { email } });
      if (!admin) {
        throw new Error("No Admin exists with this email");
      }

      const validPassword = await comparePassword(password, admin.password);
      if (!validPassword) {
        throw new Error("Invalid password");
      }

    const token = generateToken({ id: admin.id, email: admin.email });
    const refreshToken = generateRefreshToken({ id: admin.id, email: admin.email });

    return {
      token,
      refreshToken,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      },
    };
    }catch (error) {

      throw new Error(error.message);
    }
  }

  static async getAllAdmins() {
    const admins = await Admin.findAll({
      attributes: { exclude: ["password"] },
    });
    return admins;
  }

  static async getAdminById(id) {
    try {
      const admin = await Admin.findByPk(id, {
        attributes: { exclude: ["password"] },
      });
      return admin;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  static async updateAdmin(id, { email, name, password }) {
    try {
      const admin = await Admin.findByPk(id);
      if (!admin) {
        throw new Error("Admin not found");
      }

      if (email) admin.email = email;
      if (name) admin.name = name;
      if (password) admin.password = await hashPassword(password);

      await admin.save();

      return admin;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  static async deleteAdmin(id) {
    try {
      const admin = await Admin.findByPk(id);
      if (!admin) {
        throw new Error("Admin not found");
      }
      await admin.destroy();
      return { message: "Admin deleted successfully" };
    } catch (error) {
      throw new Error(error.message);
    }
  }
}

module.exports = AdminService;

