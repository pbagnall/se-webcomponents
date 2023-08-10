const directionmap = document.createElement("template");
// language=HTML
directionmap.innerHTML = `
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Fira+Sans:wght@500&display=swap');
        
        div.buttongroup {
            display: grid;
            grid-template-rows: repeat(5, max-content);
            grid-template-columns: repeat(5, max-content);
            gap: 1px;
            width: min-content;
            padding: 0.5rem;
            border-radius: 0.25rem;
            background: linear-gradient(300deg, #0f0fcc 24%, #88077c 40%, #88077c 60%, #ee8822 80%);

        }
        
        button {
            border: none;
            border-radius: 3px;
            min-height: 2rem;
            min-width: 2rem;
            width: auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-family: 'Fira Sans', sans-serif;
            font-size: 0.75rem;
            font-weight: 500;
            background: #bbbbbb;
            color: black;
        }
        
        button:active,
        button:hover {
            background: #444444;
            color: white;
        }

        button.selected {
            background-color: black;
            color: white;
        }

        button:disabled {
            width: auto;
            background: #dddddd;
            color: #bbbbbb;
        }

        button div.arrow {
            font-family: 'Fira Sans', sans-serif;
            font-weight: 500;
            font-size: 0.7rem;
            line-height: 0.65rem;
            margin: 0.1rem;
        }

        .ne,.nm,.nw { grid-row: 1; flex-direction: column; }
        .se,.sm,.sw { grid-row: 5; flex-direction: column; }
        .en,.em,.es { grid-column: 5; flex-direction: row; }
        .wn,.wm,.ws { grid-column: 1; flex-direction: row; }
        .ne, .se { grid-column: 2; }
        .nm, .sm { grid-column: 3; }
        .nw, .sw { grid-column: 4; }
        .es, .ws { grid-row: 2; }
        .em, .wm { grid-row: 3; }
        .en, .wn { grid-row: 4; }
    </style>
    <div class='buttongroup'>
        <button class='ne'><div class='arrow'>⇨</div>ne</button>
        <button class='nm'><div class='arrow'>⇦⇨</div>nm</button>
        <button class='nw'><div class='arrow'>⇦</div>nw</button>
        <button class='es'>es<div class='arrow'>⇩</div></button>
        <button class='em'>em<div class='arrow'>⇧<br>⇩</div></button>
        <button class='en'>en<div class='arrow'>⇧</div></button>
        <button class='ws'><div class='arrow'>⇩</div>ws</button>
        <button class='wm'><div class='arrow'>⇧<br>⇩</div>wm</button>
        <button class='wn'><div class='arrow'>⇧</div>wn</button>
        <button class='se'>se<div class='arrow'>⇨</div></button>
        <button class='sm'>sm<div class='arrow'>⇦⇨</div></button>
        <button class='sw'>sw<div class='arrow'>⇦</div></button>
    </div>`;

class DirectionMap extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(directionmap.content.cloneNode(true));
        this.opener = (event) => this.openPopup(event);
        this.closer = (event) => this.closePopup(event);
        this.selectedDirectionButton = null;
    }

    // noinspection JSUnusedGlobalSymbols
    connectedCallback() {
        const valid = this.getAttribute('directions').split(",");
        const directions = [
            'ne','nm','nw',
            'ws','wm','wn',
            'es','em','en',
            'se','sm','sw',
        ];

        for (const dir of valid) {
            directions.splice(directions.indexOf(dir), 1);
        }

        for (const button of this.shadowRoot.querySelectorAll("button")) {
            if (directions.includes(button.className)) {
                button.disabled = true;
            } else {
                button.addEventListener("click", this.opener);
            }
        }

        this.invalidDirections = directions.join(",");
    }

    openPopup(event) {
        const button = event.target.closest("button");
        if (this.selectedDirectionButton === button) {
            this.selectedDirectionButton.classList.remove("selected");
            return;
        }

        const allDirections = this.invalidDirections + "," + button.className;

        requestAnimationFrame(() => {
            this.popup = document.getElementById(this.getAttribute('popup'));
            this.popup.addEventListener('close', this.closer);

            this.popup.setAttribute("anchor", this.id);
            this.popup.setAttribute("anchor-direction", allDirections);
            this.popup.open();

            button.classList.add("selected");
            this.selectedDirectionButton = button;
        });
    }

    closePopup() {
        this.popup.removeEventListener('close', this.closer);

        for (const button of this.shadowRoot.querySelectorAll("button")) {
            button.classList.remove("selected");
        }
        this.selectedDirectionButton = null;
    }
}
window.customElements.define('demo-directionmap', DirectionMap);
