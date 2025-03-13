<template>
  <main class="bg-white dark:bg-gray-900 h-screen w-screen p-4">
    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full">
      <div class="lg:col-span-2 flex flex-col">
        <div
          class="flex-1 border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden bg-white dark:bg-gray-800"
        >
          <BlockEditor v-model:jsonLogic="jsonLogicRules" />
        </div>
      </div>

      <div class="flex flex-col">
        <!-- Examples Section -->
        <div class="bg-gray-50 dark:bg-gray-800 rounded-md p-3 mb-4">
          <div class="flex flex-wrap gap-2">
            <button
              v-for="(example, index) in examples"
              :key="index"
              @click="loadExample(example)"
              class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:pointer-events-none dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-gray-600"
            >
              {{ example.name }}
            </button>
          </div>
        </div>
        <div class="relative flex-1">
          <textarea
            v-model="jsonLogicRules"
            placeholder='{"and": [{">":[{"var":"age"}, 18]}, {"<":[{"var":"age"}, 65]}]}'
            @input="evaluateLogic"
            class="absolute inset-0 w-full h-full p-3 font-mono text-sm border border-gray-300 dark:border-gray-600 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-300"
          ></textarea>
        </div>
        <div v-if="jsonLogicError" class="text-red-500 text-sm mt-1">{{ jsonLogicError }}</div>
      </div>

      <div class="flex flex-col gap-4">
        <div class="flex flex-col grow">
          <textarea
            v-model="dataObject"
            placeholder='{"age": 25, "name": "John"}'
            @input="evaluateLogic"
            class="w-full h-full p-3 font-mono text-sm border border-gray-300 dark:border-gray-600 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-300"
          ></textarea>

          <div v-if="dataObjectError" class="text-red-500 text-sm mt-1">{{ dataObjectError }}</div>
        </div>

        <div
          class="grow bg-white dark:bg-gray-700 p-3 border rounded-md font-mono text-sm min-h-[100px] whitespace-pre-wrap dark:text-gray-300"
          :class="{
            'border-red-500 text-red-600 dark:text-red-400': resultError,
            'border-gray-300 dark:border-gray-600': !resultError,
          }"
        >
          {{ result }}
        </div>
      </div>
    </div>

    <!-- Result Section -->
  </main>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import jsonLogic from "json-logic-js";
import { isNil, isEmpty } from "ramda";
import BlockEditor from "./components/BlockEditor.vue";

// Reactive state
const jsonLogicRules = ref("");
const dataObject = ref("");
const jsonLogicError = ref(null);
const dataObjectError = ref(null);
const result = ref("Waiting for input...");
const resultError = ref(false);
const newOperator = ref({
  name: "",
  functionStr: "",
});

onMounted(() => {
  jsonLogic.add_operation("isNil", isNil);
  jsonLogic.add_operation("isEmpty", isEmpty);

  // Initialize Preline UI
  import("preline/preline").then(({ HSThemeAppearance }) => {
    // Set dark mode as default
    if (!localStorage.getItem("hs_theme")) {
      localStorage.setItem("hs_theme", "dark");
      document.documentElement.classList.add("dark");
    }

    // Initialize Preline's theme functionality
    HSThemeAppearance.init();
  });
});

// Example models
const examples = [
  {
    name: "Age Check",
    logic: {
      and: [{ ">": [{ var: "age" }, 18] }, { "<": [{ var: "age" }, 65] }],
    },
    data: {
      age: 25,
      name: "John Doe",
    },
  },
  {
    name: "String Comparison",
    logic: {
      "==": [{ var: "status" }, "active"],
    },
    data: {
      status: "active",
      id: 12345,
    },
  },
  {
    name: "isNil Example (Ramda)",
    logic: {
      isNil: [{ var: "optional_field" }],
    },
    data: {
      name: "Test",
      required_field: "value",
    },
  },
  {
    name: "isEmpty Example (Ramda)",
    logic: {
      isEmpty: [{ var: "comments" }],
    },
    data: {
      user: "john_doe",
      comments: [],
    },
  },
  {
    name: "Custom Operators",
    logic: {
      and: [{ isEmpty: [{ var: "tags" }] }, { isNil: [{ var: "optional_data" }] }],
    },
    data: {
      title: "Test Post",
      content: "Some content",
      tags: [],
    },
  },
  {
    name: "Nested Conditions",
    logic: {
      if: [
        { "<": [{ var: "temp" }, 0] },
        "freezing",
        { "<": [{ var: "temp" }, 20] },
        "cold",
        { "<": [{ var: "temp" }, 30] },
        "warm",
        "hot",
      ],
    },
    data: {
      temp: 25,
    },
  },
  {
    name: "Array Operations",
    logic: {
      filter: [{ var: "users" }, { ">=": [{ var: "age" }, 21] }],
    },
    data: {
      users: [
        { name: "Alice", age: 18 },
        { name: "Bob", age: 21 },
        { name: "Charlie", age: 30 },
        { name: "David", age: 17 },
      ],
    },
  },
];

// Load example into the editor
const loadExample = (example) => {
  jsonLogicRules.value = JSON.stringify(example.logic, null, 2);
  dataObject.value = JSON.stringify(example.data, null, 2);
  evaluateLogic();
};

// Evaluate JSON Logic against data
const evaluateLogic = () => {
  // Reset errors
  jsonLogicError.value = null;
  dataObjectError.value = null;
  resultError.value = false;

  // Parse JSON Logic
  let logicRules;
  try {
    logicRules = jsonLogicRules.value.trim() ? JSON.parse(jsonLogicRules.value) : null;
    if (!logicRules) {
      result.value = "Waiting for JSON Logic rules...";
      return;
    }
  } catch (error) {
    jsonLogicError.value = `Invalid JSON Logic: ${error.message}`;
    result.value = "Error in JSON Logic syntax";
    resultError.value = true;
    return;
  }

  // Parse Data Object
  let data;
  try {
    data = dataObject.value.trim() ? JSON.parse(dataObject.value) : {};
  } catch (error) {
    dataObjectError.value = `Invalid Data Object: ${error.message}`;
    result.value = "Error in Data Object syntax";
    resultError.value = true;
    return;
  }

  // Apply JSON Logic
  try {
    const logicResult = jsonLogic.apply(logicRules, data);
    result.value = JSON.stringify(logicResult, null, 2);
  } catch (error) {
    result.value = `Error applying JSON Logic: ${error.message}`;
    resultError.value = true;
  }
};

// Watch for changes in jsonLogicRules to evaluate logic
watch(jsonLogicRules, (newVal) => {
  if (newVal) {
    evaluateLogic();
  }
});
</script>

<style>
/* Base styles */
body {
  @apply bg-white dark:bg-gray-900;
}

/* We're using Tailwind classes for most styling, so we can remove most custom CSS */
</style>
