# Logger

Logs manager. Create log files and print in console.

## Installation

Use the package manager npm to install Logger.

```bash
npm install @ijx/logger
```

## List of Levels
- INFO
- DEBUG
- WARN
- ERROR
- FATAL
- HIST
- TEST
- TEST2
- ALL

## Example usage

```js
// Import module
import Logger, { Level } from "@ijx/logger"

// Create variable with path
const logger = new Logger("./logs");

// Settings
logger
	.addLevelConsole(Level.HIST)
	.addLevelFile(Level.HIST)
	.addLevelConsole(Level.DEBUG, "INVOKER_B");

// Print your logs
logger.log(Level.INFO, "INVOKER_A", "message here 1");
logger.log(Level.DEBUG, "INVOKER_B", "message here 2");
```