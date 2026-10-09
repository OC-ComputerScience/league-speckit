<script setup>
import { computed, onMounted, ref, watch } from "vue";
import teamServices from "../services/teamServices.js";
import seasonServices from "../services/seasonServices.js";
import gameServices from "../services/gameServices.js";
import peopleServices from "../services/peopleServices.js";
import PlayerForm from "./PlayerForm.vue";

const emptyTeamForm = () => ({
  name: "",
  homeField: "",
});

const emptyPlayerForm = () => ({
  personId: null,
  position: "",
  number: "",
  firstName: "",
  lastName: "",
  email: "",
  birthDate: "",
  gender: "",
});

const emptyScoreForm = () => ({
  homeTeamScore: "",
  visitingTeamScore: "",
});

const teams = ref([]);
const selectedTeamId = ref(null);
const seasons = ref([]);
const selectedSeasonId = ref(null);
const games = ref([]);
const people = ref([]);
const loading = ref(false);
const listError = ref("");

const teamFormOpen = ref(false);
const teamForm = ref(emptyTeamForm());
const teamFormRef = ref(null);
const teamFormError = ref("");
const savingTeam = ref(false);

const scoreDialogOpen = ref(false);
const scoreForm = ref(emptyScoreForm());
const scoreFormRef = ref(null);
const scoreFormError = ref("");
const savingScore = ref(false);
const scoringGame = ref(null);

const playerDialogOpen = ref(false);
const isAddPlayerMode = ref(true);
const playerForm = ref(emptyPlayerForm());
const playerFormRef = ref(null);
const playerFormError = ref("");
const savingPlayer = ref(false);
const editingPlayerId = ref(null);

const sameId = (left, right) =>
  left != null && right != null && Number(left) === Number(right);

const selectedTeam = computed(
  () =>
    teams.value.find((team) => sameId(team.id, selectedTeamId.value)) ??
    teams.value[0] ??
    null
);
const leagueSeasons = computed(() => {
  if (!selectedTeam.value) {
    return [];
  }

  return seasons.value.filter((season) =>
    sameId(season.leagueId, selectedTeam.value.leagueId)
  );
});
const teamGames = computed(() => {
  if (!selectedTeam.value || !selectedSeasonId.value) {
    return [];
  }

  return games.value.filter(
    (game) =>
      sameId(game.seasonId, selectedSeasonId.value) &&
      (sameId(game.homeTeamId, selectedTeam.value.id) ||
        sameId(game.visitingTeamId, selectedTeam.value.id))
  );
});
const rosterPlayers = computed(() => selectedTeam.value?.players ?? []);
const playerFormTitle = computed(() =>
  isAddPlayerMode.value ? "Add Player" : "Edit Player"
);
const playerSaveLabel = computed(() =>
  isAddPlayerMode.value ? "Add" : "Save Player"
);

const nameRules = [
  (value) => !!value?.trim() || "Required",
  (value) =>
    (value?.trim().length ?? 0) <= 50 ||
    "Team name must be 50 characters or fewer.",
];
const homeFieldRules = [
  (value) => !!value?.trim() || "Required",
  (value) =>
    (value?.trim().length ?? 0) <= 50 ||
    "Home field must be 50 characters or fewer.",
];
const scoreRules = [
  (value) =>
    (value !== undefined && value !== null && String(value).trim() !== "") ||
    "Required",
  (value) => {
    const parsed = parseInt(value, 10);
    return (
      (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 999) ||
      "Score must be between 0 and 999."
    );
  },
];

const playerName = (player) => {
  const lastName = player.person?.lastName ?? "";
  const firstName = player.person?.firstName ?? "";
  return `${lastName}, ${firstName}`.trim();
};

const formatDate = (value) => String(value ?? "").slice(0, 10);

const formatTime = (value) => {
  const text = String(value ?? "");
  return text.length >= 5 ? text.slice(0, 5) : text;
};

