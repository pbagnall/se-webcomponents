import http from "http";
import fs from "fs/promises";
import path from "path";
import Handlebars from "handlebars";

import ServerConfig from "./ServerConfig.js";

Handlebars.registerHelper('inDirectory', function (string1, string2) {
   if (string1 === string2) return true;
   if (string1 === string2.substring(0, string2.lastIndexOf('/')+1)) return true;
   return false;
});

export default class TemplateServer {
   static pages = [
      'Overview',
      'Choose',
      'Choose File',
      'Date Picker',
      'Drop Target',
      'Drop Text',
      // 'Field',
      'Popup',
      'Selection',
      // 'Tab Group',
      // 'Table',
      // 'Text Area',
   ];
   
   static fileTypes = new Map(
      [
         ['css',     { handler: 'serveFile', mimeType: 'text/css' }],
         ['html',    { handler: 'serveFile', mimeType: 'text/html' }],
         ['js',      { handler: 'serveFile', mimeType: 'application/javascript' }],
         ['map',     { handler: 'serveFile', mimeType: 'application/json' }],
         ['jpg',     { handler: 'serveFile', mimeType: 'image/jpeg' }],
         ['png',     { handler: 'serveFile', mimeType: 'image/png' }],
         ['content', { handler: 'serveTemplatedFile',  mimeType: 'text/html' }],
      ]
   );
   
   constructor(configFile) {
      this.config = new ServerConfig(configFile);
   }
   
   async start() {
      this.httpServer = http.createServer((request, response) => this.serve(request, response));

      this.pages = [];
      for (const page of TemplateServer.pages) {
         let pathname = '/';
         if (page!=='Overview') pathname = '/'+page.toLowerCase().replace(' ','-')+'/';

         this.pages.push({ name: page, pathname: pathname });
      }

      await this.getTemplate();
      await this.httpServer.listen(this.config.getPort());
      console.log(`Server is running on port ${this.config.getPort()}`);
   }
   
   async getTemplate() {
      this.code = this.config.getTemplate();
      // console.log(template);
      
      // const { mtime } = await fs.stat(template);
      // if (mtime > this.templateAge) {
         // this.code = await fs.readFile(template, 'utf8');
         this.template = Handlebars.compile(this.code);
      // this.templateAge = mtime;
      // console.log('template reloaded');
      // }
      return this.template;
   }
   
   serve(request, response) {
      const url = new URL(request.url, "http://localhost");
      
      let filePath = path.join(this.config.getPublicRoot(), url.pathname);
      if (filePath.slice(-1) === '/') {
         filePath += 'index.content';
      }
      
      const fileType = filePath.substring(filePath.lastIndexOf('.')+1);
      const typeInfo = TemplateServer.fileTypes.get(fileType);
      
      
      if (!typeInfo) {
         this.serverError(url.pathname, url.search, response, '');
         return;
      }
      
      if (typeInfo.handler==='serveFile') {
         fs.readFile(filePath, 'utf8')
           .then((data) => { this.serveFile(url.pathname, filePath, request, response, data, typeInfo.mimeType); })
           .then(() => { console.log(new Date(), 200, url.pathname, url.search); })
           .catch((err) => this.notFound(url.pathname, url.search, response, err));
      } else {
         fs.readFile(filePath, 'utf8')
           .then((data) => { this.serveTemplatedFile(url.pathname, filePath, request, response, data, typeInfo.mimeType); })
           .then(() => { console.log(new Date(), 200, url.pathname, url.search); })
           .catch((err) => this.notFound(url.pathname, url.search, response, err));
      }
   }
   
   serverError(pathname, search, response, err) {
      response.writeHead(500, { 'Content-Type': 'text/html' });
      response.end(`<html lang="en/gb"><body>Filetype not permitted<br>${err}</body></html>`);
      console.log(new Date(), 500, pathname, search);
   }
   
   notFound(pathname, search, response, err) {
      response.writeHead(404, { 'Content-Type': 'text/html' });
      response.end(`<html lang="en/gb"><body>Page not found<br>${err}</body></html>`);
      console.log(new Date(), 404, pathname, search);
      
   }
   
   serveFile(pathname, filePath, request, response, data, type) {
      response.writeHead(200, { 'Content-Type': type });
      response.end(data);
   }
   
   parseContent(content) {
      const segments = content.split("/////");
      
      const result = {};
      for (let i=1; i<segments.length; i++) {
         const segment = segments[i];
         const firstNewLinePos = segment.indexOf('\n');
         const name = segment.substring(0, firstNewLinePos);
         const content = segment.substring(firstNewLinePos + 1);
         result[name.trim()] = content.trim();
      }
      
      return result;
   }
   
   capitalizeFirstLetter(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
   }
   
   async generateSubnav(pathname) {
      let subnav = '';
      const dir = await fs.readdir(path.dirname(pathname));
      for (const file of dir) {
         if (file === 'index.content') {
            subnav = `<a href='.'>Demo</a>\n` + subnav;
         } else if (file.endsWith('.content')) {
            const name = file.slice(0, -8);
            
            subnav += `<a href='${name}.content'>${this.capitalizeFirstLetter(name)}</a>\n`;
         }
      }
      return subnav;
   }
   
   async serveTemplatedFile(pathname, filePath, request, response, data, type) {
      response.writeHead(200, { 'Content-Type': type });
      const template = await this.getTemplate();
      const contentData = this.parseContent(data);
      contentData.links = this.pages;
      contentData.pathname = pathname;
      contentData.subnav = await this.generateSubnav(filePath);
      const output = template(contentData);
      response.end(output);
   }
}