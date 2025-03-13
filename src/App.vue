<template>
  <div id="app">
    <h1>JSON Logic Tester</h1>

    <div class="examples-section">
      <h3>Examples</h3>
      <div class="examples-container">
        <button v-for="(example, index) in examples" :key="index" @click="loadExample(example)" class="example-btn">
          {{ example.name }}
        </button>
      </div>
    </div>

    <div class="container">
      <div class="editor-panel">
        <div class="editor-section">
          <h2>JSON Logic Rules</h2>
          <textarea
            v-model="jsonLogicRules"
            placeholder='Enter your JSON Logic rules here. Example: {"and": [{">":[{"var":"age"}, 18]}, {"<":[{"var":"age"}, 65]}]}'
            @input="evaluateLogic"
          ></textarea>
          <div class="error" v-if="jsonLogicError">{{ jsonLogicError }}</div>
        </div>

        <div class="editor-section">
          <h2>Data Object</h2>
          <textarea
            v-model="dataObject"
            placeholder='Enter your data object here. Example: {"age": 25, "name": "John"}'
            @input="evaluateLogic"
          ></textarea>
          <div class="error" v-if="dataObjectError">{{ dataObjectError }}</div>
        </div>
      </div>

      <div class="result-panel">
        <h2>Result</h2>
        <div class="result-content" :class="{ error: resultError }">
          {{ result }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import jsonLogic from "json-logic-js";
import { isNil, isEmpty } from "ramda";

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
});

// Get string representation of a function
const getFunctionString = (func) => {
  return func.toString();
};

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
</script>

<style>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  text-align: center;
  margin-bottom: 20px;
  color: #4caf50;
}

h2 {
  margin-top: 0;
  color: #2c3e50;
}

.container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 30px;
}

.examples-section {
  background-color: #f9f9f9;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.examples-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.example-btn {
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 15px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.example-btn:hover {
  background-color: #3e8e41;
}

.editor-panel {
  display: flex;
  gap: 20px;
}

@media (max-width: 768px) {
  .editor-panel {
    flex-direction: column;
  }

  .examples-container {
    flex-direction: column;
  }
}

.editor-section {
  flex: 1;
  display: flex;
  flex-direction: column;
}

textarea {
  flex: 1;
  min-height: 200px;
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-family: monospace;
  font-size: 14px;
  resize: vertical;
}

.result-panel {
  background-color: #f5f5f5;
  border-radius: 4px;
  padding: 15px;
}

.result-content {
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 12px;
  font-family: monospace;
  white-space: pre-wrap;
  min-height: 100px;
}

.error {
  color: #f44336;
  font-size: 14px;
  margin-top: 8px;
}

.result-content.error {
  color: #f44336;
  border-color: #f44336;
}

.custom-operators-section {
  background-color: #f5f5f5;
  border-radius: 4px;
  padding: 20px;
  margin-top: 30px;
}

.add-operator-panel {
  background-color: #fff;
  border-radius: 4px;
  padding: 15px;
  margin-top: 15px;
  border: 1px solid #ddd;
}

.operator-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-group label {
  font-weight: bold;
}

.form-group input,
.form-group textarea {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-family: monospace;
}

.form-group textarea {
  min-height: 80px;
}

.add-btn {
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.add-btn:hover {
  background-color: #0b7dda;
}

.current-operators {
  margin-top: 20px;
}

.operator-item {
  background-color: #fff;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 10px;
  border: 1px solid #ddd;
}

code {
  background-color: #f1f1f1;
  padding: 2px 5px;
  border-radius: 3px;
  font-family: monospace;
}
</style>