const opponentName = (game) => {
  if (!selectedTeam.value) {
    return "";
  }

  return sameId(game.homeTeamId, selectedTeam.value.id)
    ? (game.visitingTeam?.name ?? "")
    : (game.homeTeam?.name ?? "");
};

const scoreText = (game) => {
  if (game.homeTeamScore == null || game.visitingTeamScore == null) {
    return "";
  }

  return `${game.homeTeamScore}–${game.visitingTeamScore}`;
};

const retrieveDashboard = async () => {
  loading.value = true;
  listError.value = "";

  try {
    const [teamsResponse, seasonsResponse, gamesResponse, peopleResponse] =
      await Promise.all([
        teamServices.getTeams(),
        seasonServices.getSeasons(),
        gameServices.getGames(),
        peopleServices.getPeople(),
      ]);

    teams.value = [...teamsResponse.data].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    seasons.value = seasonsResponse.data;
    games.value = gamesResponse.data;
    people.value = peopleResponse.data;

    if (
      !selectedTeamId.value ||
      !teams.value.some((team) => sameId(team.id, selectedTeamId.value))
    ) {
      selectedTeamId.value = teams.value[0]?.id ?? null;
    }
  } catch (error) {
    listError.value =
      error.response?.data?.message || "Failed to load dashboard.";
  } finally {
    loading.value = false;
  }
};

watch(
  [selectedTeam, leagueSeasons],
  () => {
    const available = leagueSeasons.value;
    if (
      selectedSeasonId.value &&
      available.some((season) => sameId(season.id, selectedSeasonId.value))
    ) {
      return;
    }

    selectedSeasonId.value = available[0]?.id ?? null;
  },
  { immediate: true }
);

const openEditTeam = () => {
  if (!selectedTeam.value) {
    return;
  }

  teamForm.value = {
    name: selectedTeam.value.name ?? "",
    homeField: selectedTeam.value.homeField ?? "",
  };
  teamFormError.value = "";
  teamFormOpen.value = true;
};

const closeEditTeam = () => {
  teamFormOpen.value = false;
  teamFormError.value = "";
};

const saveTeam = async () => {
  teamFormError.value = "";
  const result = await teamFormRef.value?.validate();

  if (!result?.valid || !selectedTeam.value) {
    return;
  }

  savingTeam.value = true;

  try {
    await teamServices.updateTeam(selectedTeam.value.id, {
      name: teamForm.value.name.trim(),
      homeField: teamForm.value.homeField.trim(),
    });
    closeEditTeam();
    await retrieveDashboard();
  } catch (error) {
    teamFormError.value =
      error.response?.data?.message || "Failed to update team.";
  } finally {
    savingTeam.value = false;
  }
};

const openScoreDialog = (game) => {
  scoringGame.value = game;
  scoreForm.value = {
    homeTeamScore: game.homeTeamScore ?? "",
    visitingTeamScore: game.visitingTeamScore ?? "",
  };
  scoreFormError.value = "";
  scoreDialogOpen.value = true;
};

const closeScoreDialog = () => {
  scoreDialogOpen.value = false;
  scoreFormError.value = "";
  scoringGame.value = null;
};

const saveScore = async () => {
  scoreFormError.value = "";
  const result = await scoreFormRef.value?.validate();

  if (!result?.valid || !scoringGame.value) {
    return;
  }

  savingScore.value = true;

  try {
    await gameServices.updateGame(scoringGame.value.id, {
      homeTeamScore: parseInt(scoreForm.value.homeTeamScore, 10),
      visitingTeamScore: parseInt(scoreForm.value.visitingTeamScore, 10),
    });
    closeScoreDialog();
    await retrieveDashboard();
  } catch (error) {
    scoreFormError.value =
      error.response?.data?.message || "Failed to update score.";
  } finally {
    savingScore.value = false;
  }
};

const openAddPlayerDialog = () => {
  isAddPlayerMode.value = true;
  editingPlayerId.value = null;
  playerForm.value = emptyPlayerForm();
  playerFormError.value = "";
  playerDialogOpen.value = true;
};

