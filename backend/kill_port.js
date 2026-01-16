import { exec } from 'child_process';

const PORT = 4000;

if (process.platform === 'win32') {
    exec(`netstat -ano | findstr :${PORT}`, (err, stdout) => {
        if (stdout) {
            const pid = stdout.split(/\s+/).pop();
            if (pid) {
                exec(`taskkill /F /PID ${pid}`, () => console.log(`✅ Killed process on port ${PORT}`));
            }
        }
    });
} else {
    exec(`lsof -i :${PORT} -t`, (err, stdout) => {
        if (stdout) {
            const pids = stdout.trim().split('\n').join(' ');
            if (pids) {
                exec(`kill -9 ${pids}`, () => console.log(`✅ Killed process on port ${PORT}`));
            }
        }
    });
}
