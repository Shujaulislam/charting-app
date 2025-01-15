# Charting Implementation Cleanup Plan

## Files to Delete
1. `src/components/charts/DataChart.tsx`
2. `src/components/charts/ChartsWrapper.tsx`
3. `src/components/ui/chart.tsx`

## Files to Modify
1. `src/components/dashboard/DashboardLayout.tsx`
   - Remove ChartWrapper import
   - Keep the chart type selection UI for new implementation

## Dependencies to Remove
```bash
npm uninstall recharts
```

## Comments to Add
In DashboardLayout.tsx:
```typescript
// TODO: Chart implementation using Plotly.js
// Previous recharts implementation removed
```

## Why This is Safe
- No core functionality will break
- Data fetching remains intact
- Table display remains working
- Only visualization layer is affected

## Next Steps After Cleanup
1. Install Plotly.js:
```bash
npm install plotly.js-dist react-plotly.js @types/plotly.js
```

2. Create new chart components:
- `src/components/charts/PlotlyChart.tsx`
- `src/components/charts/ChartContainer.tsx`

3. Create chart data API:
- `src/app/api/chart-data/route.ts` 