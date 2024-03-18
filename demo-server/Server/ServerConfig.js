import fs from 'fs';
import path from 'path';

export default class ServerConfig {
   #config;
   #root;
   
   constructor(configFile) {
      this.#config = this.#readJsonFile(configFile);
      this.#root = path.dirname(configFile);
      
      try {
         this.port = this.getInt('port', 1024, 65535, 8080);
         this.template = this.getTextFile('template', 'utf-8');
         this.publicRoot = this.getDirectory('publicRoot');
      
         // console.log(`port = ${this.port}`);
         // console.log(`template = ${this.template}`);
      } catch (e) {
         console.log(e.message);
      }
   }
   
   #readFile(filePath, encoding) {
      return fs.readFileSync(filePath, encoding);
   }
   
   #readJsonFile(filePath) {
      const fileContent = this.#readFile(filePath, 'utf-8');
      try {
         return JSON.parse(fileContent);
      } catch (e) {
         throw new Error(`${filePath} is not a valid JSON file`, { cause: e });
      }
   }
   
   getValue(parameter, allowUndefined) {
      let segment = this.#config;
      let currentPath = '';
      
      const name = parameter.split('.');
      for (let i=0; i<name.length; i++) {
         let value = segment[name[i]];
         
         if (i === name.length-1) {
            if (value !== void 0) {
               return value;
            } else {
               if (allowUndefined) return void 0;
               throw Error(`Parameter '${parameter}' is not specified`);
            }
         } else {
            if (value !== void 0) {
               segment = value;
            } else {
               if (name.length===1) {
                  throw Error(`Parameter '${parameter}' is not specified`);
               } else {
                  throw Error(`Parameter '${parameter}' is not specified.\n   ${currentPath}${name[i]} not found`);
               }
            }
         }
         
         currentPath += name[i]+'.';
      }
   }
   
   getInt(parameter, min, max, defaultValue) {
      let value;
      const undef = void 0; // incorruptible undefined.
      const rawValue = this.getValue(parameter, defaultValue !== undef);
      
      if (rawValue !== undef) {
         value = parseInt(rawValue);
      } else {
         if (defaultValue !== undef) return defaultValue;
      }
      
      if (Number.isNaN(value)) throw Error(`${parameter} must be an Integer`);
      if (Math.floor(value) !== value) throw Error(`${parameter} must be an Integer, found Float.`);
      
      if (value === void 0) {
         return defaultValue;
      } else {
         if (value < min) throw Error(`${parameter} must be at least ${min}`);
         if (value > max) throw Error(`${parameter} must be no <= ${max}`);
      }
      return value;
   }
   
   getJsonFile(parameter) {
      const relativeFilePath = this.getValue(parameter);
      return this.#readJsonFile(path.join(this.#root, relativeFilePath));
   }
   
   getTextFile(parameter, encoding) {
      const relativeFilePath = this.getValue(parameter);
      return this.#readFile(path.join(this.#root, relativeFilePath), encoding);
   }
   
   getDirectory(parameter) {
      const relativePath = this.getValue(parameter);
      const directoryPath = path.join(this.#root, relativePath);
      
      if (!fs.existsSync(directoryPath)) {
         throw Error(`Public root directory '${relativePath}' does no exist`);
      }
      
      if (!fs.lstatSync(directoryPath).isDirectory()) {
         throw Error(`Public root '${relativePath}' must be a directory`);
      }
      
      return directoryPath;
   }
   
   getPort() { return this.port; }
   getTemplate() { return this.template; }
   getPublicRoot() { return this.publicRoot; }
}