const openEditPlayerDialog = (player) => {
  isAddPlayerMode.value = false;
  editingPlayerId.value = player.id;
  playerForm.value = {
    ...emptyPlayerForm(),
    personId: player.personId ?? null,
    position: player.position ?? "",
    number: player.number,
  };
  playerFormError.value = "";
  playerDialogOpen.value = true;
};

const closePlayerDialog = () => {
  playerDialogOpen.value = false;
  playerFormError.value = "";
  editingPlayerId.value = null;
};

const savePlayer = async () => {
  playerFormError.value = "";
  const result = await playerFormRef.value?.validate();

  if (!result?.valid || !selectedTeam.value) {
    return;
  }

  savingPlayer.value = true;

  try {
    let personId = playerForm.value.personId;
    if (personId === "add-person") {
      const created = await peopleServices.createPerson({
        firstName: playerForm.value.firstName.trim(),
        lastName: playerForm.value.lastName.trim(),
        email: playerForm.value.email.trim(),
        birthDate: String(playerForm.value.birthDate).slice(0, 10),
        gender: playerForm.value.gender,
      });
      personId = created.data.id;
    }

    const payload = {
      personId,
      position: String(playerForm.value.position).trim(),
      number: parseInt(playerForm.value.number, 10),
    };

    if (isAddPlayerMode.value) {
      await teamServices.createPlayer(selectedTeam.value.id, payload);
    } else {
      await teamServices.updatePlayer(
        selectedTeam.value.id,
        editingPlayerId.value,
        payload
      );
    }

    closePlayerDialog();
    await retrieveDashboard();
  } catch (error) {
    playerFormError.value =
      error.response?.data?.message ||
      (isAddPlayerMode.value
        ? "Failed to add player."
        : "Failed to update player.");
  } finally {
    savingPlayer.value = false;
  }
};

onMounted(retrieveDashboard);
</script>

