const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const fs = require('fs');
const path = require('path');
const usersFilePath = path.join(__dirname, 'users.json');

app.get('/', (req, res) => {
  res.send(`
        {
            "message": "Bienvenido a nuestra API"
        }
    `);
}); 

app.get('/users/:id', (req, res) => {
  const userId = req.params.id;
  res.send(`Mostrar el valor del usuario con id: ${userId}`);
});

app.get('/search', (req, res) => {
  const term = req.query.term;
  const category = req.query.category;
    res.send(`{<h1>Resultados de busqueda</h1>
        <p>Termino: ${term}</p>
        <p>Categoria: ${category}</p>}`);
    });

app.post('/form', (req, res) => {
    const name = req.body.name || "anónimo";
    const email = req.body.email || "no proporcionado";
    
    res.json({
        message: "Datos recibidos",
        data: {
            name,
            email
        }
    });
});


app.post('/data', (req, res) => {
    const data = req.body;
    
    // Validación para asegurar que recibimos datos válidos
    if (!data || Object.keys(data).length === 0) {
        return res.status(400).json({
            error: "No se recibieron datos"
        });
    }
    
    res.status(200).json({
        message: "Datos JSON recibidos",
        data
    });
});

app.get('/users', (req, res) => {
    fs.readFile(usersFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Error con conexión a la base de datos' });
        }
        const users = JSON.parse(data);
        res.json({ users });
    });
});

app.post('/users', (req, res) => {
    const newUser = req.body;
    fs.readFile(usersFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Error con conexión a la base de datos' });
        }
        const users = JSON.parse(data);
        users.push(newUser);
        fs.writeFile(userFilePath, JSON.stringify(users, null, 2), (err) => {
            if (err) {
                return res.status(500).json({ error: 'Error al guardar el usuario' });
            }
            res.status(201).json(newUser);
        });
    });
});

app.put('/users/:id', (req, res) => {
    const userId = parseInt(req.params.id, 10);
    const updatedUser = req.body;

    console.log("BODY:", updatedUser);
    
    fs.readFile(usersFilePath, 'utf8', (err, data) => {  
        if (err) {
            return res.status(500).json({ error: 'Error con conexión a la base de datos' });
        }
        let  users = JSON.parse(data);
        users = users.map(user => 
            user.id === userId ? { ...user, ...updatedUser } : user);
        fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), err => {
            if (err) {
                return res
                .status(500)
                .json({ error: 'Error al actualizar el usuario' });
            }
            res.json(updatedUser);
        });
    });
});

app.listen(PORT, () => {
  console.log(`Nuestra aplicacion esta funcionando en http://localhost:${PORT}`);
});


