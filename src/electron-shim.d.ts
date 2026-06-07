declare module "electron" {
  export const shell: {
    openPath(path: string): Promise<string>;
    showItemInFolder(path: string): void;
  };

  export const clipboard: {
    writeImage(image: unknown): void;
  };

  export const nativeImage: {
    createFromBuffer(buffer: Uint8Array | Buffer): unknown;
  };
}
