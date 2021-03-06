import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';

export default {
  entry: 'client.js'
, dest: 'client.bundle.js'
, format: 'iife'
, moduleName: 'xrs'
, plugins: [
    nodeResolve({ browser: true })
  , commonjs()
  ]
}