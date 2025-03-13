# JSON Logic Block

A modern Vue 3 application for testing JSON Logic rules during migration.

## Overview

This tool allows developers to:
- Enter JSON Logic rules
- Provide data objects for testing
- See the result of applying the rules to the data in real-time

## Installation

```bash
# Clone the repository
git clone https://github.com/WilkerLopes/jsonlogic-block.git
cd jsonlogic-block

# Install dependencies
npm install

# Start the development server
npm run dev

# Build for production
npm run build
```

## How to Use

1. Enter your JSON Logic rules in the left textarea
2. Enter your data object in the right textarea
3. The result will be automatically displayed below

### Example

**JSON Logic:**
```json
{
  "and": [
    { ">": [{ "var": "age" }, 18] },
    { "<": [{ "var": "age" }, 65] }
  ]
}
```

**Data Object:**
```json
{
  "age": 25,
  "name": "John Doe"
}
```

**Result:**
```
true
```

## Technologies Used

- Vue 3
- Vite
- json-logic-js

## About JSON Logic

[JSON Logic](https://jsonlogic.com/) is a way to write logic that can be easily serialized, stored, and transferred between languages. It's used for creating complex rules that can be evaluated against different data objects.

## License

MIT