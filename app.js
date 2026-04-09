const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const loggerMiddleware = require('./middlewares/logger');
const errorHandler = require('./middlewares/errorHandler');
const app = express();
const PORT = process.env.PORT || 3000;
const prisma = new PrismaClient();
const authenticateToken = require('./middlewares/auth');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { validateUser } = require('./utils/validation');


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(loggerMiddleware);
app.use(errorHandler);

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

app.get('/db-users', async (req, res) => {
    try{
        const users = await prisma.user.findMany();
        res.json(users);
    } catch (error){
        res.status(500).json({ error: 'Error al comunicarse a la base de datos' });
    }
})

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

        const validation = validateUser(newUser, users);
        if (!validation.isValid) {
            return res.status(400).json({ error: validation.error });
        }

        users.push(newUser);
        fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), (err) => {
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
    
    fs.readFile(usersFilePath, 'utf8', (err, data) => {  
        if (err) {
            return res.status(500).json({ error: 'Error con conexión a la base de datos' });
        }
        let  users = JSON.parse(data);

        const validation = validateUser(updatedUser, users, userId);
        if (!validation.isValid) {
            return res.status(400).json({ error: validation.error });
        }

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

app.delete('/users/:id', (req, res) => {
    const userId = parseInt(req.params.id, 10);
    
    fs.readFile(usersFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Error con conexión a la base de datos' });
        }
        let users = JSON.parse(data);
        const userExists = users.some(user => user.id === userId);
        
        if (!userExists) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        users = users.filter(user => user.id !== userId);
        fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), err => {
            if (err) {
                return res.status(500).json({ error: 'Error al eliminar el usuario' });
            }
            res.status(204).send();
        });
    });
});

app.get('/error', (req, res, next) => {
  next(new Error('Error intencional'));
});

app.get('/protected-route', authenticateToken, (req, res) => {
    res.send('Esta es una ruta protegida');
});

app.post('/register', async (req, res) => {
    const { email, password, name } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            name,
            role: 'USER'
        }
    });
    res.status(201).json({ message: 'User registered successfully'});
}); 


app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
        return res.status(400).json({ error: 'Invalid email or password' });
    }   

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
        return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '4h' });
    res.json({ token });

});


app.listen(PORT, () => {
  console.log(`Nuestra aplicacion esta funcionando en http://localhost:${PORT}`);
});


