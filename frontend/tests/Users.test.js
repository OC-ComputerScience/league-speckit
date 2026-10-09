/**
 * Feature 10 — User Password Management
 * Spec: features/feature-10-user-password-management.md
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import Users from "../src/views/Users.vue";
import userServices from "../src/services/userServices.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/userServices.js", () => ({
  default: {
    getUsers: vi.fn(),
    getUser: vi.fn(),
    updateUser: vi.fn(),
  },
}));

const jdoeUser = {
  id: 2,
  username: "jdoe",
  fName: "Jane",
  lName: "Doe",
};

const jdoeDetail = {
  id: 2,
  fName: "Jane",
  lName: "Doe",
  email: "jdoe@example.com",
  username: "jdoe",
  role: "manager",
};

const VDialogStub = {
  name: "VDialog",
  props: { modelValue: Boolean },
  template: `<div v-if="modelValue" class="v-dialog-stub"><slot /></div>`,
};

const clickButton = async (wrapper, label) => {
  const button = wrapper.findAll("button").find((item) => item.text().includes(label));
  expect(button).toBeTruthy();
  await button.trigger("click");
  await flushPromises();
};

const fillPasswords = async (wrapper, password, confirm) => {
  const inputs = wrapper.findAll('input[autocomplete="new-password"]');
  await inputs[0].setValue(password);
  await inputs[1].setValue(confirm);
};

const mountUsers = async () => {
  const mounted = await mountWithPlugins(Users, {
    attachTo: document.body,
    global: {
      stubs: { VDialog: VDialogStub },
    },
  });
  await flushPromises();
  return mounted;
};

const openEditUser = async (wrapper) => {
  await wrapper.get('[aria-label="Edit user"]').trigger("click");
  await flushPromises();
};

describe("Feature 10 — User Password Management", () => {
  let wrapper;

  beforeEach(() => {
    vi.clearAllMocks();
    userServices.getUsers.mockResolvedValue({ data: [] });
    userServices.getUser.mockResolvedValue({ data: jdoeDetail });
    userServices.updateUser.mockResolvedValue({ data: jdoeDetail });
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  describe("US-10.2 — View users", () => {
    it("Users view loads with existing users", async () => {
      userServices.getUsers.mockResolvedValue({ data: [jdoeUser] });
      const mounted = await mountUsers();
      wrapper = mounted.wrapper;

      expect(wrapper.text()).toContain("jdoe");
    });

    it("Users view with no users shows empty copy", async () => {
      const mounted = await mountUsers();
      wrapper = mounted.wrapper;

      expect(wrapper.text()).toContain("No users yet.");
    });
  });

  describe("US-10.3 — Change a user's password on the user edit page", () => {
    it("Admin submits a password that is too short", async () => {
      userServices.getUsers.mockResolvedValue({ data: [jdoeUser] });
      const mounted = await mountUsers();
      wrapper = mounted.wrapper;

      await openEditUser(wrapper);
      await fillPasswords(wrapper, "short", "short");
      await clickButton(wrapper, "Save");

      expect(userServices.updateUser).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain("Password must be at least 8 characters.");
    });

    it("Admin submits mismatched passwords", async () => {
      userServices.getUsers.mockResolvedValue({ data: [jdoeUser] });
      const mounted = await mountUsers();
      wrapper = mounted.wrapper;

      await openEditUser(wrapper);
      await fillPasswords(wrapper, "newpass123", "otherpass");
      await clickButton(wrapper, "Save");

      expect(userServices.updateUser).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain("Passwords do not match.");
    });

    it("Admin submits an empty password", async () => {
      userServices.getUsers.mockResolvedValue({ data: [jdoeUser] });
      const mounted = await mountUsers();
      wrapper = mounted.wrapper;

      await openEditUser(wrapper);
      await clickButton(wrapper, "Save");

      expect(userServices.updateUser).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain("Password is required.");
    });
  });
});
