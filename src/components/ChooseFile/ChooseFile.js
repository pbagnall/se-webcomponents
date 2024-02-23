const chooseFileTemplate = document.createElement('template');
chooseFileTemplate.innerHTML = `
      <style>
         input { display: none; }
         
         label {
            background-color: #1144dd;
            color: #eeeeee;
            border: none;
            border-radius: 4px;
            padding: 0 4px;
         }
      </style>
      <label>
         <input type='file' accept='' />
         <slot>Choose file</slot>
      </label>`;

export default class ChooseFile extends HTMLElement {
   constructor() {
      super();
      this.attachShadow({mode: 'open'});
      this.shadowRoot.append(chooseFileTemplate.content.cloneNode(true));

      this.input = this.shadowRoot.querySelector("input");
      this.input.addEventListener('change', (event) => this.fileChosen(event))
   }
   
   // noinspection JSUnusedGlobalSymbols
   connectedCallback() {
      if (this.hasAttribute('accept')) {
         this.input.accept=this.getAttribute('accept');
      }
   }
   
   fileChosen() {
      let fileChangedEvent = new Event("filechanged");
      fileChangedEvent.file = this.input.files[0];
      this.dispatchEvent(fileChangedEvent);
   }
}

window.customElements.define('ui-choosefile', ChooseFile);
