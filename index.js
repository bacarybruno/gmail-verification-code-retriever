const express = require('express');
const app = express();
const { google } = require('googleapis');
const autorize = require('./authorize');
const userId = 'me';
let gmail;

const getVerificationMessage = async () => {
    const gmailQuery = 'from:no-reply@verificationemail.com is:unread'
    const messages = await gmail.users.messages.list({
        userId,
        q: gmailQuery
    });
    const messagesData = messages.data.messages;
    if (messagesData && messagesData.length >= 0) {
        const message = messagesData[0];
        return message;
    }
    return null;
}

const watchVerificationMessage = async (callback) => {
    const message = await getVerificationMessage();
    if (message) return callback(message);
    else return setTimeout(() => watchVerificationMessage(callback), 3000);
};

const getVerificationCode = async (messageId) => {
    const message = await gmail.users.messages.get({
        userId,
        id: messageId,
        format: 'minimal'
    });
    const messageText = message.data.snippet;
    const verificationCode = parseInt(messageText.match(/\d/g).join(''));
    return verificationCode;
};

app.get('/', async (req, res) => {
    const message = await getVerificationMessage();
    let verificationCode = null;
    if (message) {
        verificationCode = await getVerificationCode(message.id);
    }
    res.json({ verificationCode });
});

app.get('/watch', async (req, res) => {
    watchVerificationMessage(async message => {
        const verificationCode = await getVerificationCode(message.id);
        res.json({ verificationCode });
    });
});

app.listen(3000, () => {
    autorize('credentials.json', (auth) => {
        gmail = google.gmail({ version: 'v1', auth });
        console.log('Gmail client is ready!');
    });
    console.log('App listening on port 3000!');
});