import React from 'react';
import { View, Text } from 'react-native';
import { PieChart } from 'react-native-chart-kit';

// Example color palette – adjust as you wish
const ACTIVITY_TYPE_COLORS = {
    "Running": "#ABCFDC",
    "Mobility": "#F0C5C7",
    "Hiit": "#FCFCB6",
    "Gym": "#DBCDFD",
    "Hyrox": "#E7F4E5",
    // Add as many as you want
  };


export default function ActivityTypePieChart({ dataObject }) {
  if (!dataObject) {
    // No data => return a small placeholder
    return <Text>Do some workouts to see your activity</Text>;
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
