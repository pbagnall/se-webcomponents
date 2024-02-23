const encodings = {
   'entities': { encodingType: '', fn: encodeEntities },
   'entitiesStripSpaces': { encodingType: '', fn: encodeEntitiesStripSpaces }
};

export function getDataUrl(type, encoding, content, reduceSpaces) {
   if (encodings[encoding]) {
      const encodedContent = encodings[encoding].fn(content, reduceSpaces);
      const encodingType = encodings[encoding].encodingType;
      return `data:${type};${encodingType},${encodedContent}`;
   }

   return `data:text/plain,MissingEncoding`;
}

function encodeEntitiesStripSpaces(string) {
   return encodeEntities(string.replace(/\s+/g, ' ').replaceAll('\n', ''));
}

function encodeEntities(string) {
   return string
       .replaceAll(' ', '%20')
       .replaceAll('"', '%22')
       .replaceAll("#", '%23')
       .replaceAll("&", '%26')
       .replaceAll("'", '%27')
       .replaceAll("+", '%2B')
       .replaceAll('<', '%3C')
       .replaceAll('=', '%3D')
       .replaceAll('>', '%3E')
       .replaceAll('?', '%3F')
}