const dropTargetTemplate = document.createElement('template');
dropTargetTemplate.innerHTML = `
    <style>
    </style>
    <textarea>foo</textarea>
`;

export default class TextArea extends HTMLElement {
   constructor() {
      super();

      let width = this.attributes['width'].value;
      let height = this.attributes['height'].value;

      this.attachShadow({mode: 'open'});
      this.shadowRoot.append(dropTargetTemplate.content.cloneNode(true));
      this.target = this.shadowRoot.querySelector("textarea");
      this.target.style.width = width;
      this.target.style.height = height;
   }
}
window.customElements.define('ui-textarea', TextArea);
