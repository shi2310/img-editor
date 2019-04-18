
import { resolve } from 'path';
// ref: https://umijs.org/config/
export default {
  treeShaking: true,
  plugins: [
    // ref: https://umijs.org/plugin/umi-plugin-react.html
    ['umi-plugin-react', {
      antd: true,
      dva: true,
      dynamicImport: { webpackChunkName: true },
      title: 'img-editer',
      dll: true,
      locale: {
        enable: true,
        default: 'en-US',
      },
      routes: {
        exclude: [
          /models\//,
          /services\//,
          /model\.(t|j)sx?$/,
          /service\.(t|j)sx?$/,
          /components\//,
        ],
      },
    }],
  ],
  alias: {
    assets: resolve(__dirname, 'src/assets'),
  },
  hash: true,
  history: 'hash',
  urlLoaderExcludes: [/\.svg(\?v=\d+\.\d+\.\d+)?$/,],
  chainWebpack(config) {
    config.module
      .rule('svg')
      .test(/\.svg(\?v=\d+\.\d+\.\d+)?$/,)
      .use([
        {
          loader: 'babel-loader',
        },
        {
          loader: '@svgr/webpack',
          options: {
            babel: false,
            icon: true,
          },
        },
      ])
      .loader(require.resolve('@svgr/webpack'));

    // config woker
    config.output.globalObject('self');
  },
}
