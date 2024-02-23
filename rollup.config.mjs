import resolve from '@rollup/plugin-node-resolve';
import terser from "@rollup/plugin-terser";

const production = !process.env.ROLLUP_WATCH;

export default [
    {
        input: 'src/main.js',
        output: {
            sourcemap: !production,
            format: 'es',
            name: 'app',
            dir: 'public/scripts',
            manualChunks: function(path) {
                if (path.indexOf('/components/') !== -1) return 'components';
                if (path.indexOf('/template/') !== -1) return 'template';
                if (path.indexOf('/lib/') !== -1) return 'lib';
            },
            chunkFileNames: "[name].js"
        },
        plugins: [
           resolve(),
            // terser(),
        ],
        watch: { clearScreen: true },
        rollupOutputOptions: {
            entryFileNames: '[name].js',
        }
    },
];
