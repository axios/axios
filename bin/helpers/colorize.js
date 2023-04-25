import chalk from 'chalk';

export const colorize = (...colors)=> {
  if(!colors.length) {
    colors = ['green', 'magenta', 'cyan', 'blue', 'yellow', 'red'];
  }

  const colorsCount = colors.length;

  return (strings, ...values) => {
    const {length} = values;
    return strings.map((str, i) => i < length ? str + chalk[colors[i%colorsCount]].bold(values[i]) : str).join('');
  }
}
