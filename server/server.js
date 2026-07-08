import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '..', 'dist');

// Initialize SQLite database synchronously
const db = new DatabaseSync(path.join(__dirname, 'database.sqlite'));

// Create the tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS applications (
    id TEXT PRIMARY KEY,
    companyName TEXT NOT NULL,
    emailUsed TEXT,
    jobTitle TEXT NOT NULL,
    autoRoleDomain TEXT,
    manualRoleDomainOverride TEXT,
    appliedDate TEXT,
    applicationStatus TEXT,
    jobLink TEXT,
    source TEXT,
    resumeVersion TEXT,
    referralStatus TEXT,
    currentStage TEXT,
    rejectionReason TEXT,
    notes TEXT,
    followUpDate TEXT,
    priority TEXT,
    createdAt INTEGER,
    rounds TEXT,
    recruiters TEXT
  );
`);

// Helper to get request body
function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => resolve(body));
    req.on('error', err => reject(err));
  });
}

const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle CORS preflight options request
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathSegments = url.pathname.split('/').filter(Boolean); // ["api", "applications"]

  // Serve static assets in production if not an API route
  if (pathSegments[0] !== 'api') {
    let filePath = path.join(distPath, url.pathname === '/' ? 'index.html' : url.pathname);
    
    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        // Fallback to index.html for SPA client-side routing
        filePath = path.join(distPath, 'index.html');
      }

      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.webp': 'image/webp'
      };

      const contentType = mimeTypes[ext] || 'application/octet-stream';

      fs.readFile(filePath, (error, content) => {
        if (error) {
          res.writeHead(500);
          res.end('Error loading asset');
        } else {
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(content, 'utf-8');
        }
      });
    });
    return;
  }

  if (pathSegments[0] === 'api' && pathSegments[1] === 'applications') {
    
    // GET /api/applications
    if (req.method === 'GET' && pathSegments.length === 2) {
      try {
        const query = db.prepare('SELECT * FROM applications ORDER BY createdAt DESC');
        const rows = query.all();
        
        // Parse the JSON text columns
        const apps = rows.map((row) => ({
          ...row,
          rounds: row.rounds ? JSON.parse(row.rounds) : [],
          recruiters: row.recruiters ? JSON.parse(row.recruiters) : []
        }));
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(apps));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    // POST /api/applications
    if (req.method === 'POST' && pathSegments.length === 2) {
      try {
        const body = await getRequestBody(req);
        const data = JSON.parse(body);

        const stmt = db.prepare(`
          INSERT INTO applications (
            id, companyName, emailUsed, jobTitle, autoRoleDomain, manualRoleDomainOverride,
            appliedDate, applicationStatus, jobLink, source, resumeVersion, referralStatus,
            currentStage, rejectionReason, notes, followUpDate, priority, createdAt, rounds, recruiters
          ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
          )
        `);

        stmt.run(
          data.id,
          data.companyName,
          data.emailUsed || "",
          data.jobTitle,
          data.autoRoleDomain || "Unclassified",
          data.manualRoleDomainOverride || "",
          data.appliedDate || "",
          data.applicationStatus || "Applied",
          data.jobLink || "",
          data.source || "",
          data.resumeVersion || "",
          data.referralStatus || "No Referral",
          data.currentStage || "New",
          data.rejectionReason || "",
          data.notes || "",
          data.followUpDate || "",
          data.priority || "Normal",
          data.createdAt || Date.now(),
          JSON.stringify(data.rounds || []),
          JSON.stringify(data.recruiters || [])
        );

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    // PUT /api/applications/:id
    if (req.method === 'PUT' && pathSegments.length === 3) {
      try {
        const id = pathSegments[2];
        const body = await getRequestBody(req);
        const data = JSON.parse(body);

        const stmt = db.prepare(`
          UPDATE applications SET
            companyName = ?, emailUsed = ?, jobTitle = ?, autoRoleDomain = ?, manualRoleDomainOverride = ?,
            appliedDate = ?, applicationStatus = ?, jobLink = ?, source = ?, resumeVersion = ?, referralStatus = ?,
            currentStage = ?, rejectionReason = ?, notes = ?, followUpDate = ?, priority = ?, rounds = ?, recruiters = ?
          WHERE id = ?
        `);

        stmt.run(
          data.companyName,
          data.emailUsed || "",
          data.jobTitle,
          data.autoRoleDomain || "Unclassified",
          data.manualRoleDomainOverride || "",
          data.appliedDate || "",
          data.applicationStatus || "Applied",
          data.jobLink || "",
          data.source || "",
          data.resumeVersion || "",
          data.referralStatus || "No Referral",
          data.currentStage || "New",
          data.rejectionReason || "",
          data.notes || "",
          data.followUpDate || "",
          data.priority || "Normal",
          JSON.stringify(data.rounds || []),
          JSON.stringify(data.recruiters || []),
          id
        );

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    // DELETE /api/applications/:id
    if (req.method === 'DELETE' && pathSegments.length === 3) {
      try {
        const id = pathSegments[2];
        const stmt = db.prepare('DELETE FROM applications WHERE id = ?');
        stmt.run(id);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    // POST /api/applications/import
    if (req.method === 'POST' && pathSegments.length === 3 && pathSegments[2] === 'import') {
      try {
        const body = await getRequestBody(req);
        const apps = JSON.parse(body);
        if (!Array.isArray(apps)) {
          throw new Error('Data must be an array of applications');
        }

        // Clear existing table records
        db.exec('DELETE FROM applications');

        const stmt = db.prepare(`
          INSERT INTO applications (
            id, companyName, emailUsed, jobTitle, autoRoleDomain, manualRoleDomainOverride,
            appliedDate, applicationStatus, jobLink, source, resumeVersion, referralStatus,
            currentStage, rejectionReason, notes, followUpDate, priority, createdAt, rounds, recruiters
          ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
          )
        `);

        // Bulk insert records
        for (const data of apps) {
          stmt.run(
            data.id,
            data.companyName,
            data.emailUsed || "",
            data.jobTitle,
            data.autoRoleDomain || "Unclassified",
            data.manualRoleDomainOverride || "",
            data.appliedDate || "",
            data.applicationStatus || "Applied",
            data.jobLink || "",
            data.source || "",
            data.resumeVersion || "",
            data.referralStatus || "No Referral",
            data.currentStage || "New",
            data.rejectionReason || "",
            data.notes || "",
            data.followUpDate || "",
            data.priority || "Normal",
            data.createdAt || Date.now(),
            JSON.stringify(data.rounds || []),
            JSON.stringify(data.recruiters || [])
          );
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(apps));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }
  }

  // 404 Endpoint Not Found
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`[Backend SQLite Server] Running on http://localhost:${PORT}`);
});
