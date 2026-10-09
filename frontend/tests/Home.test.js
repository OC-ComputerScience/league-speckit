/**
 * Feature 11 — Manager Dashboard
 * Spec: features/feature-11-manager-dashboard.md
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import Home from "../src/views/Home.vue";
import PlayerForm from "../src/components/PlayerForm.vue";
import Utils from "../src/config/utils.js";
import teamServices from "../src/services/teamServices.js";
import seasonServices from "../src/services/seasonServices.js";
import gameServices from "../src/services/gameServices.js";
import peopleServices from "../src/services/peopleServices.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/teamServices.js", () => ({
  default: {
    getTeams: vi.fn(),
    updateTeam: vi.fn(),
    createPlayer: vi.fn(),
    updatePlayer: vi.fn(),
  },
}));

vi.mock("../src/services/seasonServices.js", () => ({
  default: {
    getSeasons: vi.fn(),
  },
}));

vi.mock("../src/services/gameServices.js", () => ({
  default: {
    getGames: vi.fn(),
    updateGame: vi.fn(),
  },
}));

vi.mock("../src/services/peopleServices.js", () => ({
  default: {
    getPeople: vi.fn(),
    createPerson: vi.fn(),
  },
}));

const managerUser = {
  userId: 3,
  username: "janedoe",
  role: "manager",
  token: "manager-token",
};

const adminUser = {
  userId: 1,
  username: "admin",
  role: "admin",
  token: "admin-token",
};

const janePerson = {
  id: 1,
  firstName: "Jane",
  lastName: "Doe",
};

const janePlayer = {
  id: 5,
  personId: 1,
  number: 10,
  position: "Forward",
  person: janePerson,
};

const strikers = {
  id: 1,
  name: "OKC Strikers",
  leagueId: 1,
  homeField: "Memorial Field",
  managerId: 1,
  league: { id: 1, name: "OKC Youth Soccer", sport: "soccer" },
  players: [],
};

const fallSeason = {
  id: 4,
  name: "2026 Fall",
  leagueId: 1,
  startDate: "2026-08-15",
};

const scoredGame = {
  id: 7,
  seasonId: 4,
  gameDate: "2026-09-12",
  startTime: "18:00:00",
  location: "Memorial Field",
  homeTeamId: 1,
  visitingTeamId: 2,
  homeTeamScore: 2,
  visitingTeamScore: 1,
  homeTeam: { id: 1, name: "OKC Strikers" },
  visitingTeam: { id: 2, name: "Tulsa FC" },
};

const unplayedGame = {
  ...scoredGame,
  homeTeamScore: null,
  visitingTeamScore: null,
};

const VDialogStub = {
  name: "VDialog",
  props: { modelValue: Boolean },
  template: `<div v-if="modelValue" class="v-dialog-stub"><slot /></div>`,
};

const clickExactButton = async (wrapper, label) => {
  const button = wrapper
    .findAll("button")
    .find((item) => item.text().trim() === label);
  expect(button).toBeTruthy();
  await button.trigger("click");
  await flushPromises();
};

const clickLastButton = async (wrapper, label) => {
  const buttons = wrapper
    .findAll("button")
    .filter((item) => item.text().trim() === label);
  expect(buttons.length).toBeGreaterThan(0);
  await buttons[buttons.length - 1].trigger("click");
  await flushPromises();
};

const fillPlayerForm = async (wrapper, overrides = {}) => {
  const form = wrapper.findComponent(PlayerForm);
  await form.setValue({
    personId: 1,
    position: "Forward",
    number: 10,
    ...overrides,
  });
};

const mountHome = async () => {
  const mounted = await mountWithPlugins(Home, {
    attachTo: document.body,
    global: {
      stubs: { VDialog: VDialogStub },
    },
  });
  await flushPromises();
  return mounted;
};

describe("Feature 11 — Manager Dashboard", () => {
  let wrapper;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    teamServices.getTeams.mockResolvedValue({ data: [strikers] });
    teamServices.updateTeam.mockResolvedValue({
      data: { ...strikers, name: "OKC United", homeField: "North Field" },
    });
    teamServices.createPlayer.mockResolvedValue({ data: janePlayer });
    teamServices.updatePlayer.mockResolvedValue({
      data: { message: "player updated successfully." },
    });
    seasonServices.getSeasons.mockResolvedValue({ data: [fallSeason] });
    gameServices.getGames.mockResolvedValue({ data: [scoredGame] });
    gameServices.updateGame.mockResolvedValue({
      data: { ...unplayedGame, homeTeamScore: 3, visitingTeamScore: 0 },
    });
    peopleServices.getPeople.mockResolvedValue({ data: [janePerson] });
    peopleServices.createPerson.mockResolvedValue({
      data: { id: 9, firstName: "Robert", lastName: "Smith" },
    });
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  describe("US-11.1 — Land on the manager dashboard after sign-in", () => {
    it("Manager sees the dashboard for the team they manage", async () => {
      Utils.setStore("user", managerUser);
      teamServices.getTeams.mockResolvedValue({
        data: [
          strikers,
          {
            id: 2,
            name: "Tulsa FC",
            leagueId: 1,
            homeField: "North Field",
            managerId: 1,
            league: { id: 1, name: "OKC Youth Soccer", sport: "soccer" },
            players: [],
          },
        ],
      });
      const mounted = await mountHome();
      wrapper = mounted.wrapper;

      expect(wrapper.text()).toContain("OKC Strikers");
      expect(wrapper.text()).toContain("OKC Youth Soccer");
      expect(wrapper.text()).toContain("Memorial Field");
    });

    it("Manager with no assigned team sees empty copy", async () => {
      Utils.setStore("user", managerUser);
      teamServices.getTeams.mockResolvedValue({ data: [] });
      const mounted = await mountHome();
      wrapper = mounted.wrapper;

      expect(wrapper.text()).toContain("No teams assigned.");
    });
  });

  describe("US-11.2 — Edit the managed team from the heading", () => {
    it("Manager edits team name and home field", async () => {
      Utils.setStore("user", managerUser);
      teamServices.getTeams
        .mockResolvedValueOnce({ data: [strikers] })
        .mockResolvedValue({
          data: [{ ...strikers, name: "OKC United", homeField: "North Field" }],
        });

      const mounted = await mountHome();
      wrapper = mounted.wrapper;

      await clickExactButton(wrapper, "Edit team");
      const fields = wrapper.find(".v-dialog-stub").findAll("input");
      await fields[0].setValue("OKC United");
      await fields[1].setValue("North Field");
      await clickExactButton(wrapper, "Save Team");

      expect(teamServices.updateTeam).toHaveBeenCalledWith(1, {
        name: "OKC United",
        homeField: "North Field",
      });
      expect(wrapper.text()).toContain("OKC United");
      expect(wrapper.text()).toContain("North Field");
      expect(wrapper.find(".v-dialog-stub").exists()).toBe(false);
    });
  });

  describe("US-11.3 — View season games for the managed team", () => {
    it("Manager lists games for a selected season", async () => {
      Utils.setStore("user", managerUser);
      const mounted = await mountHome();
      wrapper = mounted.wrapper;

      expect(wrapper.text()).toContain("2026-09-12");
      expect(wrapper.text()).toContain("18:00");
      expect(wrapper.text()).toContain("Tulsa FC");
      expect(wrapper.text()).toContain("Memorial Field");
      expect(wrapper.text()).toContain("2–1");
    });

    it("Manager sees empty games copy", async () => {
      Utils.setStore("user", managerUser);
      gameServices.getGames.mockResolvedValue({ data: [] });
      const mounted = await mountHome();
      wrapper = mounted.wrapper;

      expect(wrapper.text()).toContain("No games for this season.");
    });
  });

  describe("US-11.4 — Enter a game score", () => {
    it("Manager enters a game score", async () => {
      Utils.setStore("user", managerUser);
      gameServices.getGames
        .mockResolvedValueOnce({ data: [unplayedGame] })
        .mockResolvedValue({
          data: [{ ...unplayedGame, homeTeamScore: 3, visitingTeamScore: 0 }],
        });

      const mounted = await mountHome();
      wrapper = mounted.wrapper;

      await wrapper.get('[aria-label="Edit score"]').trigger("click");
      await flushPromises();
      const scoreInputs = wrapper.findAll('input[type="number"]');
      await scoreInputs[0].setValue("3");
      await scoreInputs[1].setValue("0");
      await clickExactButton(wrapper, "Save Score");

      expect(gameServices.updateGame).toHaveBeenCalledWith(7, {
        homeTeamScore: 3,
        visitingTeamScore: 0,
      });
      expect(wrapper.text()).toContain("3–0");
      expect(wrapper.find(".v-dialog-stub").exists()).toBe(false);
    });

    it("Manager submits an invalid score", async () => {
      Utils.setStore("user", managerUser);
      gameServices.getGames.mockResolvedValue({ data: [unplayedGame] });
      const mounted = await mountHome();
      wrapper = mounted.wrapper;

      await wrapper.get('[aria-label="Edit score"]').trigger("click");
      await flushPromises();
      const scoreInputs = wrapper.findAll('input[type="number"]');
      await scoreInputs[0].setValue("1000");
      await scoreInputs[1].setValue("0");
      await clickExactButton(wrapper, "Save Score");

      expect(gameServices.updateGame).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain("Score must be between 0 and 999.");
    });
  });

  describe("US-11.5 — Add and edit players on the dashboard", () => {
    it("Manager adds a player from the dashboard", async () => {
      Utils.setStore("user", managerUser);
      teamServices.getTeams
        .mockResolvedValueOnce({ data: [strikers] })
        .mockResolvedValue({
          data: [{ ...strikers, players: [janePlayer] }],
        });

      const mounted = await mountHome();
      wrapper = mounted.wrapper;

      await clickExactButton(wrapper, "Add");
      await fillPlayerForm(wrapper);
      await clickLastButton(wrapper, "Add");

      expect(teamServices.createPlayer).toHaveBeenCalledWith(1, {
        personId: 1,
        position: "Forward",
        number: 10,
      });
      expect(wrapper.text()).toContain("10");
      expect(wrapper.text()).toContain("Forward");
    });

    it("Manager adds a player with a new person", async () => {
      Utils.setStore("user", managerUser);
      const newPlayer = {
        id: 8,
        personId: 9,
        number: 7,
        position: "Goalkeeper",
        person: { id: 9, firstName: "Robert", lastName: "Smith" },
      };
      teamServices.getTeams
        .mockResolvedValueOnce({ data: [strikers] })
        .mockResolvedValue({
          data: [{ ...strikers, players: [newPlayer] }],
        });

      const mounted = await mountHome();
      wrapper = mounted.wrapper;

      await clickExactButton(wrapper, "Add");
      await fillPlayerForm(wrapper, {
        personId: "add-person",
        firstName: "Robert",
        lastName: "Smith",
        email: "robert.smith@example.com",
        birthDate: "1990-05-15",
        gender: "male",
        number: 7,
        position: "Goalkeeper",
      });
      await clickLastButton(wrapper, "Add");

      expect(peopleServices.createPerson).toHaveBeenCalledWith({
        firstName: "Robert",
        lastName: "Smith",
        email: "robert.smith@example.com",
        birthDate: "1990-05-15",
        gender: "male",
      });
      expect(teamServices.createPlayer).toHaveBeenCalledWith(1, {
        personId: 9,
        position: "Goalkeeper",
        number: 7,
      });
      expect(wrapper.text()).toContain("7");
      expect(wrapper.text()).toContain("Goalkeeper");
    });

    it("Manager edits a player from the dashboard", async () => {
      Utils.setStore("user", managerUser);
      teamServices.getTeams
        .mockResolvedValueOnce({
          data: [{ ...strikers, players: [janePlayer] }],
        })
        .mockResolvedValue({
          data: [
            {
              ...strikers,
              players: [{ ...janePlayer, position: "Midfield" }],
            },
          ],
        });

      const mounted = await mountHome();
      wrapper = mounted.wrapper;

      await wrapper.get('[aria-label="Edit player"]').trigger("click");
      await flushPromises();
      await fillPlayerForm(wrapper, { position: "Midfield" });
      await clickExactButton(wrapper, "Save Player");

      expect(teamServices.updatePlayer).toHaveBeenCalled();
      expect(wrapper.text()).toContain("Midfield");
    });
  });

  describe("US-11.6 — Restrict the dashboard and manager writes", () => {
    it("Admin home is not the manager dashboard", async () => {
      Utils.setStore("user", adminUser);
      const mounted = await mountHome();
      wrapper = mounted.wrapper;

      expect(wrapper.text()).toContain("League Management System");
      expect(wrapper.text()).not.toContain("Edit score");
      expect(teamServices.getTeams).not.toHaveBeenCalled();
    });
  });
});
