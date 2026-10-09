/**
 * Feature 10 — User Password Management
 * Spec: features/feature-10-user-password-management.md
 */
import bcrypt from "bcryptjs";
import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import {
  syncTestDatabase,
  registerUser,
  registerAdmin,
  loginUser,
  authHeader,
} from "./helpers.js";

describe("Feature 10 — User Password Management", () => {
  beforeEach(async () => {
    await syncTestDatabase();
  });

  describe("US-10.3 — Change a user's password on the user edit page", () => {
    it("Admin changes a user password and that user can sign in", async () => {
      const { token } = await registerAdmin(app);
      const { response: jdoeResponse } = await registerUser(app);
      const userId = jdoeResponse.body.userId;
      const previousHash = (await db.user.unscoped().findByPk(userId)).password;

      const response = await request(app)
        .put(`/league/users/${userId}`)
        .set(authHeader(token))
        .send({ password: "newpass123" });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: userId,
        username: "jdoe",
      });
      expect(response.body.password).toBeUndefined();

      const stored = await db.user.unscoped().findByPk(userId);
      expect(stored.password).not.toBe(previousHash);
      expect(stored.password).not.toBe("password123");
      expect(await bcrypt.compare("newpass123", stored.password)).toBe(true);

      const newLogin = await loginUser(app, {
        username: "jdoe",
        password: "newpass123",
      });
      expect(newLogin.status).toBe(200);

      const oldLogin = await loginUser(app, {
        username: "jdoe",
        password: "password123",
      });
      expect(oldLogin.status).toBe(401);
      expect(oldLogin.body).toEqual({
        message: "Invalid username or password.",
      });
    });

    it("Admin changes the password of a user that does not exist", async () => {
      const { token } = await registerAdmin(app);

      const response = await request(app)
        .put("/league/users/99999")
        .set(authHeader(token))
        .send({ password: "newpass123" });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        message: "User with id=99999 not found.",
      });
    });
  });

  describe("US-10.4 — Restrict user password change to admins", () => {
    it("Manager cannot change a user password via the API", async () => {
      await registerAdmin(app);
      const { response: jdoeResponse } = await registerUser(app);
      const { response: managerResponse } = await registerUser(app, {
        username: "mgr",
        email: "mgr@example.com",
      });
      const previousHash = (
        await db.user.unscoped().findByPk(jdoeResponse.body.userId)
      ).password;

      const response = await request(app)
        .put(`/league/users/${jdoeResponse.body.userId}`)
        .set(authHeader(managerResponse.body.token))
        .send({ password: "newpass123" });

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ message: "Admin role required." });

      const stored = await db.user.unscoped().findByPk(jdoeResponse.body.userId);
      expect(stored.password).toBe(previousHash);
    });

    it("Unauthenticated API request to change a user password", async () => {
      const response = await request(app)
        .put("/league/users/2")
        .send({ password: "newpass123" });

      expect(response.status).toBe(401);
    });
  });
});
