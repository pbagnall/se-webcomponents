const glassTemplate = document.createElement('template');
glassTemplate.innerHTML = `
   <style>
      div {
         background-color: #00000000;
         position: fixed;
         top: 0;
         left: 0;
         right: 0;
         bottom: 0;
      }
      
      div.smoked {
        background-color: #00000077;
      }
   </style>
   <div></div>`;

class Glass extends HTMLElement {
   constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.append(glassTemplate.content.cloneNode(true));
      this.clickHandlerFn = (event) => this.clickHandler(event);
      this.div = this.shadowRoot.querySelector("div");
      this.div.addEventListener("click", this.clickHandlerFn);

      if (this.attributes['smoked']) this.div.classList.add("smoked");
   }

   clickHandler(event) {
      event.preventDefault();
      event.stopPropagation();

      // identify target underneath the glass
      this.div.style.pointerEvents = 'none';
      let target = document.elementFromPoint(event.clientX, event.clientY);
      if (target.shadowRoot) {
         target = target.shadowRoot.elementFromPoint(event.clientX, event.clientY);
      }
      this.div.style.pointerEvents = 'auto';

      // pass the event to the element underneath the glass
      target.dispatchEvent(new MouseEvent('click', {
         target: target,
         clientX: event.clientX,
         clientY: event.clientY
      }));

      // repeat the click event through to the client of the glass
      this.dispatchEvent(new Event('click'));
   }
}
window.customElements.define('se-glass', Glass);
