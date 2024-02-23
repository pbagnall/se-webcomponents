import { createElement } from "../lib/dom.js";

const pages = [
   'Overview',
   // 'Choose',
   // 'Choose File',
   'Date Picker',
   // 'Drop Target',
   // 'Drop Text',
   // 'Field',
   'Popup',
   'Selection',
   // 'Tab Group',
   // 'Table',
   // 'Text Area',
];

function renderNav() {
   const nav = document.getElementsByTagName('nav')[0];
   const ul = createElement('ul');

   for (const name of pages) {
      let url, li, matches;
      
      if (name==='Overview') {
         url = '/';
         matches = location.pathname === '/';
      } else {
         url = '/' + name.toLowerCase().replace(' ', '-') + '/';
         matches = location.pathname.substring(0, url.length) === url;
      }
      
      if (matches) {
         li = createElement('li', { class: 'selected' }, name);
      } else {
         li = createElement('li');
         li.appendChild(createElement('a', { href: url }, name));
      }
      
      ul.appendChild(li);
   }
   nav.appendChild(ul);
}

addEventListener('load', renderNav);