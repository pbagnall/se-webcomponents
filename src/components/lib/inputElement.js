export function setupInput() {
    if (this.attributes['name']) {
        this.mixin_inputElement = document.createElement('input');
        this.mixin_inputElement.setAttribute('type', 'hidden');
        this.mixin_inputElement.setAttribute('name', this.attributes['name'].value);
        this.appendChild(this.mixin_inputElement);
    }
}

export function updateValue(value) {
    console.log('update', value);
    if (this.mixin_inputElement) {
        this.mixin_inputElement.setAttribute('value', value);
    }
}
