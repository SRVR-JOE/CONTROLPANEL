export interface MatrixPort {
  index: number;
  label: string;
  signal: boolean;
  format?: string;
}

export interface MatrixState {
  manufacturer: string;
  model: string;
  firmware?: string;
  inputs: MatrixPort[];
  outputs: (MatrixPort & { routedFrom: number })[];
  size: string; // e.g. "16x16"
}

export interface MatrixAdapter {
  manufacturer: string;
  /** Query full matrix state — inputs, outputs, current crosspoints, labels */
  queryMatrix(ip: string, port?: number): Promise<MatrixState | null>;
  /** Set a single crosspoint: route inputIndex to outputIndex */
  setRoute(
    ip: string,
    outputIndex: number,
    inputIndex: number,
    port?: number
  ): Promise<boolean>;
  /** Set input label */
  setInputLabel?(
    ip: string,
    index: number,
    label: string,
    port?: number
  ): Promise<boolean>;
  /** Set output label */
  setOutputLabel?(
    ip: string,
    index: number,
    label: string,
    port?: number
  ): Promise<boolean>;
}
