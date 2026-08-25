declare module "troika-three-text" {
  import { Mesh } from "three";

  export class Text extends Mesh {
    text: string;
    font: string | null;
    fontSize: number;
    color: string | number;
    anchorX: number | string;
    anchorY: number | string;
    textRenderInfo: { blockBounds: [number, number, number, number] } | null;
    sync(callback?: () => void): void;
    dispose(): void;
  }

  export function configureTextBuilder(config: { useWorker?: boolean }): void;
}
