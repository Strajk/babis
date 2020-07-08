module.exports = {
  appendToFilename: function appendToFilename (filename, string) {
    const dotIndex = filename.lastIndexOf(".")
    if (dotIndex === -1) return filename + string
    return filename.substring(0, dotIndex) + string + filename.substring(dotIndex)
  },
}
