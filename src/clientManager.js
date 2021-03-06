const commands = require("./commands");
const Quit = require("./commands/quit");
const timeout = require("./utils/timeout");
const Message = require("./models/message");
const logger = require("./utils/logger")();

module.exports = class ClientManager {

	constructor(client) {
		const that = this;
		that.connected = true;
		that.client = client;
		client.buffer = "";
		logger.debug("Client connected");

		client.on("data", function (data) {
			let lines = data.toString().split(/\r\n/);
			if (lines[lines.length - 1] === "") {
				lines = lines.slice(0, lines.length - 1);
			}
			let i;

			for (i = 0; i < lines.length; i += 1) {
				const line = lines[i];
				client.buffer = "";
				client.emit("message", line);
			}

			client.buffer += lines[lines.length - 1];
		});

		client.on("message", (data) => {
			logger.debug(`Raw received: ${data}`);
			const message = Message.fromMessageString(that.client.user ? that.client.user.nick : null, data);

			if (!message.command) {
				return logger.error(`Error, no command in message: ${data}`);
			}

			let commandRun = false;
			commands.forEach((command) => {
				if (command.test(message.command.toUpperCase())) {
					commandRun = true;
					command.run(that, {args: [...message.parameters], command: message.command});
				}
			});
			if (!commandRun) {
				that.send(Message.makeNumeric(Message.Command.ERR_UNKNOWNCOMMAND, message.command.toUpperCase(), that.getUserNick()));
			}
		});
	}

	getUserNick() {
		if (this.user) {
			return this.user.nick;
		}

		return "";
	}

	send(message) {
		if (this.connected) {
			logger.debug(`Raw sending: ${message.getMessageString()}`);
			try {
				this.client.write(`${message.getMessageString()}\r\n`);
			} catch (e) {
				logger.error("Error, no connection anymore");
			}
		} else {
			logger.warn("User not connected, not sending message");
		}
	}

	disconnected(reason) {
		this.connected = false;
		logger.debug(`User ${this.user ? this.user.username : "unknown"} disconnected`);
		Quit.run(this, {args: [reason]});
		timeout.clearInterval(this.user.username);
	}

};
