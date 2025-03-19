import React from 'react';
import { View, Text } from 'react-native';
import { PieChart } from 'react-native-chart-kit';

// Example color palette – adjust as you wish
const ACTIVITY_TYPE_COLORS = {
    "Running": "#ABCFDC",
    "Mobility": "#F0C5C7",
    "Hiit": "#FCFCB6",
    "Gym": "#DBCDFD",
    // Add as many as you want
  };


export default function ActivityTypePieChart({ dataObject }) {
  if (!dataObject) {
    // No data => return a small placeholder
    return <Text>No activity type data</Text>;
  }

  // dataObject might look like: { Strength: 120, Running: 60, Mobility: 15 }
  // Convert to array for the PieChart
  const entries = Object.entries(dataObject); // e.g. [["Strength",120],["Running",60],["Mobility",15]]

  // We also need a total to handle label percentages if we want
  const totalValue = entries.reduce((sum, [, value]) => sum + value, 0);

  // Build chart data array
  const chartData = entries.map(([key, value], index) => {
    const color = ACTIVITY_TYPE_COLORS[key] 
    //   || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
  
    return {
      name: key,
      value,
      color,
      legendFontColor: '#444',
      legendFontSize: 12,
    };
  });

  return (
    <View>
      <PieChart
        data={chartData}
        width={300}    // adjust to your desired width
        height={160}  // chart height
        chartConfig={{
          backgroundColor: '#ffffff',
          backgroundGradientFrom: '#ffffff',
          backgroundGradientTo: '#ffffff',
          decimalPlaces: 0, // no decimals
          color: (opacity = 1) => `rgba(0,0,0,${opacity})`,
          labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
        }}
        accessor="value" // the property in your data that is the numeric value
        backgroundColor="transparent"
        paddingLeft="15"
        // absolute or relative
        hasLegend={true}
      />
    </View>
  );
}

// import React from 'react';
// import { View, Text } from 'react-native';
// import { VictoryPie, VictoryLegend, VictoryContainer } from 'victory-native';

// const ACTIVITY_TYPE_COLORS = {
//   Gym: '#EFE8FF',
//   Hiit: '#F6F6DC',
//   Mobility: '#FFDDDE',
//   Running: '#D2E4EA',
//   Strength: '#FFB6C1',
// };

// export default function ActivityTypeDonutChart({ dataObject }) {
//   // e.g. dataObject = { Gym: 100, Hiit: 30, Mobility: 5, Running: 37 }
//   if (!dataObject || Object.keys(dataObject).length === 0) {
//     return <Text>No data</Text>;
//   }

//   // Convert object to Victory-friendly data: [ { x: 'Gym', y: 100 }, { x: 'Hiit', y: 30 }, ... ]
//   const chartData = Object.entries(dataObject).map(([key, value]) => ({
//     x: key,
//     y: value,
//   }));

//   // Build colorScale in the same order
//   const colorScale = chartData.map((datum) => {
//     return ACTIVITY_TYPE_COLORS[datum.x] || '#ccc';
//   });

//   // 1) Calculate total once
//   const total = chartData.reduce((acc, datum) => acc + datum.y, 0);

//   return (
//     <View style={{ alignItems: 'center' }}>
//       <VictoryPie
//         data={chartData}
//         width={280}
//         height={200}
//         innerRadius={100}         // donut hole
//         colorScale={colorScale}
//         // 2) Format label as a percentage
//         labels={({ datum }) => {
//           const pct = ((datum.y / total) * 100).toFixed(0); // e.g. 45.6
//           return `${datum.x}: ${pct}%`;
//         }}
//         style={{
//           labels: { fontSize: 14, fill: '#333' },
//         }}
//       />
//     </View>
//   );
// }
