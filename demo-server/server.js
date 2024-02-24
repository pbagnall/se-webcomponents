import http from 'http';
import fs from 'fs/promises';
import url from 'url';
import path from 'path';

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function serve(request, response) {
   const url = new URL(request.url, "http://localhost");
   
   console.log(url.pathname, url.search);
   
   let filePath = path.join(__dirname, '../public', url.pathname);
   if (filePath.slice(-1) === '/') filePath += 'index.html';

   const fileType = filePath.substring(filePath.lastIndexOf('.')+1);
   const typeInfo = fileTypes.get(fileType);
   
   fs.readFile(filePath)
      .then((data) => { typeInfo.handler(request, response, data, typeInfo.mimeType); })
      .catch(() => notFound(response));
}

function notFound(response) {
   response.writeHead(404, { 'Content-Type': 'text/html' });
   response.end('<html><body>File not found</body></html>');
}

const fileTypes = new Map(
   [
      ['css',    { mimeType: 'text/css', handler: serveFile }],
      ['html',   { mimeType: 'text/html', handler: serveFile }],
      ['js',     { mimeType: 'application/javascript', handler: serveFile }],
      ['map',    { mimeType: 'application/json', handler: serveFile }],
      ['dhtml',  { mimeType: 'text/html', handler: serveTemplatedFile }],
   ]
);

function serveFile(request, response, data, type) {
   response.writeHead(200, { 'Content-Type': type });
   response.end(data);
}

function serveTemplatedFile(request, response, data, type) {
   response.writeHead(200, { 'Content-Type': type });
   response.end(data);
}

const PORT = 8080;
const server = http.createServer(serve);
server.listen(PORT, () => {
   console.log(`Server is running on port ${PORT}`);
});