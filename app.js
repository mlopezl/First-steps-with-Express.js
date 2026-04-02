const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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


app.listen(PORT, () => {
  console.log(`Nuestra aplicacion esta funcionando en http://localhost:${PORT}`);
});


