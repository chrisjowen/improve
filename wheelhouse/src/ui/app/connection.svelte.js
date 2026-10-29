/**
 * The improve review UI the pages talk to: its address and this launch's
 * token, which Wheelhouse's provider read from it (or handed to it when
 * Wheelhouse launched it), and whether the last request was refused for the
 * token.
 */
export const connection = $state({ url: "", token: "", refused: false });
