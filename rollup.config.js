import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'rollup'
import typescript from '@rollup/plugin-typescript'
import nodeResolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import nodePolyfills from 'rollup-plugin-polyfill-node'
import terser from '@rollup/plugin-terser'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

const commonPlugins = [
  json(),
  commonjs(),
  nodeResolve(),
  nodePolyfills(),
  terser()
]

export default [
  defineConfig({
    input: path.resolve(__dirname, 'src/index.ts'),
    output: [
      {
        file: 'dist/cjs/AsyncScheduler.min.js',
        format: 'cjs'
      },
      {
        file: 'dist/iife/AsyncScheduler.min.js',
        format: 'iife',
        name: 'AsyncScheduler'
      },
      {
        file: 'dist/esm/AsyncScheduler.js',
        format: 'esm'
      },
      {
        file: 'dist/umd/AsyncScheduler.min.js',
        format: 'umd',
        name: 'AsyncScheduler'
      }
    ],
    plugins: [
      ...commonPlugins,
      typescript({
        tsconfig: path.resolve(__dirname, './tsconfig.json'),
        compilerOptions: {
          declaration: true,
          declarationDir: 'dist/types'
        }
      })
    ]
  }),
  defineConfig({
    input: path.resolve(__dirname, 'src/utils/retryPromise.ts'),
    output: [
      {
        file: 'dist/cjs/utils/retryPromise.js',
        format: 'cjs'
      },
      {
        file: 'dist/esm/utils/retryPromise.js',
        format: 'esm'
      }
    ],
    plugins: [
      ...commonPlugins,
      typescript({
        tsconfig: path.resolve(__dirname, './tsconfig.json'),
        compilerOptions: {
          declaration: false
        }
      })
    ]
  })
]
