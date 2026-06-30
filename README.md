<div align="center">
  <img src="https://github.com/petescarth/cmdcalc/blob/main/calc-icon-128.jpg?raw=true" alt="CmdCalc Logo" width="128" height="128">
</div>

# CmdCalc

CmdCalc is a powerful, terminal-style command-line calculator built as a Chrome Extension. Powered by the incredible [Math.js](https://mathjs.org/) engine, it brings advanced mathematics, intelligent autocomplete, and a persistent variable environment straight to your browser.

## Features

- **Terminal Interface**: A sleek, dark-mode command-line interface.
- **Advanced Math Engine**: Support for complex numbers, matrices, unit conversions, statistics, and calculus via `math.js`.
- **Persistent Variables**: Define variables (`x = 5`) and custom functions (`f(x) = x^2`) that persist across sessions. Type `vars` to see them all.
- **IntelliSense Autocomplete**: Real-time function prediction with inline documentation.
- **Click-to-Copy**: Instantly copy any result to your clipboard by simply clicking it, or use `Ctrl+C` in the prompt to copy the last result.
- **Detachable Window**: Pop the calculator out into its own floating window for multitasking.

## Installation

1. Clone this repository or download the source code.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** using the toggle in the top right corner.
4. Click **Load unpacked** and select the repository directory.

## Usage

Click the extension icon in your toolbar to open CmdCalc.

**Basic Commands:**
- `help`: Lists basic commands and functions.
- `help advanced`: Lists advanced mathematical capabilities.
- `clear` (or `Ctrl+L`): Clears your calculation history and variable scope.
- `vars`: Lists all your currently defined variables and custom functions.
- `Arrow Up` / `Arrow Down`: Navigate through your previous calculations.

## License

This project is licensed under the Apache License 2.0.
