var PATH_REGEXP = new RegExp([
    // Match escaped characters that would otherwise appear in future matches.
    // This allows the user to escape special characters that won't transform.
    '(\\\\.)',
    // Match Express-style parameters and un-named parameters with a prefix
    // and optional suffixes. Matches appear as:
    //
    // "/:test(\\d+)?" => ["/", "test", "\d+", undefined, "?", undefined]
    // "/route(\\d+)"  => [undefined, undefined, undefined, "\d+", undefined, undefined]
    // "/*"            => ["/", undefined, undefined, undefined, undefined, "*"]
    '([\\/.])?(?:(?:\\:(\\w+)(?:\\(((?:\\\\.|[^\\\\()])+)\\))?|\\(((?:\\\\.|[^\\\\()])+)\\))([+*?])?|(\\*))'
].join('|'), 'g')

function escapeString(str) {
    return str.replace(/([.+*?=^!:${}()[\]|\/\\])/g, '\\$1')
}

/**
 * Escape the capturing group by escaping special characters and meaning.
 *
 * @param  {string} group
 * @return {string}
 */
function escapeGroup(group) {
    return group.replace(/([=!:$\/()])/g, '\\$1')
}

function parse(str, options) {
    var tokens = []
    var key = 0
    var index = 0
    var path = ''
    var defaultDelimiter = options && options.delimiter || '/'
    var res

    while ((res = PATH_REGEXP.exec(str)) != null) {
        var m = res[0]
        var escaped = res[1]
        var offset = res.index
        path += str.slice(index, offset)
        index = offset + m.length

        // Ignore already escaped sequences.
        if (escaped) {
            path += escaped[1]
            continue
        }

        var next = str[index]
        var prefix = res[2]
        var name = res[3]
        var capture = res[4]
        var group = res[5]
        var modifier = res[6]
        var asterisk = res[7]

        // Push the current path onto the tokens.
        if (path) {
            tokens.push(path)
            path = ''
        }

        var partial = prefix != null && next != null && next !== prefix
        var repeat = modifier === '+' || modifier === '*'
        var optional = modifier === '?' || modifier === '*'
        var delimiter = res[2] || defaultDelimiter
        var pattern = capture || group

        tokens.push({
            name: name || key++,
            prefix: prefix || '',
            delimiter: delimiter,
            optional: optional,
            repeat: repeat,
            partial: partial,
            asterisk: !!asterisk,
            pattern: pattern ? escapeGroup(pattern) : (asterisk ? '.*' : '[^' + escapeString(delimiter) + ']+?')
        })
    }

    // Match any characters still remaining.
    if (index < str.length) {
        path += str.substr(index)
    }

    // If the path exists, push it onto the end.
    if (path) {
        tokens.push(path)
    }

    return tokens
}
