declare module '*.svg' {
  const src: string;
  export default src;
}

declare module '*.png' {
  const src: string;
  export default src;
}

interface ImportMetaEnv {
  readonly NEXT_PUBLIC_DASHBOARD_URL?: string;
  readonly VITE_DASHBOARD_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module 'react-simple-maps' {
  import { ComponentProps, ReactNode, MouseEvent } from 'react';

  export interface ComposableMapProps {
    projection?: string;
    projectionConfig?: Record<string, unknown>;
    width?: number;
    height?: number;
    style?: React.CSSProperties;
    className?: string;
    children?: ReactNode;
  }

  export interface ZoomableGroupProps {
    zoom?: number;
    minZoom?: number;
    maxZoom?: number;
    center?: [number, number];
    translateExtent?: [[number, number], [number, number]];
    onMoveStart?: (position: { coordinates: [number, number]; zoom: number }, event: MouseEvent) => void;
    onMove?: (position: { x: number; y: number; zoom: number; dragging: boolean }, event: MouseEvent) => void;
    onMoveEnd?: (position: { coordinates: [number, number]; zoom: number }, event: MouseEvent) => void;
    children?: ReactNode;
    style?: React.CSSProperties;
    className?: string;
  }

  export interface GeographiesProps {
    geography: string | Record<string, unknown>;
    children: (props: { geographies: any[] }) => ReactNode;
    parseGeographies?: (features: any[]) => any[];
  }

  export interface GeographyProps {
    geography: any;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    opacity?: number;
    style?: {
      default?: React.CSSProperties;
      hover?: React.CSSProperties;
      pressed?: React.CSSProperties;
    };
    onClick?: (event: MouseEvent) => void;
    onMouseOver?: (event: MouseEvent) => void;
    onMouseOut?: (event: MouseEvent) => void;
    className?: string;
  }

  export function ComposableMap(props: ComposableMapProps): JSX.Element;
  export function ZoomableGroup(props: ZoomableGroupProps): JSX.Element;
  export function Geographies(props: GeographiesProps): JSX.Element;
  export function Geography(props: GeographyProps): JSX.Element;
  export function Marker(props: any): JSX.Element;
  export function Line(props: any): JSX.Element;
  export function Graticule(props: any): JSX.Element;
  export function Sphere(props: any): JSX.Element;
}
