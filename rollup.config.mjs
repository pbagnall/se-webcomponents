import resolve from '@rollup/plugin-node-resolve';
import terser from "@rollup/plugin-terser";

const production = !process.env.ROLLUP_WATCH;

export default {
    input: 'src/main.js',
    output: {
        sourcemap: true,
        format: 'es',
        name: 'app',
        dir: 'public/scripts'
    },
    plugins: [
        resolve(),
        terser(),
    ],
    watch: {
        clearScreen: true
    }
};
