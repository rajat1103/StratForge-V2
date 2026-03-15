// Shim for pre-install type checking - removed automatically after npm install
import 'react'

declare module 'react' {
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    [key: string]: unknown
  }
}
