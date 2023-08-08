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
         background: var(--background, #ffffff);
         background-color: var(--popup-backgroundColor);
         background-position: top;
         padding: var(--popup-padding);
         position: absolute;
         width: var(--width, auto);
         height: var(--height, auto);
         max-width: var(--max-width);
         z-index: 10;
         
         
         /* added will-change to work around a bug in Safari */
         will-change: filter;
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

   /**
    * Gets an element by id, but not restricted to inside the component. Once it hits the shadowRoot it breaks out
    * and looks further up the document tree
    * @param id
    * @returns {HTMLElement|null}
    */
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
      if (this.hasAttribute('anchor-direction')) {
         this.anchorDirection = this.attributes['anchor-direction'].value
             .split(",")
             .map((value) => value.trim());
      } else {
         this.anchorDirection = 'se,sm,sw,ne,nm,nw,es,em,sn,ws,wm,wn'.split(',');
      }

      if (currentPopup !== null && currentPopup !== this) currentPopup.close();
      currentPopup = this;

      this.popup.classList.remove("closed");
      this.dispatchEvent(new Event("open"));
      const anchor = this.getElementByIdBreakout(this.anchorId);
      if (anchor === null) {
         console.error(`Popup can't locate anchor element (id=${this.anchorId})`);
         return;
      }

      const anchorRect = anchor.getBoundingClientRect();
      const popupRef = this.getReferenceElement(this);
      const anchorRef = this.getReferenceElement(anchor);

      let position;
      for (let direction of this.anchorDirection) {
         position = this.calcPosition(direction, anchorRect, popupRef, anchorRef);
         if (position.fits) break;
      }

      // Let the event which caused this popup to open pass, before we start listening.
      requestAnimationFrame(() => {
         document.documentElement.addEventListener('click', this.clickedOutside);
      });
   }

   calcPosition(direction, anchorRect, popupRef, anchorRef) {
      const popupRefRect = popupRef.getBoundingClientRect();
      const anchorRefRect = anchorRef.getBoundingClientRect();
      const scrollBarWidth = popupRefRect.width - popupRef.clientWidth;
      const scrollBarHeight = popupRefRect.height - popupRef.clientHeight;

      let position = { fits: false, direction: direction };
      this.popup.style.top = null;
      this.popup.style.bottom = null;
      this.popup.style.left = null;
      this.popup.style.right = null;
      let popupRect;

      switch (direction.slice(0,1)) {
         case "n":
            this.popup.style.bottom = (popupRefRect.bottom - anchorRect.top - scrollBarHeight - popupRef.scrollTop) + "px";
            popupRect = this.popup.getBoundingClientRect();
            position.fits = anchorRect.top > popupRect.height;
            break;

         case "s":
            this.popup.style.top = (anchorRect.bottom - popupRefRect.top) + "px";
            popupRect = this.popup.getBoundingClientRect();
            position.fits = popupRefRect.height - anchorRect.bottom - scrollBarHeight > popupRect.height;
            break;

         case "e":
            this.popup.style.left = (anchorRect.right - popupRefRect.left - popupRef.scrollLeft) +"px";
            popupRect = this.popup.getBoundingClientRect();
            position.fits = popupRefRect.width - anchorRect.right - scrollBarWidth > popupRect.width;
            break;

         case "w":
            this.popup.style.right = (popupRefRect.right - anchorRect.left - scrollBarWidth) + "px";
            popupRect = this.popup.getBoundingClientRect();
            position.fits = anchorRect.left > popupRect.width;
            break;
      }

      switch (direction) {
         case "en":
         case "wn":
            // this.popup.style.left = '0';
            // this.popup.style.right = '0';
            this.popup.style.bottom = (popupRefRect.height - anchorRect.bottom + popupRefRect.top) + "px";
            popupRect = this.popup.getBoundingClientRect();
            position.fits &&= anchorRect.bottom > popupRect.height;
            break;

         case "es":
         case "ws":
            this.popup.style.top = (anchorRect.top - popupRefRect.top) + "px";
            popupRect = this.popup.getBoundingClientRect();
            position.fits &&= popupRefRect.height - anchorRect.top > popupRect.height;
            break;

         case "se":
         case "ne":
            this.popup.style.left = (anchorRect.left - popupRefRect.left)+"px";
            popupRect = this.popup.getBoundingClientRect();
            position.fits &&= popupRefRect.width - anchorRect.left - scrollBarWidth > popupRect.width;
            break;

         case "sw":
         case "nw":
            this.popup.style.right = (popupRefRect.width - anchorRect.right + popupRefRect.left - scrollBarWidth)+"px";
            popupRect = this.popup.getBoundingClientRect();
            position.fits &&= anchorRect.right > popupRect.width;
            break;

         case "sm":
         case "nm":
            this.popup.style.left = '0';
            popupRect = this.popup.getBoundingClientRect();
            if ((anchorRect.left + anchorRect.width/2) >= popupRect.width/2) {
               this.popup.style.left = (anchorRect.left + anchorRect.width / 2 - popupRect.width / 2) + "px";
               popupRect = this.popup.getBoundingClientRect();
            } else {
               this.popup.style.left = '0';
               this.popup.style.right = (popupRefRect.right - (anchorRect.left + anchorRect.width / 2) * 2) + "px";
               popupRect = this.popup.getBoundingClientRect();
            }
            position.fits &&= (anchorRect.left + anchorRect.width / 2) > (popupRect.width / 2);
            position.fits &&= (anchorRefRect.width - anchorRect.right + anchorRect.width / 2) > popupRect.width / 2;
            break;

         case "em":
         case "wm":
            this.popup.style.top = '0';
            popupRect = this.popup.getBoundingClientRect();
            if ((anchorRect.top + anchorRect.height/2) >= popupRect.height/2) {
               this.popup.style.top = (anchorRect.top + anchorRect.height / 2 - popupRect.height / 2 - popupRefRect.top) + "px";
               popupRect = this.popup.getBoundingClientRect();
            } else {
               this.popup.style.top = '0';
               this.popup.style.bottom = (popupRefRect.bottom - (anchorRect.top + anchorRect.height / 2) * 2 - popupRefRect.top) + "px";
               popupRect = this.popup.getBoundingClientRect();
            }

            position.fits &&= (anchorRect.top + anchorRect.height / 2) > (popupRect.height / 2);
            position.fits &&= (anchorRefRect.height - anchorRect.bottom + anchorRect.height / 2) > popupRect.height / 2;
            break;
      }

      return position;
   }

   getReferenceElement(reference) {
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
