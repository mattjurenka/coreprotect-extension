const fs = require("fs")

const [_, __, basepath, browserpath, manifestpath] = process.argv

const base_manifest = JSON.parse(fs.readFileSync(basepath))
const browser_specific = JSON.parse(fs.readFileSync(browserpath))

const final_manifest = Object.assign(base_manifest, browser_specific)

fs.writeFileSync(manifestpath, JSON.stringify(final_manifest, null, 4))
