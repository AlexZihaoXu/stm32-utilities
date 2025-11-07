# STM32 Utilities

Professional tools and calculators for STM32 embedded development.

## Features

- **PWM Calculator**: Generate optimized PWM configurations with automatic code generation
  - Preset configurations: Servo Control, LED Dimming, Toggle Pin
  - Multiple resolution options and naming conventions
  - Header-only or .h/.c file generation

## Technologies Used

- [Vite](https://vitejs.dev/guide/)
- [React](https://react.dev)
- [HeroUI](https://heroui.com)
- [Tailwind CSS](https://tailwindcss.com)
- [TypeScript](https://www.typescriptlang.org)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)

## Quick Start

### Development

```bash
# Install dependencies
yarn install

# Start development server
yarn dev
```

### Docker

```bash
# Build and run with Docker Compose
docker-compose up -d

# Access at http://localhost:3000
```

The application will be available at `http://localhost:3000`

## How to Use

To clone the project, run the following command:

```bash
git clone https://github.com/heroui-inc/vite-template.git
```

### Install dependencies

You can use one of them `npm`, `yarn`, `pnpm`, `bun`, Example using `npm`:

```bash
npm install
```

### Run the development server

```bash
npm run dev
```

### Setup pnpm (optional)

If you are using `pnpm`, you need to add the following code to your `.npmrc` file:

```bash
public-hoist-pattern[]=*@heroui/*
```

After modifying the `.npmrc` file, you need to run `pnpm install` again to ensure that the dependencies are installed correctly.

## License

Licensed under the [MIT license](https://github.com/heroui-inc/vite-template/blob/main/LICENSE).
