const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

const dbConfig = {
  host: "193.203.166.112",
  user: "u475816193_inventario",
  password: "Inventario23@#1",
  database: "u475816193_inventario",
  connectTimeout: 10000,
  acquireTimeout: 10000,
  connectionLimit: 10,
  queueLimit: 0,
};

const pool = mysql.createPool(dbConfig);

pool.getConnection((err, connection) => {
  if (err) {
    console.error("Error connecting to the database:", err);
    return;
  }
  if (connection) connection.release();
  console.log("Connected to the database");
});

app.use((req, res, next) => {
  req.db = pool;
  next();
});

pool.on("error", function (err) {
  console.error("Database error:", err);
  if (err.code === "PROTOCOL_CONNECTION_LOST") {
    handleDisconnect();
  } else {
    throw err;
  }
});

function handleDisconnect() {
  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error when connecting to db:", err);
      setTimeout(handleDisconnect, 2000);
    }
    if (connection) connection.release();
    console.log("Reconnected to the database");
  });
}

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send("Username y password son requeridos.");
  }

  const sql = "SELECT * FROM usuarios WHERE username = ? AND password = ?";
  req.db.query(sql, [username, password], (err, results) => {
    if (err) {
      console.error("Error querying usuarios table:", err);
      return res.status(500).send("Error en el servidor: " + err.message);
    }

    if (results.length > 0) {
      res.status(200).send({ message: "Login exitoso", user: results[0] });
    } else {
      res.status(401).send("Credenciales incorrectas");
    }
  });
});

app.get("/api/computadoras", (req, res) => {
  const sql = "SELECT * FROM computadoras";
  req.db.query(sql, (err, results) => {
    if (err) {
      console.error("Error querying computadoras table:", err);
      return res
        .status(500)
        .send("Error querying computadoras table: " + err.message);
    }
    res.status(200).send(results);
  });
});

app.get("/api/usuarios", (req, res) => {
  const sql = "SELECT * FROM usuarios";
  req.db.query(sql, (err, results) => {
    if (err) {
      console.error("Error querying usuarios table:", err);
      return res
        .status(500)
        .send("Error querying usuarios table: " + err.message);
    }
    res.status(200).send(results);
  });
});

app.put("/api/computadoras/:id", (req, res) => {
  const { id } = req.params;
  const { stock } = req.body;

  const sql = "UPDATE computadoras SET stock = ? WHERE _id = ?";
  req.db.query(sql, [stock, id], (err, result) => {
    if (err) {
      console.error("Error updating computadoras stock:", err);
      return res
        .status(500)
        .send("Error updating computadoras stock: " + err.message);
    }
    res.status(200).send(result);
  });
});

app.put("/api/computadoras/estado/:id", (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  if (estado !== "disponible" && estado !== "no disponible") {
    return res
      .status(400)
      .send('El campo "estado" debe ser "disponible" o "no disponible".');
  }

  const sql = "UPDATE computadoras SET estado = ? WHERE _id = ?";
  req.db.query(sql, [estado, id], (err, result) => {
    if (err) {
      console.error("Error updating computadoras estado:", err);
      return res
        .status(500)
        .send("Error updating computadoras estado: " + err.message);
    }
    res.status(200).send(result);
  });
});

app.listen(port, () => {
  console.log(`API listening at http://localhost:${port}`);
});
