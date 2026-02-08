function generateSlug(name) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-') // replace spaces with dashes
      .replace(/(^-|-$)+/g, '') +
    '-' +
    Math.floor(Math.random() * 10000)
  );
}

module.exports = { generateSlug };
