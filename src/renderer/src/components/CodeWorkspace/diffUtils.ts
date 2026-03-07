import * as diff from 'diff'

export interface InlineDiffBlock {
    type: 'added' | 'removed' | 'unchanged'
    value: string
    startLine: number
    endLine: number
}

export interface DecorationRange {
    startLineNumber: number
    startColumn: number
    endLineNumber: number
    endColumn: number
}

export interface DiffResult {
    additions: { range: DecorationRange; text: string }[]
    removals: { afterLine: number; text: string }[]
}

/**
 * Calculates line-level and character-level diffs for Monaco decorations.
 */
export function calculateInlineDiff(original: string, modified: string): DiffResult {
    const lineDiff = diff.diffLines(original, modified)

    const additions: { range: DecorationRange; text: string }[] = []
    const removals: { afterLine: number; text: string }[] = []

    let currentModifiedLine = 1

    lineDiff.forEach((part) => {
        const lines = part.value.split('\n')
        const hasTrailingNewline = part.value.endsWith('\n')
        const lineCount = hasTrailingNewline ? lines.length - 1 : lines.length

        if (part.added) {
            additions.push({
                range: {
                    startLineNumber: currentModifiedLine,
                    startColumn: 1,
                    endLineNumber: currentModifiedLine + lineCount - 1,
                    endColumn: lines[lineCount - 1].length + 1
                },
                text: part.value
            })
            currentModifiedLine += lineCount
        } else if (part.removed) {
            removals.push({
                afterLine: currentModifiedLine - 1,
                text: part.value
            })
        } else {
            currentModifiedLine += lineCount
        }
    })

    return { additions, removals }
}
