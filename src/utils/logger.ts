import chalk from 'chalk';

function write(prefix: string, ...args: unknown[]): void {
  console.log([`[${prefix}]`, ...args].join(' '));
}

function dir(obj: unknown): void {
  console.dir(obj);
}

function debug(msg: unknown, ...args: unknown[]): void {
  write(chalk.blue('DEBUG'), msg, ...args);
}

function info(msg: unknown, ...args: unknown[]): void {
  write(chalk.green(' INFO'), msg, ...args);
}

function warn(msg: unknown, ...args: unknown[]): void {
  write(chalk.magenta(' WARN'), msg, ...args);
}

function error(msg: unknown, ...args: unknown[]): void {
  write(chalk.red('ERROR'), msg, ...args);
}

const log = (m: unknown, ...args: unknown[]): void => debug(m, ...args);

log.dir = (m: unknown): void => dir(m);
log.info = (m: unknown, ...args: unknown[]): void => info(m, ...args);
log.warn = (m: unknown, ...args: unknown[]): void => warn(m, ...args);
log.error = (m: unknown, ...args: unknown[]): void => error(m, ...args);

export default log;