<template>
  <v-container class="py-8">
    <v-progress-linear v-if="loading" indeterminate class="mb-4" />

    <v-alert v-if="listError" type="error" density="compact" class="mb-4">
      {{ listError }}
    </v-alert>

    <p v-if="!loading && teams.length === 0" class="text-body-1">
      No teams assigned.
    </p>

    <template v-if="!loading && selectedTeam">
      <v-card rounded="lg" class="mb-4">
        <v-card-item>
          <v-card-title>{{ selectedTeam.name }}</v-card-title>
          <v-card-subtitle>
            {{ selectedTeam.league?.name }}
            <template v-if="selectedTeam.homeField">
              · {{ selectedTeam.homeField }}
            </template>
          </v-card-subtitle>
          <template #append>
            <v-btn
              color="primary"
              variant="elevated"
              class="oc-cta"
              @click="openEditTeam"
            >
              Edit team
            </v-btn>
          </template>
        </v-card-item>
        <v-card-text v-if="teams.length > 1">
          <v-select
            v-model="selectedTeamId"
            label="Team"
            :items="teams"
            item-title="name"
            item-value="id"
            density="comfortable"
          />
        </v-card-text>
      </v-card>

      <v-row>
        <v-col cols="12" md="6">
          <v-card rounded="lg">
            <v-card-item>
              <v-card-title>Games</v-card-title>
            </v-card-item>
            <v-card-text>
              <v-select
                v-if="leagueSeasons.length > 0"
                v-model="selectedSeasonId"
                label="Season"
                :items="leagueSeasons"
                item-title="name"
                item-value="id"
                density="comfortable"
                class="mb-4"
              />

              <p v-if="leagueSeasons.length === 0" class="text-body-1">
                No seasons in this league.
              </p>
              <p
                v-else-if="teamGames.length === 0"
                class="text-body-1"
              >
                No games for this season.
              </p>

              <v-table v-if="teamGames.length > 0">
                <thead>
                  <tr>
                    <th class="text-left">Date</th>
                    <th class="text-left">Time</th>
                    <th class="text-left">Opponent</th>
                    <th class="text-left">Location</th>
                    <th class="text-left">Score</th>
                    <th class="text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="game in teamGames" :key="game.id">
                    <td>{{ formatDate(game.gameDate) }}</td>
                    <td>{{ formatTime(game.startTime) }}</td>
                    <td>{{ opponentName(game) }}</td>
                    <td>{{ game.location }}</td>
                    <td>{{ scoreText(game) }}</td>
                    <td>
                      <v-icon
                        size="small"
                        class="mx-4"
                        aria-label="Edit score"
                        @click="openScoreDialog(game)"
                      >
                        mdi-pencil
                      </v-icon>
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card rounded="lg">
            <v-card-item>
              <v-card-title>Players</v-card-title>
              <template #append>
                <v-btn
                  color="primary"
                  variant="elevated"
                  class="oc-cta"
                  @click="openAddPlayerDialog"
                >
                  Add
                </v-btn>
              </template>
            </v-card-item>
            <v-card-text>
              <p v-if="rosterPlayers.length === 0" class="text-body-1">
                No players yet. Add the first player.
              </p>

              <v-table v-if="rosterPlayers.length > 0">
                <thead>
                  <tr>
                    <th class="text-left">Number</th>
                    <th class="text-left">Name</th>
                    <th class="text-left">Position</th>
                    <th class="text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="player in rosterPlayers" :key="player.id">
                    <td>{{ player.number }}</td>
                    <td>{{ playerName(player) }}</td>
                    <td>{{ player.position }}</td>
                    <td>
                      <v-icon
                        size="small"
                        class="mx-4"
                        aria-label="Edit player"
                        @click="openEditPlayerDialog(player)"
                      >
                        mdi-pencil
                      </v-icon>
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <v-dialog v-model="teamFormOpen" max-width="520">
      <v-card rounded="lg">
        <v-card-title>Edit Team</v-card-title>
        <v-card-text>
          <v-form ref="teamFormRef" @submit.prevent="saveTeam">
            <v-text-field
              v-model="teamForm.name"
              label="Team Name"
              density="comfortable"
              :rules="nameRules"
            />
            <v-text-field
              v-model="teamForm.homeField"
              label="Home Field"
              density="comfortable"
              :rules="homeFieldRules"
            />
          </v-form>
          <v-alert v-if="teamFormError" type="error" density="compact" class="mt-2">
            {{ teamFormError }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeEditTeam">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="savingTeam"
            @click="saveTeam"
          >
            Save Team
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="scoreDialogOpen" max-width="420">
      <v-card rounded="lg">
        <v-card-title>Enter Score</v-card-title>
        <v-card-text>
          <v-form ref="scoreFormRef" @submit.prevent="saveScore">
            <v-text-field
              v-model="scoreForm.homeTeamScore"
              :label="`Home Team Score${scoringGame?.homeTeam?.name ? ` (${scoringGame.homeTeam.name})` : ''}`"
              type="number"
              density="comfortable"
              :rules="scoreRules"
            />
            <v-text-field
              v-model="scoreForm.visitingTeamScore"
              :label="`Visiting Team Score${scoringGame?.visitingTeam?.name ? ` (${scoringGame.visitingTeam.name})` : ''}`"
              type="number"
              density="comfortable"
              :rules="scoreRules"
            />
          </v-form>
          <v-alert v-if="scoreFormError" type="error" density="compact" class="mt-2">
            {{ scoreFormError }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeScoreDialog">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="savingScore"
            @click="saveScore"
          >
            Save Score
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="playerDialogOpen" max-width="520">
      <v-card rounded="lg">
        <v-card-title>{{ playerFormTitle }}</v-card-title>
        <v-card-text>
          <PlayerForm
            ref="playerFormRef"
            v-model="playerForm"
            :people="people"
            :allow-add-person="isAddPlayerMode"
            @submit="savePlayer"
          />
          <v-alert
            v-if="playerFormError"
            type="error"
            density="compact"
            class="mt-2"
          >
            {{ playerFormError }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closePlayerDialog">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="savingPlayer"
            @click="savePlayer"
          >
            {{ playerSaveLabel }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
