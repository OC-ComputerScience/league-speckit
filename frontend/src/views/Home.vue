<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import ManagerDashboard from "../components/ManagerDashboard.vue";
import Utils from "../config/utils.js";

const user = ref(Utils.getStore("user"));
const isManager = computed(() => user.value?.role === "manager");

const refreshUser = () => {
  user.value = Utils.getStore("user");
};

onMounted(() => {
  refreshUser();
  window.addEventListener("user-logged-in", refreshUser);
});

onUnmounted(() => {
  window.removeEventListener("user-logged-in", refreshUser);
});
</script>

<template>
  <ManagerDashboard v-if="isManager" />
  <v-container v-else class="py-10">
    <h1 class="text-h4 mb-2">League Management System</h1>
    <p class="text-body-1 mb-4">
      Demo app for student catalog CRUD: leagues, teams, people, seasons, and
      games.
    </p>
    <p class="text-body-2">
      Sign in, then use the menu. Admins can add and edit catalogs. After a
      first-run seed, use <code>admin</code> / <code>password123</code>.
    </p>
  </v-container>
</template>
