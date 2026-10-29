// build.mjs loads a .css file as its text.
declare module "*.css" {
  const text: string;
  export default text;
}
