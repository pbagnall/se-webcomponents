// noinspection ES6UnusedImports
import ChooseFile from "../ChooseFile/ChooseFile.js";
import { createElement } from "../../lib/dom.js";

export default class DropText extends HTMLElement {
   static init() {
      DropText.styleEle = createElement('style');
      DropText.styleEle.textContent = `
          ui-droptext::part(target) {
             box-sizing: border-box;
             border: 4px dotted #888888;
             display: flex;
             flex-direction: column;
             justify-content: center;
             align-items: center;
             width: 100%;
             caret-color: transparent;
          }
        
          ui-droptext::focus {
            border: 4px dotted #ff0000;
          }
        
          ui-droptext::part(active) {
             background-color: #dddddd;
          }

          ui-droptext::part(focus) {
             border: 4px dotted #8888ff;
          }`;
      document.head.appendChild(DropText.styleEle);

      DropText.template = document.createElement('template');
      DropText.template.innerHTML = `
         <div part='target' contenteditable='true'>
            <div id='permitted' part='permitted'>Drop <span id='filetypes'><i>filetypes<i></span> files, <ui-choosefile></ui-choosefile> or paste CSV data.</div>
         </div>`;
   }

   constructor() {
      super();
      this.timeout = 500;

      this.attachShadow({mode: 'open'});
      this.shadowRoot.append(DropText.template.content.cloneNode(true));
      this.target = this.shadowRoot.firstElementChild;
      this.target.addEventListener("dragenter", (event) => this.dragEnter(event));
      this.target.addEventListener("dragleave", (event) => this.dragLeave(event));
      this.target.addEventListener("drop", (event) => this.drop(event));
      this.target.addEventListener("paste", (event) => this.paste(event));
      this.target.addEventListener("mouseenter", (event) => this.mouseEnter(event));
      this.target.addEventListener("mouseleave", (event) => this.mouseLeave(event));
      this.target.addEventListener("keydown", (event) => this.preventTyping(event));

      this.target.tabIndex = this.tabIndex;

      this.setFileTypes();

      this.choosefile = this.shadowRoot.querySelector("ui-choosefile");
      this.choosefile.addEventListener("filechanged", (event) => this.fileChanged(event));

      // This ensures that "this" is set correctly inside the method.
      this.dragEnterBodyProxy = () => this.dragEnterBody();
      this.dragLeaveDetectorIsSet = false;
   }

   setFileTypes() {
      let allowedList = this.attributes['permitted'].value.split(',');
      this.permitted = {};
      for (let allowed of allowedList) {
         let [description, mimetype] = allowed.split('=');
         this.permitted[mimetype] = description;
      }
   }

   setPart(klass) {
      if (klass) {
         this.target.part = "target " + klass;
      } else {
         this.target.part = "target";
      }
   }

   preventTyping(event) {
      if (!event.metaKey && !event.ctrlKey && event.key !== 'Tab') {
         event.preventDefault();
      }
   }

   dragEnter(event) {
      this.overChild = event.target !== this.target;
      this.setPart("active");
   }

   dragLeave(event) {
      if (!this.overChild && event.target === this.target) this.setPart();
      this.overChild = false;
   }

   mouseEnter(event) {
      this.setPart("focus");
      this.target.focus();
   }

   mouseLeave(event) {
      this.setPart();
      this.target.blur();
   }

   isPermittedType(file) {
      for (let mimetype in this.permitted) {
         if (file.type === mimetype) return true;
      }
      return false;
   }

   drop(event) {
      this.setPart("inactive");
      event.preventDefault();
      event.stopPropagation();

      let files = event.dataTransfer.files;

      if (files.length !== 1) {
         // TODO: show error
         return false;
      }

      let file = files.item(0);

      if (!this.isPermittedType(file)) {
         this.error='Only CSV files are supported.<br />';
         this.errorTimeOut(10);
         return false;
      }

      this.fileChanged(file);
   }

   paste(event) {
      console.log(event.clipboardData.types);
      event.preventDefault();

      const mimeTypes = ['text/html', 'text/plain'];

      let data, mimeType;
      for (const type of mimeTypes) {
         data = event.clipboardData.getData(type);
         if (data !== void(0)) {
            mimeType = type;
            break;
         }
      }

      console.log(mimeType);
      console.log(data);

      this.dispatchEvent(
         new CustomEvent("fileloaded", {
            bubbles: true,
            composed: true,
            detail: {
               type: mimeType,
               fileContent: data
            }
         })
      );

      // TODO: pass on the
   }

   fileChanged(file) {
      file.text().then((content) => {
         this.dispatchEvent(
            new CustomEvent("fileloaded", {
               bubbles: true,
               composed: true,
               detail: {
                  type: 'text/csv',
                  fileContent: content
               }
            })
         );
      });

      return false;
   }

   errorTimeOut(remaining) {
      this.error+=".";
      if (remaining > 0) {
         setTimeout(() => { this.errorTimeOut(remaining-1); }, this.timeout);
      } else {
         this.error = null;
      }
   }
}
DropText.init();
customElements.define('ui-droptext', DropText);
