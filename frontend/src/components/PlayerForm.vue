<script setup>
import { computed, ref } from "vue";
import { isValidEmail } from "../config/validation.js";

const ADD_PERSON_ID = "add-person";

const props = defineProps({
  modelValue: { type: Object, required: true },
  people: { type: Array, default: () => [] },
  allowAddPerson: { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue", "submit"]);

const formRef = ref(null);
const genderOptions = ["male", "female", "other"];

const isAddPerson = computed(
  () => props.modelValue.personId === ADD_PERSON_ID
);

const personItems = computed(() => {
  const items = props.people.map((person) => ({
    id: person.id,
    title: `${person.lastName}, ${person.firstName}`,
  }));

  if (props.allowAddPerson) {
    return [{ id: ADD_PERSON_ID, title: "Add Person" }, ...items];
  }

  return items;
});

const updateField = (field, value) => {
  emit("update:modelValue", { ...props.modelValue, [field]: value });
};

const personRules = [(value) => !!value || "Required"];
const positionRules = [
  (value) => !!value?.toString().trim() || "Required",
  (value) =>
    (value?.toString().trim().length ?? 0) <= 30 ||
    "Position must be 30 characters or fewer.",
];
const numberRules = [
  (value) =>
    (value !== undefined && value !== null && String(value).trim() !== "") ||
    "Required",
  (value) => {
    const parsed = parseInt(value, 10);
    return (
      (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 99) ||
      "Player number must be between 0 and 99."
    );
  },
];
const firstNameRules = [
  (value) => !!value?.trim() || "Required",
  (value) =>
    (value?.trim().length ?? 0) <= 50 ||
    "First name must be 50 characters or fewer.",
];
const lastNameRules = [
  (value) => !!value?.trim() || "Required",
  (value) =>
    (value?.trim().length ?? 0) <= 50 ||
    "Last name must be 50 characters or fewer.",
];
const emailRules = [
  (value) => !!value?.trim() || "Required",
  (value) =>
    (value?.trim().length ?? 0) <= 100 ||
    "Email must be 100 characters or fewer.",
  (value) => isValidEmail(value) || "Email must be a valid email address.",
];
const birthDateRules = [
  (value) => !!value || "Required",
  (value) => {
    const dateOnly = String(value ?? "").slice(0, 10);
    const today = new Date();
    const todayOnly = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0"),
    ].join("-");
    return dateOnly < todayOnly || "Birth date must be in the past.";
  },
];
const genderRules = [
  (value) => !!value || "Required",
  (value) =>
    genderOptions.includes(value) || "Gender must be male, female, or other.",
];

const validate = () => formRef.value.validate();

defineExpose({ validate });
</script>

<template>
  <v-form ref="formRef" @submit.prevent="emit('submit')">
    <v-select
      :model-value="modelValue.personId"
      label="Person"
      :items="personItems"
      item-title="title"
      item-value="id"
      density="comfortable"
      :rules="personRules"
      @update:model-value="updateField('personId', $event)"
    />
    <template v-if="isAddPerson">
      <v-text-field
        :model-value="modelValue.firstName"
        label="First Name"
        density="comfortable"
        :rules="firstNameRules"
        @update:model-value="updateField('firstName', $event)"
      />
      <v-text-field
        :model-value="modelValue.lastName"
        label="Last Name"
        density="comfortable"
        :rules="lastNameRules"
        @update:model-value="updateField('lastName', $event)"
      />
      <v-text-field
        :model-value="modelValue.email"
        label="Email"
        density="comfortable"
        :rules="emailRules"
        @update:model-value="updateField('email', $event)"
      />
      <v-text-field
        :model-value="modelValue.birthDate"
        label="Birth Date"
        type="date"
        density="comfortable"
        :rules="birthDateRules"
        @update:model-value="updateField('birthDate', $event)"
      />
      <v-select
        :model-value="modelValue.gender"
        label="Gender"
        :items="genderOptions"
        density="comfortable"
        :rules="genderRules"
        @update:model-value="updateField('gender', $event)"
      />
    </template>
    <v-text-field
      :model-value="modelValue.number"
      label="Number"
      type="number"
      density="comfortable"
      :rules="numberRules"
      @update:model-value="updateField('number', $event)"
    />
    <v-text-field
      :model-value="modelValue.position"
      label="Position"
      density="comfortable"
      :rules="positionRules"
      @update:model-value="updateField('position', $event)"
    />
  </v-form>
</template>
