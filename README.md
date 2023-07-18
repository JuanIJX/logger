# Logger

Logs manager

## Installation

Use the package manager npm to install Logger.

```bash
npm install @ijx/logger
```

## Usage

```js
import Logger, { Level } from "@ijx/logger"

const logger = new Logger(systemPaths.logsTotalPath);
logger
	.addLevelConsole(Level.DEBUG | Level.HIST)
	.addLevelFile(Level.DEBUG);
```