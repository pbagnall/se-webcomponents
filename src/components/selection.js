import { setupInput, updateValue } from '../lib/inputElement.js';

const selectionTemplate = document.createElement('template');
selectionTemplate.innerHTML = `
   <style>
      div#list {
         display: flex;
         flex-direction: column;
         gap: var(--gap, 0);

         border-width: var(--border-width, 1px);
         border-style: var(--border-style, solid);

         padding: var(--padding, 0);
         background-color: var(--background-color, white);

         width: max-content;
         z-index: 10;
      }

      div.item {
         padding: var(--item-padding, 0.125rem 0.25rem);
         cursor: default;
      }      

      div.item:hover {
         background-color: var(--item-background-color-hover, #d1d1ff);      
         color: var(--item-color-hover, black);
      }

      div.item.selected {
         background-color: var(--item-background-color-selected, #4444ff);
         color: var(--item-color-selected, white);
      }
   </style>
   <div id='list'>
   </div>`;

class Selection extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.append(selectionTemplate.content.cloneNode(true));
        this.list = this.shadowRoot.querySelector('div#list');
        this.clickItem = (event) => this.itemClicked(event);
    }

    setupInput = setupInput;
    updateValue = updateValue;

    connectedCallback() {
        this.setupInput();

        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'OPTION') {
                        this.list.appendChild(this.createItem(node.attributes.getNamedItem('value'), node.textContent));
                    }
                }

                for (const node of mutation.removedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'OPTION') {
                        const element = this.findItem(node.attributes.getNamedItem('value'), node.textContent);
                        this.list.removeChild(element);
                    }
                }
            }
        });

        const config = { attributes: true, childList: true, subtree: true };
        observer.observe(this, config);
    }

    itemClicked(event) {
        for (const item of this.list.children) {
            item.classList.remove("selected");
        }

        const item = event.target;
        const itemSelectedEvent = new Event("selected");
        item.classList.add("selected");
        itemSelectedEvent.value = item.attributes['value'].value;
        itemSelectedEvent.description = item.textContent;
        this.updateValue(itemSelectedEvent.value);
        this.dispatchEvent(itemSelectedEvent);
    }

    createItem(value, description) {
        const element = document.createElement("div");
        element.className = 'item';
        element.appendChild(document.createTextNode(description));
        element.attributes['value'] = value;
        element.addEventListener("click", this.clickItem);
        return element;
    }

    findItem(value, description) {
        for (const div of this.list.children) {
            if (div.attributes['value'] === value && div.textContent === description) return div;
        }
        return null;
    }
}
window.customElements.define('se-selection', Selection);
