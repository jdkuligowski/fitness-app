import React from 'react';
import { Svg, Path } from 'react-native-svg';
import { Colours } from './styles';

const SquigglyLine = ({ color = Colours.buttonColour, width = 200, height = 20 }) => (
  <Svg height={height} width={width} viewBox="0 0 200 20">
    <Path
      d="M0 10 C 20 0, 40 20, 60 10 S 100 0, 120 10 S 160 20, 200 10"
      stroke={color}
      fill="none"
      strokeWidth="4"
    />
  </Svg>
);

export default SquigglyLine;
