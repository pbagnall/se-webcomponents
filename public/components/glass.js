const glassTemplate = document.createElement('template');
glassTemplate.innerHTML = `
   <style>
      div {
         background-color: #00000044;
         position: fixed;
         top: 0;
         left: 0;
         right: 0;
         bottom: 0;
      }
   </style>
   <div></div>`;

export default class Glass extends HTMLElement {
   constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.append(glassTemplate.content.cloneNode(true));
      this.clickHandlerFn = () => this.clickHandler();
      this.shadowRoot.firstElementChild.addEventListener("click", this.clickHandlerFn);
   }

   clickHandler(event) {
      this.dispatchEvent(new Event("click"));

      // pass the click event through
   }
}
window.customElements.define('se-glass', Glass);
