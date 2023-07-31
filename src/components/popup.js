const popupTemplate = document.createElement('template');
popupTemplate.innerHTML = `
   <style>
      div#popup {
         --popup-borderWidth: var(--borderWidth, 1px);
         --popup-borderStyle: var(--borderStyle, solid);
         --popup-backgroundColor: var(--backgroundColor, white);
         --popup-padding: var(--padding, 0.5rem);
      
         border-width: var(--popup-borderWidth);      
         border-style: var(--popup-borderStyle);
         background-color: var(--popup-backgroundColor);
         padding: var(--popup-padding);
         position: absolute;
         width: auto;
         max-width: var(--max-width);
         z-index: 10;
         
         filter: drop-shadow(0 0 6px #00000060);
      }
      
      div#popup.closed {
         display: none;
      }
   </style>
   <div id='popup' class='closed'>
      <slot>Popup content</slot>
   </div>`;

let currentPopup = null;

class PopUp extends HTMLElement {
   constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.append(popupTemplate.content.cloneNode(true));
      this.popup = this.shadowRoot.querySelector('div#popup');
      this.clickedOutside = (event) => {
         if (event.composedPath()[0].closest("se-popup") !== this) {
            this.close(event);
         }
      }
   }

   getElementByIdBreakout(id) {
      let root = this.shadowRoot;
      let element = null;
      do {
         root = root.getRootNode();
         element = root.getElementById(id);
         if (element) return element;
         if (root === document) return null;
         root = root.host;
      } while (true);
   }

   close() {
      if (currentPopup !== this) return;

      this.popup.classList.add("closed");
      this.dispatchEvent(new Event("close"));
      currentPopup = null;
      document.documentElement.removeEventListener('click', this.clickedOutside);
   }

   open() {
      this.anchorId = this.attributes['anchor'].value;
      this.anchorDirection = this.attributes['anchor-direction'].value.split(",");

      if (currentPopup === this) return;
      if (currentPopup !== null) currentPopup.close();
      currentPopup = this;

      this.popup.classList.remove("closed");
      this.dispatchEvent(new Event("open"));
      const anchor = this.getElementByIdBreakout(this.anchorId);
      if (anchor === null) {
         console.error(`Popup can't locate anchor element (id=${this.anchorId})`);
         return;
      }

      const anchorRect = anchor.getBoundingClientRect();
      const ref = this.getReferenceElement();

      let position;
      for (let direction of this.anchorDirection) {
         position = this.calcPosition(direction, anchorRect, ref);
         if (position.fits) break;
      }

      // Let the event which caused this popup to open pass, before we start listening.
      requestAnimationFrame(() => {
         document.documentElement.addEventListener('click', this.clickedOutside);
      });
   }

   calcPosition(direction, anchorRect, ref) {
      const refRect = ref.getBoundingClientRect();
      const refWidth = ref.clientWidth;
      const scrollBarWidth = refRect.width - ref.clientWidth;
      const scrollBarHeight = refRect.height = ref.clientHeight;
      const windowWidth = document.documentElement.clientWidth;
      const windowHeight = document.documentElement.clientHeight;

      let position = { fits: false, direction: direction };
      this.popup.style.top = null;
      this.popup.style.bottom = null;
      this.popup.style.left = null;
      this.popup.style.right = null;
      let popupRect;

      switch (direction) {
         case "se":
         case "sm":
         case "sw":
            this.popup.style.top = (anchorRect.bottom - refRect.top) + "px";
            popupRect = this.popup.getBoundingClientRect();
            position.fits = anchorRect.bottom + popupRect.height <= windowHeight;
            break;

         case "ne":
         case "nm":
         case "nw":
            this.popup.style.bottom = (refRect.bottom - anchorRect.top) + "px";
            popupRect = this.popup.getBoundingClientRect();
            position.fits = position.y >= 0;
            break;

         case "en":
         case "em":
         case "es":
            this.popup.style.left = anchorRect.right+"px";
            popupRect = this.popup.getBoundingClientRect();
            position.fits = position.x + popupRect.width <= windowWidth;
            break;

         case "wn":
         case "wm":
         case "ws":
            this.popup.style.right = (refRect.width - anchorRect.left) + "px";
            popupRect = this.popup.getBoundingClientRect();
            position.fits = position.x >= 0;
            break;
      }

      switch (direction) {
         case "se":
         case "ne":
            this.popup.style.left = (anchorRect.left - refRect.left)+"px";
            popupRect = this.popup.getBoundingClientRect();
            position.fits &&= anchorRect.left + popupRect.width <= windowWidth;
            break;

         case "sm":
         case "nm":
            this.popup.style.left = '0';
            popupRect = this.popup.getBoundingClientRect();
            if ((anchorRect.left + anchorRect.width/2) >= popupRect.width/2) {
               this.popup.style.left = (anchorRect.left + anchorRect.width / 2 - popupRect.width / 2) + "px";
            } else {
               this.popup.style.left = '0';
               this.popup.style.right = (refRect.right - (anchorRect.left + anchorRect.width / 2) * 2) + "px";
            }
            position.fits &&= position.x >= 0;
            position.fits &&= position.x + popupRect.width <= windowWidth;
            break;

         case "sw":
         case "nw":
            this.popup.style.right = (windowWidth - anchorRect.right - scrollBarWidth)+"px";
            popupRect = this.popup.getBoundingClientRect();
            position.fits &&= popupRect.left > 0;
            break;

         case "en":
         case "wn":
            this.popup.style.bottom = (refRect.height - anchorRect.bottom) + "px";
            position.y = anchorRect.bottom - popupRect.height;
            position.fits &&= position.y >= 0;
            break;

         case "em":
         case "wm":
            this.popup.style.top = '0';
            popupRect = this.popup.getBoundingClientRect();
            this.popup.style.top = (anchorRect.top + anchorRect.height/2 - popupRect.height/2) + "px";
            position.fits &&= position.y >= 0;
            position.fits &&= position.y + popupRect.height/2 <= windowHeight;
            break;

         case "es":
         case "ws":
            this.popup.style.top = anchorRect.top + "px";
            position.y = anchorRect.top;
            position.fits &&= position.y >= 0;
            break;
      }

      return position;
   }

   getReferenceElement() {
      let reference = this;

      while (true) {
         reference = reference.parentNode;
         if (reference.nodeType === Node.DOCUMENT_FRAGMENT_NODE) reference = reference.host;
         if (reference.nodeType === Node.DOCUMENT_NODE) return document.documentElement;

         let position = window.getComputedStyle(reference).getPropertyValue("position");
         if (["absolute", "relative", "fixed"].includes(position)) return reference;
         if (reference === document.documentElement) return reference;
      }
   }
}
window.customElements.define('se-popup', PopUp);
