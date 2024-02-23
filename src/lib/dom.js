/**
 *
 * @param tag String
 * @param attributes Object
 * @param text String
 * @returns Element
 */
export function createElement(tag, attributes=null, text=null) {
   const element = document.createElement(tag);
   if (attributes) applyAttributes(element, attributes);
   if (text) element.appendChild(document.createTextNode(text));
   return element;
}

/**
 *
 * @param element Element
 * @param attributes Object
 */
export function applyAttributes(element, attributes) {
   for (const [key, value] of Object.entries(attributes)) {
      element.setAttribute(key, value.toString());
   }
}
