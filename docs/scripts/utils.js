import chalk from 'chalk';

export const printSuccessMessage = (message) => {
  console.log(chalk.green('Success:'), `${message}`);
};

export const printInfoMessage = (message) => {
  console.log(chalk.blue('Info:'), `${message}`);
};

export const printErrorMessage = (message) => {
  console.log(chalk.red('Error:'), `${message}`);
};
