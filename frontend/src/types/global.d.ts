/// <reference types="react" />
/// <reference types="react-dom" />

// Ensure JSX key prop is always valid on any component
declare namespace React {
  interface Attributes {
    key?: string | number | null
  }
}
