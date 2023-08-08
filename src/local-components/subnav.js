const subnavTemplate = document.createElement("Template");
// language=HTML
subnavTemplate.innerHTML = `
    <style>
        ul {
            display: flex;
            gap: 2rem;
            margin: 0;
            margin-bottom: 1rem;
            width: calc(100% - 1rem);
            color: white;
            background: rgb(44, 39, 125);
            background: linear-gradient(325deg, #090979 24%, #88077c 40%, #88077c 60%, #ee8822 80%);
            flex-direction: row;
            list-style: none;
            padding: 0.5rem;
            
        }

        ul li {
            list-style-position: inside;
        }

        ul li a {
            color: white;
        }
    </style>
`;

class Subnav extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.list = document.createElement('ul');
        this.shadowRoot.appendChild(subnavTemplate.content.cloneNode(true));
        this.shadowRoot.appendChild(this.list);

        for (const child of this.children) this.addLink(child);

        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) this.addLink(node);
            }
        });

        const config = { attributes: true, childList: true, subtree: true };
        observer.observe(this, config);
    }

    addLink(node) {
        if (node.nodeType !== Node.ELEMENT_NODE || node.tagName !== 'A') return;

        const pathname = node.getAttribute('href');
        let content = '';

        if (location.pathname.endsWith('/'+pathname)) {
            content += `<li>${node.textContent}</li>`;
        } else if (pathname === '.' && location.pathname.endsWith('/index.html')) {
            content += `<li>${node.textContent}</li>`;
        } else {
            content += `<li><a href='${pathname}'>${node.textContent}</a></li>`;
        }

        this.list.innerHTML += content;
    }
}
window.customElements.define('demo-subnav', Subnav);
