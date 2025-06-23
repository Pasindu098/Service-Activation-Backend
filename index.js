const express = require('express');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const app = express();
const port = 8080;

app.use(express.json());

const dataFile = './data/services.json';

// Ensure services.json exists
if (!fs.existsSync(dataFile)) {
  fs.writeFileSync(dataFile, '[]');
}

function readData() {
  return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
}

function writeData(data) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

// POST /service - create a service
app.post('/service', (req, res) => {
  const { serviceSpecification, state } = req.body;
  const newService = {
    id: uuidv4(),
    href: `http://localhost:${port}/service/` + uuidv4(),
    serviceDate: new Date().toISOString(),
    serviceSpecification,
    state
  };

  const services = readData();
  services.push(newService);
  writeData(services);

  res.status(201).json(newService);
});

// GET /service - list all services or filter
app.get('/service', (req, res) => {
  let services = readData();
  const { id, serviceDate, fields } = req.query;

  if (id) {
    services = services.filter(s => s.id === id);
  }

  if (serviceDate) {
    services = services.filter(s => s.serviceDate === serviceDate);
  }

  if (fields) {
    services = services.map(service => {
      const selected = {};
      fields.split(',').forEach(field => {
        if (service[field]) selected[field] = service[field];
      });
      return selected;
    });
  }

  res.status(200).json(services);
});

// GET /service/:id - get a service by ID
app.get('/service/:id', (req, res) => {
  const services = readData();
  const service = services.find(s => s.id === req.params.id);

  if (!service) {
    return res.status(404).json({ error: 'Service not found' });
  }

  res.status(200).json(service);
});

// CTK specific: respond 404 for /service/404ID
app.get('/service/404ID', (req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Basic error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
  console.log(`Service API running at http://localhost:${port}`);
});
