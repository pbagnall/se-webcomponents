const chooseTemplate = document.createElement('template');
chooseTemplate.innerHTML = `<slot name='NAME'></slot>`;

export default class Choose extends HTMLElement {
   static get observedAttributes() {
      return ['showslot'];
   }

   constructor() {
      super();
      this.attachShadow({mode: 'open'});
      this.shadowRoot.append(chooseTemplate.content.cloneNode(true));
      this.setSlot(this?.attributes['showslot']?.value);
   }

   setSlot(slotName) {
      let slot = this.shadowRoot.querySelector("slot");
      slot.setAttribute("name", slotName);
   }

   // noinspection JSUnusedGlobalSymbols
   attributeChangedCallback(name, oldValue, newValue) {
      this.setSlot(newValue);
   }
}

window.customElements.define('ui-choose', Choose);