/**
 * Returns a simple keboard shortcut style key string from a keyboard event
 * @param keyEvent
 * @returns {string}
 */
export function getShortcut(keyEvent) {
   let key = keyEvent.key.toString();
   if (keyEvent.keyCode >= 0x30 && keyEvent.keyCode<= 0x39) key = String.fromCharCode(keyEvent.keyCode);
   if (keyEvent.code.startsWith("Digit")) key = keyEvent.code.substring(5);
   if (keyEvent.keyCode === 32) key = "Space";

   if (["Shift","Control","Alt","Meta"].includes(key)) return key;

   let shifting = '';
   if (keyEvent.altKey) shifting += "A";
   if (keyEvent.ctrlKey) shifting += "C";
   if (keyEvent.metaKey) shifting += "M";
   if (keyEvent.shiftKey) shifting += "S";
   if ((shifting !== '' && shifting !=='S') || (shifting !=='' && [...key].length > 1)) {
      key = shifting+"-"+key;
   }

   return key;
}
