export function generateSlug(): string {
  const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
  const minLength = 8;
  const maxLength = 15;
  const length =
    Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;

  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export function slugify(text: string): string {
  if (!text) return "";
  return text.toLowerCase().replace(/[^a-zA-Z0-9]/g, "-");
}
