import React from 'react';
import { VictoryChart, VictoryBar, VictoryAxis } from 'victory-native';
import { Svg } from 'react-native-svg';
import { Colours } from '@/app/src/components/styles';

/* 
   1) A helper that transforms your selectedRecords into [ { x, y }, ... ] data
   - 'performed_date' is your X value (converted to a short label or day index)
   - 'load' is your Y value
   - Sort them ascending by date, so newest is at the right
*/
function buildLoadData(records) {
  // clone & sort ascending by date
  const sorted = [...records].sort((a, b) => {
    const da = new Date(a.performed_date);
    const db = new Date(b.performed_date);
    return da - db; // ascending
  });

  // Map each record to an object { x, y }
  // x can be a short date label or day index; y is load
  return sorted.map((item, index) => {
    // Example short label like "04-15"
    const dateObj = new Date(item.performed_date);
    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();
    const shortLabel = `${month}/${day}`;

    return {
      x: shortLabel,      // the label on X-axis
      y: item.load || 0,  // or whichever numeric you want on Y
    };
  });
}

/* 
   2) The 'LoadChart' component that displays a bar chart with Victory.
   - Expects 'records' as a prop
*/
function LoadChart({ records }) {
  // Convert records to data points
  const data = buildLoadData(records);

  // If no data, return a simple message or empty chart
  if (!data.length) {
    return (
      <View style={{ alignItems: 'center', padding: 10 }}>
        <Text>No load data yet</Text>
      </View>
    );
  }

  // Render Victory chart with bars
  return (
    <Svg style={{ width: '100%', height: 220 }}>
      <VictoryChart
        width={350}
        height={220}
        domainPadding={{ x: 20, y: 20 }}
        standalone={false}
      >
        {/* X-axis at the bottom, Y-axis on the left */}
        <VictoryAxis
          style={{
            tickLabels: { fontSize: 12, angle: 0, padding: 5  }
          }}
        />
        <VictoryAxis
          dependentAxis
          style={{
            tickLabels: { fontSize: 12, padding: 5 }
          }}
        />
        <VictoryBar
          data={data}
          style={{ data: { fill: Colours.gymColour } }}  // or your accent color
          // barWidth can be adjusted if you have many data points
          barWidth={20}
        />
      </VictoryChart>
    </Svg>
  );
}

export default LoadChart;
