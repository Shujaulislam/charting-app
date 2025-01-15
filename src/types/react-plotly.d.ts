declare module 'react-plotly.js' {
  import { Component } from 'react';
  
  interface PlotParams {
    data: Array<{
      type: string;
      x?: any[];
      y?: any[];
      labels?: any[];
      values?: any[];
      mode?: string;
      name?: string;
      hole?: number;
      textinfo?: string;
      hoverinfo?: string;
      nbinsx?: number;
      [key: string]: any;
    }>;
    layout?: {
      autosize?: boolean;
      margin?: { t: number; r: number; b: number; l: number };
      height?: number;
      width?: number;
      showlegend?: boolean;
      legend?: { orientation: string; y: number };
      paper_bgcolor?: string;
      plot_bgcolor?: string;
      font?: { family: string };
      xaxis?: { title: string };
      yaxis?: { title: string };
      bargap?: number;
      [key: string]: any;
    };
    config?: {
      responsive?: boolean;
      displayModeBar?: boolean;
      [key: string]: any;
    };
    style?: React.CSSProperties;
    className?: string;
  }

  export default class Plot extends Component<PlotParams> {}
} 