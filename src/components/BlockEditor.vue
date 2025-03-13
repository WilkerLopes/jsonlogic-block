<template>
  <div class="h-full w-full">
    <div ref="blocklyDiv" class="w-full h-full min-h-[400px] border border-gray-300 rounded-md overflow-hidden"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from "vue";
import * as Blockly from "blockly";
import { javascriptGenerator } from "blockly/javascript";

const props = defineProps({
  jsonLogic: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["update:jsonLogic"]);
const blocklyDiv = ref(null);
let workspace = null;

// Define custom blocks for JSON Logic
const defineCustomBlocks = () => {
  // Logic operations
  Blockly.Blocks["json_logic_and"] = {
    init: function () {
      this.appendValueInput("LEFT").setCheck(null);
      this.appendValueInput("RIGHT").setCheck(null).appendField("AND");
      this.setOutput(true, null);
      this.setColour(210);
    },
  };

  Blockly.Blocks["json_logic_or"] = {
    init: function () {
      this.appendValueInput("LEFT").setCheck(null);
      this.appendValueInput("RIGHT").setCheck(null).appendField("OR");
      this.setOutput(true, null);
      this.setColour(210);
    },
  };

  // Comparison operations
  Blockly.Blocks["json_logic_equal"] = {
    init: function () {
      this.appendValueInput("LEFT").setCheck(null);
      this.appendValueInput("RIGHT").setCheck(null).appendField("==");
      this.setOutput(true, null);
      this.setColour(160);
    },
  };

  Blockly.Blocks["json_logic_greater"] = {
    init: function () {
      this.appendValueInput("LEFT").setCheck(null);
      this.appendValueInput("RIGHT").setCheck(null).appendField(">");
      this.setOutput(true, null);
      this.setColour(160);
    },
  };

  Blockly.Blocks["json_logic_less"] = {
    init: function () {
      this.appendValueInput("LEFT").setCheck(null);
      this.appendValueInput("RIGHT").setCheck(null).appendField("<");
      this.setOutput(true, null);
      this.setColour(160);
    },
  };

  // Variable access
  Blockly.Blocks["json_logic_var"] = {
    init: function () {
      this.appendDummyInput().appendField("var").appendField(new Blockly.FieldTextInput("name"), "VAR_NAME");
      this.setOutput(true, null);
      this.setColour(330);
    },
  };

  // Value blocks
  Blockly.Blocks["json_logic_number"] = {
    init: function () {
      this.appendDummyInput().appendField(new Blockly.FieldNumber(0), "NUM");
      this.setOutput(true, "Number");
      this.setColour(65);
    },
  };

  Blockly.Blocks["json_logic_string"] = {
    init: function () {
      this.appendDummyInput().appendField(new Blockly.FieldTextInput("text"), "TEXT");
      this.setOutput(true, "String");
      this.setColour(65);
    },
  };

  // Special operations
  Blockly.Blocks["json_logic_isnil"] = {
    init: function () {
      this.appendValueInput("VALUE").setCheck(null).appendField("isNil");
      this.setOutput(true, null);
      this.setColour(290);
    },
  };

  Blockly.Blocks["json_logic_isempty"] = {
    init: function () {
      this.appendValueInput("VALUE").setCheck(null).appendField("isEmpty");
      this.setOutput(true, null);
      this.setColour(290);
    },
  };
};

// Convert block workspace to JSON Logic
const workspaceToJsonLogic = () => {
  const topBlocks = workspace.getTopBlocks(false);
  if (topBlocks.length === 0) return "";

  const mainBlock = topBlocks[0];
  let logic = blockToJsonLogic(mainBlock);
  return JSON.stringify(logic, null, 2);
};

// Convert a single block to JSON Logic object
const blockToJsonLogic = (block) => {
  const type = block.type;

  switch (type) {
    case "json_logic_and":
      return {
        and: [
          blockToJsonLogic(block.getInputTargetBlock("LEFT")),
          blockToJsonLogic(block.getInputTargetBlock("RIGHT")),
        ],
      };

    case "json_logic_or":
      return {
        or: [blockToJsonLogic(block.getInputTargetBlock("LEFT")), blockToJsonLogic(block.getInputTargetBlock("RIGHT"))],
      };

    case "json_logic_equal":
      return {
        "==": [
          blockToJsonLogic(block.getInputTargetBlock("LEFT")),
          blockToJsonLogic(block.getInputTargetBlock("RIGHT")),
        ],
      };

    case "json_logic_greater":
      return {
        ">": [
          blockToJsonLogic(block.getInputTargetBlock("LEFT")),
          blockToJsonLogic(block.getInputTargetBlock("RIGHT")),
        ],
      };

    case "json_logic_less":
      return {
        "<": [
          blockToJsonLogic(block.getInputTargetBlock("LEFT")),
          blockToJsonLogic(block.getInputTargetBlock("RIGHT")),
        ],
      };

    case "json_logic_var":
      return {
        var: block.getFieldValue("VAR_NAME"),
      };

    case "json_logic_number":
      return Number(block.getFieldValue("NUM"));

    case "json_logic_string":
      return block.getFieldValue("TEXT");

    case "json_logic_isnil":
      return {
        isNil: [blockToJsonLogic(block.getInputTargetBlock("VALUE"))],
      };

    case "json_logic_isempty":
      return {
        isEmpty: [blockToJsonLogic(block.getInputTargetBlock("VALUE"))],
      };

    default:
      return null;
  }
};

// Build blocks from JSON Logic
const jsonLogicToWorkspace = (jsonLogicStr) => {
  if (!workspace || !jsonLogicStr) return;

  try {
    workspace.clear();
    const jsonLogic = JSON.parse(jsonLogicStr);

    const block = createBlockFromJson(jsonLogic);
    if (block) {
      block.moveBy(50, 50);
    }
  } catch (error) {
    console.error("Failed to parse JSON Logic:", error);
  }
};

// Create blocks from JSON Logic object
const createBlockFromJson = (json) => {
  if (json === null || json === undefined) return null;

  if (typeof json === "number") {
    const block = workspace.newBlock("json_logic_number");
    block.setFieldValue(json, "NUM");
    block.initSvg();
    block.render();
    return block;
  }

  if (typeof json === "string") {
    const block = workspace.newBlock("json_logic_string");
    block.setFieldValue(json, "TEXT");
    block.initSvg();
    block.render();
    return block;
  }

  if (typeof json === "object") {
    const operator = Object.keys(json)[0];
    const values = json[operator];

    let block;

    switch (operator) {
      case "and":
        block = workspace.newBlock("json_logic_and");
        if (Array.isArray(values) && values.length >= 2) {
          const leftBlock = createBlockFromJson(values[0]);
          const rightBlock = createBlockFromJson(values[1]);

          if (leftBlock) connect(block, "LEFT", leftBlock);
          if (rightBlock) connect(block, "RIGHT", rightBlock);
        }
        break;

      case "or":
        block = workspace.newBlock("json_logic_or");
        if (Array.isArray(values) && values.length >= 2) {
          const leftBlock = createBlockFromJson(values[0]);
          const rightBlock = createBlockFromJson(values[1]);

          if (leftBlock) connect(block, "LEFT", leftBlock);
          if (rightBlock) connect(block, "RIGHT", rightBlock);
        }
        break;

      case "==":
        block = workspace.newBlock("json_logic_equal");
        if (Array.isArray(values) && values.length >= 2) {
          const leftBlock = createBlockFromJson(values[0]);
          const rightBlock = createBlockFromJson(values[1]);

          if (leftBlock) connect(block, "LEFT", leftBlock);
          if (rightBlock) connect(block, "RIGHT", rightBlock);
        }
        break;

      case ">":
        block = workspace.newBlock("json_logic_greater");
        if (Array.isArray(values) && values.length >= 2) {
          const leftBlock = createBlockFromJson(values[0]);
          const rightBlock = createBlockFromJson(values[1]);

          if (leftBlock) connect(block, "LEFT", leftBlock);
          if (rightBlock) connect(block, "RIGHT", rightBlock);
        }
        break;

      case "<":
        block = workspace.newBlock("json_logic_less");
        if (Array.isArray(values) && values.length >= 2) {
          const leftBlock = createBlockFromJson(values[0]);
          const rightBlock = createBlockFromJson(values[1]);

          if (leftBlock) connect(block, "LEFT", leftBlock);
          if (rightBlock) connect(block, "RIGHT", rightBlock);
        }
        break;

      case "var":
        block = workspace.newBlock("json_logic_var");
        block.setFieldValue(values, "VAR_NAME");
        break;

      case "isNil":
        block = workspace.newBlock("json_logic_isnil");
        if (Array.isArray(values) && values.length >= 1) {
          const valBlock = createBlockFromJson(values[0]);
          if (valBlock) connect(block, "VALUE", valBlock);
        }
        break;

      case "isEmpty":
        block = workspace.newBlock("json_logic_isempty");
        if (Array.isArray(values) && values.length >= 1) {
          const valBlock = createBlockFromJson(values[0]);
          if (valBlock) connect(block, "VALUE", valBlock);
        }
        break;

      default:
        return null;
    }

    if (block) {
      block.initSvg();
      block.render();
      return block;
    }
  }

  return null;
};

// Helper to connect blocks
const connect = (parent, inputName, child) => {
  const parentInput = parent.getInput(inputName);
  if (parentInput) {
    parentInput.connection.connect(child.outputConnection);
  }
};

onMounted(() => {
  if (blocklyDiv.value) {
    defineCustomBlocks();

    // Initialize Blockly workspace with updated theme
    const theme = Blockly.Theme.defineTheme("modern", {
      base: Blockly.Themes.Classic,
      componentStyles: {
        workspaceBackgroundColour: "#f9fafb",
        toolboxBackgroundColour: "#f3f4f6",
        toolboxForegroundColour: "#111827",
        flyoutBackgroundColour: "#ffffff",
        flyoutForegroundColour: "#1f2937",
        flyoutOpacity: 0.9,
        scrollbarColour: "#e5e7eb",
        insertionMarkerColour: "#60a5fa",
        insertionMarkerOpacity: 0.3,
        scrollbarOpacity: 0.8,
        cursorColour: "#3b82f6",
      },
    });

    workspace = Blockly.inject(blocklyDiv.value, {
      toolbox: {
        kind: "categoryToolbox",
        contents: [
          {
            kind: "category",
            name: "Logic",
            colour: 210,
            contents: [
              { kind: "block", type: "json_logic_and" },
              { kind: "block", type: "json_logic_or" },
            ],
          },
          {
            kind: "category",
            name: "Comparisons",
            colour: 160,
            contents: [
              { kind: "block", type: "json_logic_equal" },
              { kind: "block", type: "json_logic_greater" },
              { kind: "block", type: "json_logic_less" },
            ],
          },
          {
            kind: "category",
            name: "Variables",
            colour: 330,
            contents: [{ kind: "block", type: "json_logic_var" }],
          },
          {
            kind: "category",
            name: "Values",
            colour: 65,
            contents: [
              { kind: "block", type: "json_logic_number" },
              { kind: "block", type: "json_logic_string" },
            ],
          },
          {
            kind: "category",
            name: "Special",
            colour: 290,
            contents: [
              { kind: "block", type: "json_logic_isnil" },
              { kind: "block", type: "json_logic_isempty" },
            ],
          },
        ],
      },
      theme: theme,
      trashcan: true,
      move: {
        scrollbars: true,
      },
      zoom: {
        controls: true,
        wheel: true,
        startScale: 1.0,
        maxScale: 3,
        minScale: 0.3,
        scaleSpeed: 1.2,
      },
      grid: {
        spacing: 20,
        length: 3,
        colour: "#ccc",
        snap: true,
      },
    });

    // Add event listener for block changes
    workspace.addChangeListener(() => {
      const jsonLogic = workspaceToJsonLogic();
      if (jsonLogic) {
        emit("update:jsonLogic", jsonLogic);
      }
    });

    // Initialize with provided JSON Logic if available
    if (props.jsonLogic) {
      jsonLogicToWorkspace(props.jsonLogic);
    }
  }
});

// Watch for changes to jsonLogic prop
watch(
  () => props.jsonLogic,
  (newVal) => {
    if (workspace && newVal) {
      // Only update if the workspace generated logic doesn't match the new value
      const currentLogic = workspaceToJsonLogic();
      if (currentLogic !== newVal) {
        jsonLogicToWorkspace(newVal);
      }
    }
  }
);

onUnmounted(() => {
  if (workspace) {
    workspace.dispose();
  }
});
</script>
