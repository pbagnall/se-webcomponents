import url from 'url';
import path from 'path';
import TemplateServer from "./Server/TemplateServer.js";

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const configFile = path.join(__dirname, 'server_config.json');
const server = new TemplateServer(configFile);
await server.start();
