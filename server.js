const express = require("express");
const app = express();
const mysql = require('mysql2');
const http = require("http").Server(app);
const io = require("socket.io")(http);
const path = require("path");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "m1T%83D$",
  database: "chat_app",
});

db.connect((err) => {
  if (err) throw err;
  console.log("Connected to MySQL");
});

app.use(express.static(path.join(__dirname, "public")));
app.get("/", function (req, res) {
  res.render("index.ejs");
});
io.sockets.on("connection", function (socket) {

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

  socket.on("disconnect", function (username) {
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
    });
  });
});

const server = http.listen(7000, function () {
  console.log("listening on *:7000");
});
