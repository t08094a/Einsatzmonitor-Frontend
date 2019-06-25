const { init } = require('@sentry/electron');
const config = require('./config.js');

init({
    dsn: config.sentry.dsn,
});