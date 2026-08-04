/**
 * Tokenize search text while preserving MiniSearch's default behavior for
 * non-Han content and adding overlapping Han bigrams.
 *
 * MiniSearch passes a field name while indexing and omits it for queries.
 * Indexing Han unigrams keeps single-character searches useful, while queries
 * longer than one character use bigrams to avoid broad OR matches.
 *
 * @param {string} text
 * @param {string} [fieldName]
 * @returns {string[]}
 */
export function tokenizeSearchText(text, fieldName) {
  const separatorPattern = /[\n\r\p{Z}\p{P}]/u;
  const hanPattern = /\p{Script=Han}/u;
  const terms = [];
  let token = '';
  let tokenIsHan = false;

  const flush = () => {
    if (!token) {
      return;
    }

    if (!tokenIsHan) {
      terms.push(token);
      token = '';
      return;
    }

    const characters = [...token];

    if (fieldName !== undefined || characters.length === 1) {
      terms.push(...characters);
    }

    for (let index = 0; index < characters.length - 1; index++) {
      terms.push(characters[index] + characters[index + 1]);
    }

    token = '';
  };

  for (const character of text) {
    if (separatorPattern.test(character)) {
      flush();
      continue;
    }

    const characterIsHan = hanPattern.test(character);

    if (token && characterIsHan !== tokenIsHan) {
      flush();
    }

    token += character;
    tokenIsHan = characterIsHan;
  }

  flush();

  return terms;
}
