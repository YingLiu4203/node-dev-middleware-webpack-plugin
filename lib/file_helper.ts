export function joinPath(a: string, b: string) {
    return a === "/" ? "/" + b : (a || "") + "/" + b;
}

export function getFilename(
    filename: string,
    fileSystem: any,
    index: string | boolean | undefined) {
    let stat: any = fileSystem.statSync(filename)
    if (!stat.isFile()) {
        if (stat.isDirectory()) {
            if (index === undefined || index === true) {
                index = "index.html"
            } else if (!index) {
                throw new Error(`invalid option index: ${index}.`)
            }
            filename = joinPath(filename as string, index)
            stat = fileSystem.statSync(filename)
            if (!stat.isFile()) {
                throw new Error(`Index ${filename} is not file.`)
            }
        } else {
            throw new Error(`${filename} is not file or dir.`)
        }
    }
    return filename
}
