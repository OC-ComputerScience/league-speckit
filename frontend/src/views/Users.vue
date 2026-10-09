<script setup>
import { onMounted, ref } from "vue";
import userServices from "../services/userServices.js";

const emptyForm = () => ({
  fName: "",
  lName: "",
  email: "",
  username: "",
  password: "",
  confirmPassword: "",
});

const users = ref([]);
const loading = ref(false);
const listError = ref("");
const formDialogOpen = ref(false);
const form = ref(emptyForm());
const formRef = ref(null);
const formError = ref("");
const saving = ref(false);
const editingId = ref(null);

const passwordRules = [
  (value) => !!value || "Password is required.",
  (value) =>
    !value || value.length >= 8 || "Password must be at least 8 characters.",
];
const confirmPasswordRules = [
  (value) => !!value || "Password is required.",
  (value) =>
    !form.value.password ||
    value === form.value.password ||
    "Passwords do not match.",
];

const retrieveUsers = async () => {
  loading.value = true;
  listError.value = "";

  try {
    const response = await userServices.getUsers();
    users.value = response.data;
  } catch (error) {
    listError.value =
      error.response?.data?.message || "Failed to fetch users.";
  } finally {
    loading.value = false;
  }
};

const openEditDialog = async (user) => {
  editingId.value = user.id;
  form.value = {
    fName: user.fName ?? "",
    lName: user.lName ?? "",
    email: user.email ?? "",
    username: user.username ?? "",
    password: "",
    confirmPassword: "",
  };
  formError.value = "";
  formDialogOpen.value = true;

  try {
    const response = await userServices.getUser(user.id);
    form.value = {
      ...form.value,
      fName: response.data.fName ?? form.value.fName,
      lName: response.data.lName ?? form.value.lName,
      email: response.data.email ?? form.value.email,
      username: response.data.username ?? form.value.username,
    };
  } catch (error) {
    formError.value =
      error.response?.data?.message || "Failed to load user.";
  }
};

const closeFormDialog = () => {
  formDialogOpen.value = false;
  formError.value = "";
  editingId.value = null;
  form.value = emptyForm();
};

const saveUser = async () => {
  formError.value = "";
  const result = await formRef.value?.validate();

  if (!result?.valid || !editingId.value) {
    return;
  }

  saving.value = true;

  try {
    await userServices.updateUser(editingId.value, {
      password: form.value.password,
    });
    closeFormDialog();
    await retrieveUsers();
  } catch (error) {
    formError.value =
      error.response?.data?.message || "Failed to update user.";
  } finally {
    saving.value = false;
  }
};

onMounted(retrieveUsers);
</script>

<template>
  <v-container class="py-8">
    <v-card rounded="lg">
      <v-card-item>
        <v-card-title>Users</v-card-title>
      </v-card-item>

      <v-card-text>
        <v-progress-linear v-if="loading" indeterminate class="mb-4" />

        <v-alert v-if="listError" type="error" density="compact" class="mb-4">
          {{ listError }}
        </v-alert>

        <p v-if="!loading && users.length === 0" class="text-body-1">
          No users yet.
        </p>

        <v-table v-if="!loading && users.length > 0">
          <thead>
            <tr>
              <th class="text-left">Username</th>
              <th class="text-left">Last name</th>
              <th class="text-left">First name</th>
              <th class="text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>{{ user.username }}</td>
              <td>{{ user.lName }}</td>
              <td>{{ user.fName }}</td>
              <td>
                <v-icon
                  size="small"
                  class="mx-4"
                  aria-label="Edit user"
                  @click="openEditDialog(user)"
                >
                  mdi-pencil
                </v-icon>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>

    <v-dialog v-model="formDialogOpen" max-width="520">
      <v-card rounded="lg">
        <v-card-title>Edit User</v-card-title>
        <v-card-text>
          <v-form ref="formRef" @submit.prevent="saveUser">
            <v-text-field
              v-model="form.fName"
              label="First Name"
              density="comfortable"
              readonly
            />
            <v-text-field
              v-model="form.lName"
              label="Last Name"
              density="comfortable"
              readonly
            />
            <v-text-field
              v-model="form.email"
              label="Email"
              density="comfortable"
              readonly
            />
            <v-text-field
              v-model="form.username"
              label="Username"
              density="comfortable"
              readonly
            />
            <v-text-field
              v-model="form.password"
              label="New password"
              type="password"
              density="comfortable"
              autocomplete="new-password"
              :rules="passwordRules"
            />
            <v-text-field
              v-model="form.confirmPassword"
              label="Confirm password"
              type="password"
              density="comfortable"
              autocomplete="new-password"
              :rules="confirmPasswordRules"
            />
          </v-form>
          <v-alert v-if="formError" type="error" density="compact" class="mt-2">
            {{ formError }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeFormDialog">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="saving"
            @click="saveUser"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
