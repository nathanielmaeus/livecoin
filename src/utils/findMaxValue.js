export default function findMaxValue(yData) {
    const shareArray = Object.keys(yData).reduce((acc, key) => {
      return [...acc, ...yData[key]];
    }, []);

    return Math.max(...shareArray);
  };