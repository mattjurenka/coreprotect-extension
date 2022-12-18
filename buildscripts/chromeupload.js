import AdmZip from "adm-zip"

const output = new AdmZip()
output.addLocalFolder("dist/content_scripts", "content_scripts")
output.addLocalFolder("dist/icons", "icons")
output.addLocalFolder("dist/popup", "popup")
output.addLocalFile("dist/background.js")
output.addLocalFile("dist/manifest.json")

output.writeZip("dist/coreprotect.zip")
