
const User = require("../src/models/user");

module.exports = {
    mockClient: (userOrNick, mockSend) => {
        let user;
        if (typeof userOrNick === "string") {
            user = new User(userOrNick);
        } else {
            user = userOrNick;
        }

        return jest.fn().mockImplementation(() => ({
            user: user,
            send: mockSend,
            sendMessage: mockSend,
            sendNotice: mockSend,
            getUserNick: () => user.nick,
            connected: true,
            disconnected: jest.fn()
        }))
    }
}