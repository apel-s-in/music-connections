/// <reference types="react" />
/// <reference types="react-dom" />

declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

declare module '*.webmanifest' {
  const content: string;
  export default content;
}

interface Window {
  __BASE_PATH__?: string;
}
