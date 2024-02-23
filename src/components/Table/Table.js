export default class Table extends HTMLElement {
   constructor() {
      super();
      this.attachShadow({mode: 'open'});
      this.reset();
      this.headerComponent = this.getAttribute('header') || "th";
      this.cellComponent = this.getAttribute('cell') || "td";
   }

   reset() {
      this.shadowRoot.replaceChildren();
      this.table = document.createElement('table');
      this.shadowRoot.appendChild(this.table);
   }

   setHeaders(header) {
      for (let row of header) {
         this.table.appendChild(this.#makeRow(row, true));
      }
   }

   setData(data) {
      for (let row of data) {
         this.table.appendChild(this.#makeRow(row, false));
      }
   }

   #makeRow(data, header) {
      let tag = header ? this.headerComponent : this.cellComponent;
      let tr = document.createElement('tr');
      for (let cell of data) {
         let td = document.createElement(tag);
         let content = document.createTextNode(cell);
         td.appendChild(content);
         tr.appendChild(td);
      }
      return tr;
   }

   hideData() {

   }
}

window.customElements.define('ui-table', Table);
