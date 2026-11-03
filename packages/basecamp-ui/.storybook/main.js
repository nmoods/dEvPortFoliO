/** @type {import('@storybook/react-vite').StorybookConfig} */
const config = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  // The package's vite.config.js is set up for library mode; Storybook builds an app instead.
  viteFinal: (viteConfig) => {
    if (viteConfig.build) delete viteConfig.build.lib
    return viteConfig
  },
}

export default config
