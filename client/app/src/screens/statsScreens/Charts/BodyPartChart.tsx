import React from 'react';
import { View, Text } from 'react-native';
import { VictoryChart, VictoryBar, VictoryAxis } from 'victory-native';

const BODY_PART_COLORS = {
  Back: '#FFCC80',
  Chest: '#EF9A9A',
  Core: '#FFE082',
  Glute: '#B39DDB',
  Hamstring: '#CE93D8',
  Quads: '#81D4FA',
  Shoulder: '#A5D6A7',
  Tricep: '#80CBC4',
  // Add more body parts if needed
};

export default function BodyPartBarChart({ dataObject }) {
  if (!dataObject || Object.keys(dataObject).length === 0) {
    return <Text>Save some gym workouts to track your gains</Text>;
  }

  // Example: dataObject = { Back: 5, Chest: 3, Core: 7, ... }
  // Convert to an array for Victory
  // e.g. [ { x: 'Back', y: 5 }, { x: 'Chest', y: 3 }, ... ]
  let rawData = Object.entries(dataObject).map(([key, value]) => ({
    x: key,
    y: value
  }));

  // Compute total
  const total = rawData.reduce((sum, item) => sum + item.y, 0);

  // Convert each value to a percentage
  // e.g. if item.y = 5 and total=10, item.y => (5/10)*100 => 50
  const chartData = rawData.map(item => ({
    x: item.x,
    y: (item.y / total) * 100
  }));

  // Sort so largest bar is on top
  chartData.sort((a, b) => b.y - a.y);

  // If you want to remove decimals entirely, we can do .toFixed(0).
  // This means the sum of percentages might not be exactly 100, but it's simpler.
  chartData.forEach(item => {
    item.y = Number(item.y.toFixed(0));
  });

  return (
    <View>
      {/* <Text style={{ fontWeight: '600', marginBottom: 8 }}>Body Part Usage (%)</Text> */}
      <VictoryChart
        domainPadding={{ x: 20, y: 20 }} // expand spacing
        width={320}
        height={270}
        padding={{ left: 80, right: 40, top: 20, bottom: 30 }}

      >
        {/* X-axis is numeric (0% to ~100%) */}
        <VictoryAxis
          tickFormat={(t) => `${t}`} // e.g. "50%" 
          style={{
            tickLabels: { fontSize: 12, color: '#444' }
          }}
        />
        
        {/* Y-axis is category (Back, Chest, Core, etc.) */}
        <VictoryAxis
          dependentAxis
          style={{
            tickLabels: { fontSize: 12, fontWeight: '600', color: '#444' }
          }}
        />

        <VictoryBar
          horizontal
          data={chartData}
          // If you want custom bar widths, set barWidth
          barWidth={10}
          labels={({ datum }) => `${datum.y}%`}
          style={{
            data: {
              // either a single color:
              fill: '#DBCDFD'

              // or if you want color per body part:
            //   fill: ({ datum }) => {
            //     const color = BODY_PART_COLORS[datum.x];
            //     return color || '#ccc';
            //   }
            },
            labels: { fontSize: 10, fill: '#000' }
          }}
        />
      </VictoryChart>
    </View>
  );
}
