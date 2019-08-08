const dotenv = require('dotenv');
// Read the variables from config file and save them into node.js environment variables
dotenv.config({ path: './config.env' });
const app = require('./app');

//console.log(process.env);

// Start Server
const port = process.env.POPORT || 3000;
app.listen(port, '127.0.0.1', () => {
  console.log('Server is Running');
});
