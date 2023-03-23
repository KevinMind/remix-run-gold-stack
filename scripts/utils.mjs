import {fs, chalk} from 'zx';
import os from 'os';

export function log(...args) {
    console.log(chalk.blue(...args, '\n'));
}

export function setEnv(key, value) {
    // read file from hdd & split if from a linebreak to a array
    const ENV_VARS = fs.readFileSync("./.env", "utf8").split(os.EOL);

    // find the env we want based on the key
    const index = ENV_VARS.findIndex((line) => line.match(new RegExp(key)));
    const newValue = `${key}=${value}`;

    if (index >= 0) {
        // replace the key/value with the new value
        ENV_VARS.splice(index, 1, newValue);
    } else {
        ENV_VARS.push(newValue);
    }

    // write everything back to the file system
    fs.writeFileSync("./.env", ENV_VARS.join(os.EOL));

}