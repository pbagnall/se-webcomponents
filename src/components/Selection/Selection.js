import { setupInput as si, updateValue as uv } from '../lib/inputElement.js';

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

    setupInput = si;
    updateValue = uv;

    // noinspection JSUnusedGlobalSymbols
    connectedCallback() {
        this.setupInput();

        for (const child of this.children) {
            this.addListItem(child);
        }
        this.ensureSelection();
        
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) this.addListItem(node);
                for (const node of mutation.removedNodes) this.removeListItem(node);
            }
            this.ensureSelection();
        });

        const config = { attributes: true, childList: true, subtree: true };
        observer.observe(this, config);
    }

    itemClicked(event) {
        for (const item of this.list.children) {
            item.classList.remove("selected");
        }

        const item = event.target;
        item.classList.add("selected");

        const itemSelectedEvent = new Event("selected");
        itemSelectedEvent.value = item.attributes['value'].value;
        itemSelectedEvent.description = item.textContent;

        this.updateValue(itemSelectedEvent.value);
        this.dispatchEvent(itemSelectedEvent);
    }

    addListItem(node) {
        if (node.nodeType !== Node.ELEMENT_NODE || node.tagName !== 'OPTION') return;

        const value = node.getAttribute('value');
        const description = node.textContent;
        const element = document.createElement("div");
        element.className = 'item';
        element.appendChild(document.createTextNode(description));
        element.setAttribute('value', value);
        element.addEventListener("click", (event) => { this.clickItem(event) });
        this.list.appendChild(element);
    }

    ensureSelection() {
        let nothingSelected = true;
        for (const item of this.list.children) {
            if (item.classList.contains('selected')) {
                nothingSelected = false;
                break;
            }
        }
        if (nothingSelected) {
            const item = this.list.firstElementChild;
            if (item) {
                const value = item.getAttribute('value');
                item.classList.add('selected');
                this.value = value;
                this.description = item.textContent;
                this.updateValue(value);
            }
        }
    }

    selectNextOrPrevious(nextOrPrevious) {
        for (const div of this.list.children) {
            if (div.classList.contains("selected") && div[nextOrPrevious]) {
                div.classList.remove("selected");
                div[nextOrPrevious].classList.add("selected");
                break;
            }
        }
    }

    selectNext() { return this.selectNextOrPrevious('nextElementSibling'); }
    selectPrevious() { return this.selectNextOrPrevious('previousElementSibling'); }

    commit() {
        for (const item of this.list.children) {
            if (item.classList.contains("selected")) {
                const itemSelectedEvent = new Event("selected");
                itemSelectedEvent.value = item.attributes['value'].value;
                itemSelectedEvent.description = item.textContent;

                this.updateValue(itemSelectedEvent.value);
                this.dispatchEvent(itemSelectedEvent);
                return;
            }
        }
    }

    removeListItem(node) {
        if (node.nodeType !== Node.ELEMENT_NODE || node.tagName !== 'OPTION') return;

        const value = node.getAttribute('value');
        const description = node.textContent;

        const element = this.findItem(value, description);
        this.list.removeChild(element);
    }

    findItem(value, description) {
        for (const div of this.list.children) {
            console.log(div, div.getAttribute('value'), value, div.textContent, description);
            if (div.getAttribute('value') === value && div.textContent === description) return div;
        }
        return null;
    }
}
window.customElements.define('se-selection', Selection);
