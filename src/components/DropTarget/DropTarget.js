const dropTargetTemplate = document.createElement('template');
dropTargetTemplate.innerHTML = `
    <style>
        div.droptarget {
            box-sizing: border-box;
            border: 4px dotted #888888;
            width: 100%;
            height: 4rem;
        }
        
        div.active {
            background-color: #dddddd;
        }
    </style>
    <div class='droptarget'>
        <slot name='message'></slot>
        <div id='permitted'></div>
    </div>
`;

export default class DropTarget extends HTMLElement {
   constructor() {
      super();
      this.timeout = 500;
      
      this.attachShadow({mode: 'open'});
      this.shadowRoot.append(dropTargetTemplate.content.cloneNode(true));
      this.target = this.shadowRoot.querySelector("div.droptarget");
      this.target.addEventListener("dragenter", (event) => this.dragEnter(event));
      this.target.addEventListener("dragleave", (event) => this.dragLeave(event));
      this.target.addEventListener("dragover", (event) => this.dragOver(event));
      this.target.addEventListener("dragend", (event) => this.dragEnd(event));
      this.target.addEventListener("drop", (event) => this.drop(event));
   }

   connectedCallback() {
      // parse permitted filetypes
      let allowedList = this.getAttribute('permitted').split(';');
      this.permitted = {};
      for (let allowed of allowedList) {
         // console.log("allowed = "+allowed);
         let [description, mimetype] = allowed.split('=');
         // console.log(description, mimetype);
         this.permitted[mimetype] = description;
      }
   }
   
   setClass(klass) {
      this.target.className="droptarget "+klass;
   }

   dragEnter() {
      this.setClass("active");
      return false;
   }

   dragLeave() {
      this.setClass("inactive");
      return false;
   }

   dragOver(event) {
      event.preventDefault();
      event.stopPropagation();
      return false;
   }

   dragEnd(event) {
      event.preventDefault();
      event.stopPropagation();
      return false;
   }

   isPermittedType(file) {
      for (let mimetype in this.permitted) {
         console.log(`filetype ${file.type} = ${mimetype}, ${file.type === mimetype}`);
         if (file.type === mimetype) {
            return true;
         }
      }

      return false;
   }

   drop(event) {
      this.setClass("inactive");
      event.preventDefault();
      event.stopPropagation();

      console.log("file dropped");

      let files = event.dataTransfer.files;

      if (files.length !== 1) {
         // TODO: show error
         return false;
      }

      console.log("one file dropped");

      let file = files.item(0);

      if (!this.isPermittedType(file)) {
         this.error='Only CSV files are supported.<br />';
         this.errorTimeOut(10);
         return false;
      }

      console.log("It's a valid file");

      let reader = new FileReader();

      reader.onload = (event) => {
         // fire an event with the file content
         console.log("read file");
      };

      reader.readAsDataURL(file);

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
window.customElements.define('ui-droptarget', DropTarget);
