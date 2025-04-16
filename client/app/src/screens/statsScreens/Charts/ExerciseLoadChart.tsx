import React from 'react';
import { View, Text } from 'react-native';
import { VictoryChart, VictoryBar, VictoryAxis } from 'victory-native';
import { Svg } from 'react-native-svg';
import { Colours } from '@/app/src/components/styles';

function buildLoadData(records) {
  const sorted = [...records].sort((a, b) => {
    const da = new Date(a.performed_date);
    const db = new Date(b.performed_date);
    return da - db;
  });

  return sorted.map((item) => {
    const dateObj = new Date(item.performed_date);
    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();
    const shortLabel = `${month}/${day}`;

    return {
      x: shortLabel,
      y: item.load || 0,
    };
  });
}

// A helper to find a sensible maxY so your chart doesn't produce bizarre domain scales:
function getMaxYValue(data) {
  if (!data.length) return 1; // fallback if no data

  const maxVal = data.reduce((acc, curr) => {
    return curr.y > acc ? curr.y : acc;
  }, 0);

  // If all are zero, return 1 so that Victory doesn't try to overcompensate
  if (maxVal === 0) {
    return 1;
  }

  // If you want a little padding above the top bar, add +1 or a fraction
  return Math.ceil(maxVal) + 1;
}

function LoadChart({ records }) {
  const data = buildLoadData(records);

  // 1) If no data at all, just say so
  if (!data.length) {
    return (
      <View style={{ alignItems: 'center', padding: 10 }}>
        <Text>No load data yet</Text>
      </View>
    );
  }

  // 2) Calculate a custom Y-axis domain
  const maxY = getMaxYValue(data);

  return (
    <Svg style={{ width: '100%', height: 200 }}>
      <VictoryChart
        width={350}
        height={220}
        domain={{ y: [0, maxY] }}
        domainPadding={{ x: 20, y: 20 }}
        standalone={false}
      >
        <VictoryAxis
          style={{
            tickLabels: { fontSize: 12, angle: 0, padding: 5 },
          }}
        />
        <VictoryAxis
          dependentAxis
          // Limit or clean up decimal places in ticks
          tickFormat={(t) => Number.isInteger(t) ? t : ''}
          style={{
            tickLabels: { fontSize: 12, padding: 5 },
          }}
        />
        <VictoryBar
          data={data}
          style={{ data: { fill: Colours.gymColour } }}
          barWidth={20}
        />
      </VictoryChart>
    </Svg>
  );
}

export default LoadChart;
