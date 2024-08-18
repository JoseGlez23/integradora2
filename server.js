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

app.get("/api/computadoras/:id", (req, res) => {
  const { id } = req.params;
  const sql = "SELECT * FROM computadoras WHERE _id = ?";
  req.db.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Error al obtener la computadora:", err);
      return res
        .status(500)
        .send("Error al obtener la computadora: " + err.message);
    }
    if (results.length === 0) {
      return res.status(404).send("Computadora no encontrada");
    }
    res.status(200).send(results[0]);
  });
});

app.post("/api/computadoras", (req, res) => {
  const { marca, modelo, numeroserie, estado, fecha, stock } = req.body;

  if (
    !marca ||
    !modelo ||
    !numeroserie ||
    !estado ||
    !fecha ||
    stock === undefined
  ) {
    return res.status(400).send("Todos los campos son obligatorios.");
  }

  if (stock < 0) {
    return res.status(400).send("El stock no puede ser negativo.");
  }

  const sql =
    "INSERT INTO computadoras (marca, modelo, numeroserie, estado, fecha, stock) VALUES (?, ?, ?, ?, ?, ?)";

  req.db.query(
    sql,
    [marca, modelo, numeroserie, estado, fecha, stock],
    (err, result) => {
      if (err) {
        console.error("Error al agregar la computadora:", err);
        return res
          .status(500)
          .send("Error al agregar la computadora: " + err.message);
      }
      res.status(201).send({
        message: "Computadora agregada exitosamente",
        id: result.insertId,
      });
    }
  );
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
  const { stock, marca, modelo, numeroserie, estado, fecha } = req.body;

  if (stock < 0) {
    return res.status(400).send("El stock no puede ser negativo.");
  }

  const sql =
    "UPDATE computadoras SET stock = ?, marca = ?, modelo = ?, numeroserie = ?, estado = ?, fecha = ? WHERE _id = ?";
  req.db.query(
    sql,
    [stock, marca, modelo, numeroserie, estado, fecha, id],
    (err, result) => {
      if (err) {
        console.error("Error updating computadoras:", err);
        return res
          .status(500)
          .send("Error updating computadoras: " + err.message);
      }
      res.status(200).send(result);
    }
  );
});

app.delete("/api/computadoras/:id", (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM computadoras WHERE _id = ?";
  req.db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error al eliminar la computadora:", err);
      return res
        .status(500)
        .send("Error al eliminar la computadora: " + err.message);
    }
    res.status(200).send({ message: "Computadora eliminada exitosamente" });
  });
});

app.listen(port, () => {
  console.log(`API listening at http://localhost:${port}`);
});
