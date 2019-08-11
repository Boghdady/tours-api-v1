const mongoose = require('mongoose');
const dotenv = require('dotenv');
// Read the variables from config file and save them into node.js environment variables
dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

// Connect to hosted database, to connect with local replace DB with (process.env.DATABASE_LOCAL)
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
  })
  .then(conn => {
    //console.log(conn.connections);
    console.log('DB connected successfully');
  });


// Start Server
const port = process.env.POPORT || 3000;
app.listen(port, '127.0.0.1', () => {
  console.log('Server is Running');
});
