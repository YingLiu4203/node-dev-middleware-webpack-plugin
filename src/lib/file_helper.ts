/**
 * Join a prefix with pathname to have exactly one '/' between them
 * @param {string} a The prefix
 * @param {string} [b] the pathname, not started with '/'
 * @returns A joined path with only one '/' between them
 */
export function joinPath(a: string, b?: string) {
    if (a.endsWith('/')) {
        return a + b
    } else if (b) {
        return a + '/' + b
    } else {
        return a
    }
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
