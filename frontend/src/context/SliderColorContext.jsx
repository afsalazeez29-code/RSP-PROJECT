import { createContext, useContext, useState } from 'react';

// Slider accent colors by slide index (0-based)
export const SLIDER_COLORS = ['#e8b84b', '#c48a1f', '#7c3aed', '#db2777'];

const SliderColorContext = createContext({
  sliderColor: SLIDER_COLORS[0],
  setSliderIndex: () => {},
});

export function SliderColorProvider({ children }) {
  const [sliderIndex, setSliderIndex] = useState(0);
  const sliderColor = SLIDER_COLORS[sliderIndex] ?? SLIDER_COLORS[0];

  return (
    <SliderColorContext.Provider value={{ sliderColor, setSliderIndex }}>
      {children}
    </SliderColorContext.Provider>
  );
}

export function useSliderColor() {
  return useContext(SliderColorContext);
}
