declare module 'leaflet-freedraw' {
  import * as L from 'leaflet';

  export const CREATE: number;
  export const EDIT: number;
  export const DELETE: number;
  export const CLEAR: number;
  export const ALL: number;

  export interface FreeDrawOptions {
    mode?: number;
    smoothFactor?: number;
    elbowDistance?: number;
    simplifyFactor?: number;
    concaveHull?: boolean;
    hullAlgorithm?: 'convex' | 'concave';
    strokeWidth?: number;
    strokeColor?: string;
    fillColor?: string;
    fillOpacity?: number;
  }

  export interface FreeDrawEvent {
    latLngs: L.LatLng[][];
    eventType: string;
  }

  export default class FreeDraw extends L.Layer {
    constructor(options?: FreeDrawOptions);
    
    mode(mode?: number): number | this;
    clear(): this;
    cancel(): this;
    size(): number;
    all(): L.LatLng[][];
    remove(polygon: L.LatLng[]): this;
    
    options: FreeDrawOptions;
    
    on(type: 'markers', fn: (event: FreeDrawEvent) => void): this;
    on(type: string, fn: Function): this;
    
    off(type: 'markers', fn?: (event: FreeDrawEvent) => void): this;
    off(type: string, fn?: Function): this;
  }
}