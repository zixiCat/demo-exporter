const express = require('express');
const client = require('prom-client');
const os = require('os');

// Create a Registry which registers the metrics
const register = new client.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: 'my-system-info-exporter'
});

// Enable the collection of default metrics
client.collectDefaultMetrics({ register });

// Create custom metrics
const cpuUsage = new client.Gauge({
  name: 'system_cpu_usage',
  help: 'CPU usage percentage'
});

const freeMemory = new client.Gauge({
  name: 'system_free_memory_bytes',
  help: 'Free memory in bytes'
});

const totalMemory = new client.Gauge({
  name: 'system_total_memory_bytes',
  help: 'Total memory in bytes'
});

// Register the custom metrics
register.registerMetric(cpuUsage);
register.registerMetric(freeMemory);
register.registerMetric(totalMemory);

// Function to collect system metrics
function collectMetrics() {
  const cpus = os.cpus();
  const user = cpus.reduce((acc, cpu) => acc + cpu.times.user, 0);
  const nice = cpus.reduce((acc, cpu) => acc + cpu.times.nice, 0);
  const sys = cpus.reduce((acc, cpu) => acc + cpu.times.sys, 0);
  const idle = cpus.reduce((acc, cpu) => acc + cpu.times.idle, 0);
  const irq = cpus.reduce((acc, cpu) => acc + cpu.times.irq, 0);
  const total = user + nice + sys + idle + irq;

  cpuUsage.set(((total - idle) / total) * 100);
  freeMemory.set(os.freemem());
  totalMemory.set(os.totalmem());
}

// Collect metrics every 10 seconds
setInterval(collectMetrics, 10000);

// Set up the Express server
const app = express();

// Endpoint to expose the metrics
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});