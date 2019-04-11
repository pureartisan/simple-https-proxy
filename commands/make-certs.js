const path    = require('path');
const child_process = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');

const MAKE_CERTS_SCRIPT_PATH = path.join(ROOT_DIR, 'scripts', 'make-certs.sh');

const runCommand = (command, args) => {
  try {
    const exitCode = child_process.execSync(cmd, args, { stdio: 'pipe' }).toString();
    return parseInt(exitCode);
  }
  catch (error) {
    // error.message; // Holds the message you typically want.
    // error.stderr;  // Holds the stderr output. Use `.toString()`.
    // error.stdout;  // Holds the stdout output. Use `.toString()`.
    return parseInt(error.status);
  }
}

class MakeCerts {

  run() {
    const exitCode = runCommand(MAKE_CERTS_SCRIPT_PATH, ['server']);
    if (exitCode) {
      console.log('Error:', exitCode);
    } else {
      console.log('Local certificate created');
    }

  }

}

module.exports = MakeCerts;