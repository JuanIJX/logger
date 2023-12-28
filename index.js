// 13/04/2023

import fs from 'fs' // Nativas
import path from "path" // Nativas
import { EOL } from "os" // Nativas

import { createDirs } from "@ijx/utils"

export const DefInvoker = 0;
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
	static _defPath = "logs";
	static _extension = "txt";
	static _hourFormat = "H:i:s";
	static _getDate = () => new Date();

    constructor(folder) {
		// Variables
		Object.defineProperty(this, '_dayStr', { value: "", writable: true });
		Object.defineProperty(this, '_file', { value: null, writable: true });
		Object.defineProperty(this, '_folder', { value: folder!==undefined ? path.normalize(folder) : this.constructor._defPath });
		Object.defineProperty(this, '_levelConsole', { value: { [DefInvoker]: Level.ALL & ~(Level.DEBUG | Level.HIST)}, writable: true });
		Object.defineProperty(this, '_levelFile', { value: { [DefInvoker]: Level.ALL & ~Level.DEBUG }, writable: true });

		// Functions
		Object.defineProperty(this, "_log", { value: function(loglevel, invoker, msg, date, loglevelName) {
			var _msg = [
				date.format(this.constructor._hourFormat),
				invoker=="" ? null : `[${invoker}]`,
				`(${loglevelName})`,
				msg,
			].filter(e => e!==null);
			if(this._getLevelConsole(invoker) & loglevel) this._writeConsole(_msg);
			if(this._getLevelFile(invoker) & loglevel) this._writeFile(_msg);
		} });
		Object.defineProperty(this, "_writeConsole", { value: function(msg) {
			msg.push(processMsg(msg.pop(), this._levelConsole & Level.DEBUG));
			console.log(msg.join(" "));
		} });
		Object.defineProperty(this, "_writeFile", { value: function(msg) {
			msg.push(processMsg(msg.pop(), this._levelFile & Level.DEBUG));
			fs.writeSync(this._getFile(), msg.join(" ") + EOL);
		} });

		Object.defineProperty(this, "_getLevelConsole", { value: function(invoker) { return this._levelConsole[invoker] ?? this._levelConsole[DefInvoker]; } });
		Object.defineProperty(this, "_getLevelFile", { value: function(invoker) { return this._levelFile[invoker] ?? this._levelFile[DefInvoker]; } });

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
	getLevelConsole(invoker=DefInvoker) { return this._getLevelConsole(invoker); }
	addLevelConsole(level, invoker=DefInvoker) { this._levelConsole[invoker] = this._getLevelConsole(invoker) | level; return this; }
	delLevelConsole(level, invoker=DefInvoker) { this._levelConsole[invoker] = this._getLevelConsole(invoker) & ~level; return this; }
	setLevelConsole(level, invoker=DefInvoker) { this._levelConsole[invoker] = level; return this; }
	clearLevelConsole(invoker) {
		if(invoker == DefInvoker)
			throw new Error(`No se puede eliminar el invoker default`);
		delete this._levelConsole[invoker];
		return this;
	}

	getLevelFile(invoker=DefInvoker) { return this._getLevelFile(invoker); }
	addLevelFile(level, invoker=DefInvoker) { this._levelFile[invoker] = this._getLevelFile(invoker) | level; return this; }
	delLevelFile(level, invoker=DefInvoker) { this._levelFile[invoker] = this._getLevelFile(invoker) & ~level; return this; }
	setLevelFile(level, invoker=DefInvoker) { this._levelFile[invoker] = level; return this; }
	clearLevelFile(invoker) {
		if(invoker == DefInvoker)
			throw new Error(`No se puede eliminar el invoker default`);
		delete this._levelFile[invoker];
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