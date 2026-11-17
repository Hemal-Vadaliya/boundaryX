/** Triggers a browser download of the given text content as a file. */
export function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  try {
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    anchor.rel = 'noopener'
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
  } finally {
    URL.revokeObjectURL(url)
  }
}

export interface FileReadResult {
  file: File
  text: string
}

export interface FileReadError {
  file: File
  error: string
}

/** Reads a File's text content, never throwing — failures are reported as a value so a batch import can continue past one bad file. */
export function readFileAsText(file: File): Promise<FileReadResult | FileReadError> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve({ file, text: reader.result })
      } else {
        resolve({ file, error: 'The file could not be read as text.' })
      }
    }
    reader.onerror = () => {
      resolve({ file, error: reader.error?.message ?? 'The file could not be read.' })
    }
    reader.readAsText(file)
  })
}

export function isFileReadError(
  result: FileReadResult | FileReadError
): result is FileReadError {
  return 'error' in result
}
