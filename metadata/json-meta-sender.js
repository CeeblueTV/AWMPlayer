#!/usr/bin/env node

import path from "path";
import net from "net";

function usage() {
	console.log("Usage: \n\n", path.basename(process.argv[1]), "<host> [<port>]\n",
		"	- host : TCP host of MistOutJSONLine\n",
		"	- port : TCP port of MistOutJSONLine (default is 3456)\n");
}

const TIMECODE_INTERVAL = 1000;

function main() {
	let host = process.argv[2];
	if (!host) {
		return usage();
	}
	console.log("Sending timecode every", TIMECODE_INTERVAL, "milliseconds");

	const client = net.connect(Number(process.argv[2]) || 3456, host);
	client.on("connection", function() {
		console.log("connection");
	});
	client.on("data", function(data) {
		console.log("data");
	});
	client.on("close", function(err) {
		console.log("Client closed");
		process.exit();
	});
	client.on("error", function(err) {
		console.log("error : ", err);
	});

	setInterval(() => {
		// TODO: make it generic, not related with "winfinity"
		let metadata = `{"winfinity": {"timecode":${Date.now()}}}\n`;
		//console.log("Sending JSON metadata :", metadata);
		client.write(metadata);
	}, TIMECODE_INTERVAL);

	console.info("Type any JSON additional content to send :");
	process.stdin.on("data", data => {
		client.write(`{"winfinity": ${data} + "}\n`);
	})

	function terminate(signal) {
		if (signal)
			console.info(`Signal ${signal} received, terminating the process...`);
		client.destroy();
		process.exit();
	}
	process.on("SIGABRT", terminate);
	process.on("SIGINT", terminate);
	process.on("SIGTERM", terminate);
}
main();
