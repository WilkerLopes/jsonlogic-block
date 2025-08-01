<template>
  <main class="bg-white dark:bg-gray-900 h-screen w-screen p-4">
    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full">
      <div class="lg:col-span-2 flex flex-col">
        <div
          class="flex-1 border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden bg-white dark:bg-gray-800"
        >
          <BlockEditor v-model:jsonLogic="jsonLogicRulesBlock" />
        </div>
      </div>

      <div class="flex flex-col gap-4">
        <!-- Examples Section - Replace with Select Dropdown -->
        <select
          class="py-2 px-3 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-800 dark:text-gray-200"
          @change="handleExampleChange"
        >
          <option value="" disabled selected>Select an example</option>
          <option v-for="(example, index) in examples" :key="index" :value="index">
            {{ example.name }}
          </option>
        </select>
        <div class="relative flex flex-col grow">
          <div class="flex justify-between items-center mb-2">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">JSON Logic:</span>
            <button
              @click="copyMinifiedJsonLogic"
              class="py-1 px-2 text-xs font-semibold rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              Copy Minified
            </button>
          </div>
          <textarea
            v-model="jsonLogicRules"
            placeholder='{"and": [{">":[{"var":"age"}, 18]}, {"<":[{"var":"age"}, 65]}]}'
            @input="evaluateLogic"
            class="w-full grow p-3 font-mono text-sm border border-gray-300 dark:border-gray-600 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-300"
          ></textarea>
        </div>
        <div v-if="jsonLogicError" class="text-red-500 text-sm mt-1">{{ jsonLogicError }}</div>
        <div v-if="copyJsonLogicSuccess" class="text-green-500 text-xs mt-1 text-right">Copied to clipboard!</div>
      </div>

      <div class="flex flex-col gap-4">
        <div class="flex flex-col grow">
          <div class="flex justify-between items-center mb-2">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Data:</span>
            <button
              @click="copyMinifiedData"
              class="py-1 px-2 text-xs font-semibold rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              Copy Minified
            </button>
          </div>
          <textarea
            v-model="dataObject"
            placeholder='{"age": 25, "name": "John"}'
            @input="evaluateLogic"
            class="w-full h-full p-3 font-mono text-sm border border-gray-300 dark:border-gray-600 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-300"
          ></textarea>

          <div v-if="dataObjectError" class="text-red-500 text-sm mt-1">{{ dataObjectError }}</div>
          <div v-if="copyDataSuccess" class="text-green-500 text-xs mt-1 text-right">Copied to clipboard!</div>
        </div>

        <div class="flex flex-col grow">
          <div class="flex justify-between items-center mb-2">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Result:</span>
            <button
              @click="copyMinifiedResult"
              class="py-1 px-2 text-xs font-semibold rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              Copy Minified
            </button>
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
          <div v-if="copyResultSuccess" class="text-green-500 text-xs mt-1 text-right">Copied to clipboard!</div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import jsonLogic from "json-logic-js";
import { isNil, isEmpty, isNotNil } from "ramda";
import { isNotNull, isNull } from "./helpers/nullCheck.ts";
import BlockEditor from "./components/BlockEditor.vue";

// Reactive state
const jsonLogicRulesBlock = ref("");
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
const copyResultSuccess = ref(false);
const copyJsonLogicSuccess = ref(false);
const copyDataSuccess = ref(false);

function getL(arr) {
  if (Array.isArray(arr)) return arr.length;
  if (typeof arr == "string") return arr.length;

  return 0;
}

onMounted(() => {
  jsonLogic.add_operation("isNotNull", isNotNull);
  jsonLogic.add_operation("isNull", isNull);
  jsonLogic.add_operation("isNotNil", isNotNil);
  jsonLogic.add_operation("isNil", isNil);
  jsonLogic.add_operation("isEmpty", isEmpty);
  jsonLogic.add_operation("length", getL);

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

// Handle example selection from dropdown
const handleExampleChange = (event) => {
  const selectedIndex = parseInt(event.target.value);
  if (!isNaN(selectedIndex) && examples[selectedIndex]) {
    loadExample(examples[selectedIndex]);
  }
};

// Load example into the editor
const loadExample = (example) => {
  jsonLogicRules.value = JSON.stringify(example.logic, null, 2);
  dataObject.value = JSON.stringify(example.data, null, 2);
  evaluateLogic();
};

// Copy minified JSON Logic to clipboard
const copyMinifiedJsonLogic = () => {
  try {
    const logicRules = jsonLogicRules.value.trim() ? JSON.parse(jsonLogicRules.value) : null;
    if (logicRules) {
      const minified = JSON.stringify(logicRules);
      navigator.clipboard.writeText(minified);
      copyJsonLogicSuccess.value = true;
      setTimeout(() => {
        copyJsonLogicSuccess.value = false;
      }, 2000);
    }
  } catch (error) {
    // Do nothing if there's an error
  }
};

// Copy minified data object to clipboard
const copyMinifiedData = () => {
  try {
    const data = dataObject.value.trim() ? JSON.parse(dataObject.value) : null;
    if (data) {
      const minified = JSON.stringify(data);
      navigator.clipboard.writeText(minified);
      copyDataSuccess.value = true;
      setTimeout(() => {
        copyDataSuccess.value = false;
      }, 2000);
    }
  } catch (error) {
    // Do nothing if there's an error
  }
};

// Renamed from copyMinifiedLogic to copyMinifiedResult for clarity
const copyMinifiedResult = () => {
  try {
    // Only try to copy if we have valid JSON Logic
    const logicRules = jsonLogicRules.value.trim() ? JSON.parse(jsonLogicRules.value) : null;
    if (logicRules) {
      const minified = JSON.stringify(logicRules);
      navigator.clipboard.writeText(minified);
      copyResultSuccess.value = true;
      setTimeout(() => {
        copyResultSuccess.value = false;
      }, 2000);
    }
  } catch (error) {
    // Do nothing if there's an error
  }
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
