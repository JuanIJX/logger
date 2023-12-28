// 13/04/2023

import fs from 'fs' // Nativas
import path from "path" // Nativas
import { EOL } from "os" // Nativas

import { createDirs } from "@ijx/utils"

export const Level = {
	NONE:   0,

	INFO:	0x01,
	DEBUG:	0x02,
	WARN:	0x04,
	ERROR:	0x08,
	FATAL:	0x10,
	HIST:	0x20,
	TEST:	0x40,
	TEST2:	0x80,

	ALLERR: 0x18,

	ALL:    0xff,
};

function stringifyNoCircular(obj, space=null) {
	var cache = [];
	var blockedKeys = [];
	return JSON.stringify(obj, (key, value) => {
	if (typeof value === 'object' && value !== null) {
		if (blockedKeys.includes(key)) return;
		if (cache.includes(value)) return;
		cache.push(value);
	}
	return value;
	}, space);
}

function processMsg(msg, debug) {
	if(msg instanceof Error)
		return debug ? msg.stack : msg.message;
	if(typeof(msg) == "object")
		return stringifyNoCircular(msg, 2);
	return msg;
}

export default class Logger {
	static _extension = "txt";
	static _hourFormat = "H:i:s";
	static _getDate = () => new Date();

    constructor(folder) {
		// Variables
		Object.defineProperty(this, '_dayStr', { value: "", writable: true });
		Object.defineProperty(this, '_file', { value: null, writable: true });
		Object.defineProperty(this, '_folder', { value: folder!==undefined ? path.normalize(folder) : "logs" });
		Object.defineProperty(this, '_levelConsole', { value: (Level.ALL & ~(Level.DEBUG | Level.HIST)), writable: true });
		Object.defineProperty(this, '_levelFile', { value: (Level.ALL & ~Level.DEBUG), writable: true });

		// Functions
		Object.defineProperty(this, "levelConsole", {
			get() { return this._levelConsole; },
			set(level) { this.setLevelConsole(level); },
			enumerable: true
		});
		Object.defineProperty(this, "levelFile", {
			get() { return this._levelFile; },
			set(level) { this.setLevelFile(level); },
			enumerable: true
		});

		Object.defineProperty(this, "_log", { value: function(loglevel, invoker, msg, date, loglevelName) {
			var _msg = [
				date.format(this.constructor._hourFormat),
				invoker=="" ? null : `[${invoker}]`,
				`(${loglevelName})`,
				msg,
			].filter(e => e!==null);

			if(this.levelConsole & loglevel)
				this._writeConsole(_msg);
			if(this.levelFile & loglevel)
				this._writeFile(_msg);
		} });
		Object.defineProperty(this, "_writeConsole", { value: function(msg) {
			msg.push(processMsg(msg.pop(), this.levelConsole & Level.DEBUG));
			console.log(msg.join(" "));
		} });
		Object.defineProperty(this, "_writeFile", { value: function(msg) {
			msg.push(processMsg(msg.pop(), this.levelFile & Level.DEBUG));
			fs.writeSync(this._getFile(), msg.join(" ") + EOL);
		} });
		Object.defineProperty(this, "_getFile", { value: function() {
			var today = this.constructor._getDate().format("Y-m-d");
			if(this._dayStr != today) {
				this._dayStr = today;
				this._closeFile();
				this._file = fs.openSync(path.join(this._folder, `log_${this._dayStr}.${this.constructor._extension}`), "a+");
			}
			return this._file;
		} });
		Object.defineProperty(this, "_closeFile", { value: function() {
			if(this._file !== null)
				fs.closeSync(this._file);
		} });

		createDirs(this._folder);
    }

	// Public functions
	addLevelConsole(level) {
		this._levelConsole |= level;
		return this;
	}
	delLevelConsole(level) {
		this._levelConsole &= ~level;
		return this;
	}
	setLevelConsole(level) {
		this._levelConsole = level;
		return this;
	}

	addLevelFile(level) {
		this._levelFile |= level;
		return this;
	}
	delLevelFile(level) {
		this._levelFile &= ~level;
		return this;
	}
	setLevelFile(level) {
		this._levelFile = level;
		return this;
	}

	log(loglevel, invoker, msg) {
		var loglevelName = Level.getKeyByValue(loglevel);
		var date = this.constructor._getDate();

		if(Array.isArray(msg)) {
			for (const value of msg)
				this._log(loglevel, invoker, value, date, loglevelName);
		}
		else // if(typeof msg == "string")
			this._log(loglevel, invoker, msg, date, loglevelName);
	}
}