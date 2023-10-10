module.exports = {
  devServer: {
    progress: false,
  },
  configureWebpack: {
    resolve: {
      extensions: ['.d.ts'],
    },
  },
}
