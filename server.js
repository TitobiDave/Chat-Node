const express = require("express");
const app = express();
const mysql = require("mysql2");
const http = require("http").Server(app);
const io = require("socket.io")(http);
const path = require("path");

// 1️⃣ Connect to MySQL server without specifying DB first
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "m1T%83D$",
});

db.connect((err) => {
  if (err) throw err;
  console.log("Connected to MySQL server");

  // 2️⃣ Create database if not exists
  db.query("CREATE DATABASE IF NOT EXISTS chat_app", (err) => {
    if (err) throw err;
    console.log("Database 'chat_app' ready");

    // 3️⃣ Use the database
    db.changeUser({ database: "chat_app" }, (err) => {
      if (err) throw err;

      // 4️⃣ Create messages table if not exists
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS messages (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(255),
          prevName VARCHAR(255),
          message TEXT,
          time DATETIME
        )
      `;
      db.query(createTableQuery, (err) => {
        if (err) throw err;
        console.log("Table 'messages' ready");
      });
    });
  });
});

app.use(express.static(path.join(__dirname, "public")));

app.get("/", function (req, res) {
  res.render("index.ejs");
});

io.sockets.on("connection", function (socket) {
  // Load past messages on connect
  db.query("SELECT * FROM messages ORDER BY time ASC", (err, results) => {
    if (err) console.log(err);
    else {
      socket.emit("past_messages", results); // send past messages
    }
  });

  socket.on("username", function (username) {
    socket.username = username;
    io.emit("is_online", "🔵 <i>" + socket.username + " join the chat..</i>");
  });

  socket.on("disconnect", function () {
    io.emit("is_online", "🔴 <i>" + socket.username + " left the chat..</i>");
  });

  socket.on("prevName", function (username) {
    socket.prevName = username;
  });

  socket.on("chat_message", function (data) {
    const time = new Date();
    db.query(
      "INSERT INTO messages (username, prevName, message, time) VALUES (?, ?, ?, ?)",
      [data.username, data.prevName, data.message, time],
      (err, result) => {
        if (err) console.log(err);
      }
    );

    io.emit("chat_message", {
      username: socket.username,
      message: data.message,
      prevName: data.prevName,
      time: time,
    });
  });
});

const server = http.listen(7000, function () {
  console.log("listening on *:7000");
});
