import React from 'react';
import { Svg, Path } from 'react-native-svg';

const SquigglyLineReg = ({ color = '#FFF5F7', width = '100%', height = 70 }) => (
  <Svg height={height} width={width} viewBox="0 0 200 50" preserveAspectRatio="none">
    <Path
      d="M0 40 C 40 0, 80 40, 120 20 S 200 0, 240 20 S 320 40, 400 20"
      stroke={color}
      fill="none"
      strokeWidth="5"
    />
  </Svg>
);

export default SquigglyLineReg;
