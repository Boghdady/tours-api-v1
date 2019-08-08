const app = require('./app');

// Start Server
const port = 3000;
app.listen(port, '127.0.0.1', () => {
  console.log('Server is Running');
});
