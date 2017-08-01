/**
 * Join a prefix with pathname to have one '/' between them.
 * don't append '/' if b is undefined or empty.
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

/**
 * Map the request pathname to a local filename.
 * If the pathname is a file, return it.
 * Otherwise, return an index file in the folder.
 * @export
 * @param {string} pathname The pathname in an http request.
 * @param {*} fileSystem The file system.
 * @param {(string | boolean | undefined)} index The index filename. Default is 
 * @returns a filesystem filename or an
 * empty string if index is false or pathname is invalid
 */
export function getFilename(
    pathname: string,
    fileSystem: any,
    index: string | boolean | undefined) {
    let filename = ''
    try {
        let stat: any = fileSystem.statSync(pathname)
        if (stat.isFile()) {
            filename = pathname
        } else {
            if (stat.isDirectory()) {
                if (index === undefined || index === true) {
                    index = "index.html"
                }

                if (index) {
                    const indexFilename = joinPath(pathname, index as string)
                    stat = fileSystem.statSync(indexFilename)
                    if (stat.isFile()) {
                        filename = indexFilename
                    }
                }
            }
        }
    } catch (e) {
        // file not exists or other errors, nothing to do
    }
    return filename
}
