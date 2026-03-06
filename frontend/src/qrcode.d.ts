declare module 'qrcode' {
  const qrcode: {
    toDataURL: (input: string, options?: object) => Promise<string>;
    toString: (input: string, options?: object) => Promise<string>;
    [key: string]: unknown;
  };
  export default qrcode;
}
