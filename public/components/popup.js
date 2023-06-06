const popupTemplate = document.createElement('template');
popupTemplate.innerHTML = `
   <style>
      div#popup {
         border: 1px solid;      
         background-color: white;
         position: absolute;
         width: auto;
         z-index: 1000;
      }
      
      div#inner {
         position: absolute;
      }
      
      div#popup.closed {
         display: none;
      }
   </style>
   <div id='popup' class='closed'>
      <div class='inner'>
         <slot>Popup content</slot>
      </div>
   </div>`;

let currentPopup = null;

class PopUp extends HTMLElement {
   constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.append(popupTemplate.content.cloneNode(true));
      this.popup = this.shadowRoot.querySelector('div#popup');
      this.anchorId = this.attributes['anchor'].value;
      this.anchorDirection = this.attributes['anchor-direction'].value.split(",");

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

   toggle() {
      if (this.popup.classList.contains("closed")) {
         this.open();
      } else {
         this.close();
      }
   }

   close() {
      if (currentPopup !== this) return;

      this.popup.classList.add("closed");
      this.dispatchEvent(new Event("close"));
      currentPopup = null;
      document.documentElement.removeEventListener('click', this.clickedOutside);
   }

   open() {
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
      const popupRect = this.popup.getBoundingClientRect();
      const anchorRect = anchor.getBoundingClientRect();

      let position;
      for (let direction of this.anchorDirection) {
         position = this.calcPosition(direction, anchorRect, popupRect, window.innerWidth, window.innerHeight);
         if (position.fits) break;
      }

      let refRect = this.getReferenceElement().getBoundingClientRect();
      position.x -= refRect.x;
      position.y -= refRect.y;

      this.style.position = 'absolute';
      this.style.left = `${position.x}px`;
      this.style.right = "0";
      this.style.top = `${position.y}px`;

      // Let the event which caused this popup to open pass, before we start listening.
      requestAnimationFrame(() => {
         document.documentElement.addEventListener('click', this.clickedOutside);
      });
   }

   calcPosition(direction, anchorRect, popupRect, windowWidth, windowHeight) {
      let position = { fits: true, direction: direction };

      switch (direction) {
         case "se":
         case "sm":
         case "sw":
            position.y = anchorRect.bottom;
            position.fits = position.y + popupRect.height <= windowHeight;
            break;

         case "ne":
         case "nm":
         case "nw":
            position.y = anchorRect.top - popupRect.height;
            position.fits = position.y >= 0;
            break;

         case "en":
         case "em":
         case "es":
            position.x = anchorRect.right;
            position.fits = position.x + popupRect.width <= windowWidth;
            break;

         case "wn":
         case "wm":
         case "ws":
            position.x = anchorRect.left - popupRect.width;
            position.fits = position.x >= 0;
            break;
      }

      switch (direction) {
         case "se":
         case "ne":
            position.x = anchorRect.left;
            position.fits &&= position.x + popupRect.width <= windowWidth;
            break;

         case "sm":
         case "nm":
            position.x = anchorRect.left + anchorRect.width/2 - popupRect.width/2;
            position.fits &&= position.x >= 0;
            position.fits &&= position.x + popupRect.width <= windowWidth;
            break;

         case "sw":
         case "nw":
            position.x = anchorRect.right - popupRect.width;
            position.fits &&= position.x >= 0;
            break;

         case "en":
         case "wn":
            position.y = anchorRect.bottom - popupRect.height;
            position.fits &&= position.y >= 0;
            break;

         case "em":
         case "wm":
            position.y = anchorRect.top + anchorRect.height/2 - popupRect.height/2;
            position.fits &&= position.y >= 0;
            position.fits &&= position.y + popupRect.height/2 <= windowHeight;
            break;

         case "es":
         case "ws":
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

         let position = window.getComputedStyle(reference).getPropertyValue("position")
         if (["absolute", "relative", "fixed"].includes(position)) return reference;
      }
   }
}
window.customElements.define('se-popup', PopUp);
