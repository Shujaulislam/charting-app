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
      hovertemplate?: string;
      textposition?: 'inside' | 'outside' | 'auto' | 'none';
      texttemplate?: string;
      insidetextorientation?: 'horizontal' | 'radial' | 'tangential' | 'auto';
      marker?: {
        colors?: string[];
        color?: string;
        opacity?: number;
        [key: string]: any;
      };
      [key: string]: any;
    }>;
    layout?: {
      autosize?: boolean;
      margin?: { t: number; r: number; b: number; l: number };
      height?: number;
      width?: number;
      showlegend?: boolean;
      legend?: { 
        orientation: string; 
        y: number;
        x?: number;
        xanchor?: string;
      };
      paper_bgcolor?: string;
      plot_bgcolor?: string;
      font?: { 
        family: string;
        size?: number;
        color?: string;
      };
      xaxis?: { 
        title: string;
        type?: string;
        tickangle?: number;
        tickformat?: string;
      };
      yaxis?: { 
        title: string;
        tickformat?: string;
      };
      bargap?: number;
      barmode?: 'stack' | 'group' | 'overlay' | 'relative';
      annotations?: Array<{
        text: string;
        showarrow: boolean;
        x: number;
        y: number;
        font?: {
          size?: number;
          color?: string;
        };
      }>;
      [key: string]: any;
    };
    config?: {
      responsive?: boolean;
      displayModeBar?: boolean;
      showTips?: boolean;
      [key: string]: any;
    };
    style?: React.CSSProperties;
    className?: string;
  }

  export default class Plot extends Component<PlotParams> {}
} 