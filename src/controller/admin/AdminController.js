const AdminService = require("../../service/admin/AdminService");

module.exports = {
  createAdmin: async (req, res) => {
    try {
      const result = await AdminService.createAdmin(req.body);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  adminLogin: async (req, res) => {
    try {
      const { token, refreshToken, admin } = await AdminService.adminLogin(
        req.body
      );

      // res.cookie("accessToken", token, {
      //   httpOnly: true,
      //   secure: false,
      //   sameSite: "lax",
      //   maxAge: 15 * 60 * 1000,
      // });

      // res.cookie("refreshToken", refreshToken, {
      //   httpOnly: true,
      //   secure: false,
      //   sameSite: "lax",
      //   maxAge: 7 * 24 * 60 * 60 * 1000,
      // });


      res.status(200).json({
        message: "Login successful",
        token,
        refreshToken,
        admin
      });
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  },

  adminLogout: async (req, res) => {
    try {
      res.clearCookie("accessToken", {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
      });

      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
      });
      res.status(200).json({ message: "Logout successful" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getAllAdmins: async (req, res) => {
    try {
      const admins = await AdminService.getAllAdmins();
      res.json(admins);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getAdminById: async (req, res) => {
    try {
      const admin = await AdminService.getAdminById(req.params.id);
      res.json(admin);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },

  updateAdmin: async (req, res) => {
    try {
      const admin = await AdminService.updateAdmin(req.params.id, req.body);
      res.json(admin);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  deleteAdmin: async (req, res) => {
    try {
      const result = await AdminService.deleteAdmin(req.params.id);
      res.json(result);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },

  getProfile: async (req, res) => {
    try {
      res.json({ admin: req.user });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  refreshToken: async (req, res) => {
    try {
      const { verifyRefreshToken, generateToken } = require('../../utils/auth');
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        return res.status(401).json({ error: 'Refresh token missing' });
      }
      const payload = verifyRefreshToken(refreshToken);
      if (!payload) {
        return res.status(403).json({ error: 'Invalid refresh token' });
      }
      const token = generateToken({ id: payload.id, email: payload.email });
      res.cookie("accessToken", token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 15 * 60 * 1000,
      });

      res.status(200).json({ message: 'Token refreshed' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }, 
};
