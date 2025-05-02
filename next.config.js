// @ts-check

/** @type {import('next').NextConfig} */
module.exports = {
  webpack(config) {
    config.externals.push({ '@lancedb/lancedb': '@lancedb/lancedb' })
    return config
  },
  compiler: {
    styledComponents: {
      displayName: process.env.NODE_ENV === 'development',
    },
  },
}
